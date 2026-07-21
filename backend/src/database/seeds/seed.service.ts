import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryEntity } from '../entities/category.entity';
import { VoucherEntity } from '../entities/voucher.entity';
import { ProductEntity, ProductSize } from '../entities/product.entity';
import { IngredientEntity } from '../entities/ingredient.entity';
import * as fs from 'fs';
import * as path from 'path';
import { DeliveryAreaEntity } from '../entities/delivery-area.entity';

interface PizzaItem {
  name: string;
  description: string;
  price: string;
  category: string;
}

interface PizzaCategoryGroup {
  category: string;
  label?: string;
  items: PizzaItem[];
}

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(IngredientEntity)
    private readonly ingredientRepository: Repository<IngredientEntity>,
    @InjectRepository(DeliveryAreaEntity)
    private readonly deliveryAreaRepository: Repository<DeliveryAreaEntity>,
    @InjectRepository(VoucherEntity)
    private readonly voucherRepository: Repository<VoucherEntity>,
  ) {}

  private getDefaultProductMeta(
    cleanCategoryName: string,
    basePrice: number,
  ): { sizes: ProductSize[] | null; options: string[] | null } {
    if (cleanCategoryName === 'pizza') {
      return {
        sizes: [
          { name: 'Normal', price: basePrice, extraIngredientPrice: 1.5 },
          { name: 'XXL', price: basePrice + 4.0, extraIngredientPrice: 2.0 },
          { name: 'Partyblech', price: 30.0, extraIngredientPrice: 4.0 },
        ],
        options: null,
      };
    }

    if (cleanCategoryName === 'salate') {
      return {
        sizes: null,
        options: ['Joghurt-Dressing', 'Essig-Öl-Dressing', 'Kein Dressing'],
      };
    }

    if (cleanCategoryName === 'nudelgerichte') {
      return {
        sizes: null,
        options: ['Spaghetti', 'Rigatoni', 'Tortellini', 'Tagliatelle'],
      };
    }

    return { sizes: null, options: null };
  }

  async runSeed() {
    const productCount = await this.productRepository.count();

    if (productCount > 0) {
      console.log(
        '🌱 Datenbank enthält bereits Daten. Seeding wird übersprungen.',
      );
      return; // Beendet die Methode vorzeitig, damit kein Fehler fliegt
    }

    console.log(
      'Starte Enterprise-Datenbank-Seeding mit Größen und Optionen...',
    );

    // 1. JSON-Datei einlesen
    const filePath = path.join(
      process.cwd(),
      'src',
      'database',
      'products.json',
    );
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const sourceProducts = JSON.parse(rawData) as PizzaCategoryGroup[];

    // 2. Standard-Zutaten vorab anlegen
    const zutatenNamen = [
      'Tomatensauce',
      'Käse',
      'Salami',
      'Schinken',
      'Pilze',
      'Thunfisch',
      'Zwiebeln',
    ];
    const zutatenMap = new Map<string, IngredientEntity>();

    for (const name of zutatenNamen) {
      let zutat = await this.ingredientRepository.findOne({ where: { name } });
      if (!zutat) {
        zutat = this.ingredientRepository.create({ name, extraPrice: 1.0 });
        await this.ingredientRepository.save(zutat);
      }
      zutatenMap.set(name, zutat);
    }

    // 3. Kategorien und deren verschachtelte Produkte importieren
    for (const kategorialesElement of sourceProducts) {
      if (
        !kategorialesElement ||
        !kategorialesElement.category ||
        !kategorialesElement.items
      ) {
        continue;
      }

      // 3a. REGEL 1: Kategorie-Name komplett klein, ohne Umlaute, ohne Leerzeichen
      const cleanCategoryName = kategorialesElement.category
        .toLowerCase()
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/\s+/g, '-');

      let kategorie = await this.categoryRepository.findOne({
        where: { name: cleanCategoryName },
      });

      if (!kategorie) {
        kategorie = this.categoryRepository.create({
          name: cleanCategoryName,
          label: kategorialesElement.label || kategorialesElement.category,
        });
        kategorie = await this.categoryRepository.save(kategorie);
      }

      // Fallback-Zähler falls ein Produkt keine Nummer besitzt (z. B. Getränke)
      let fallbackCounter = 1;

      // 3b. Produkte durchlaufen
      for (const produktItem of kategorialesElement.items) {
        if (!produktItem || !produktItem.name) continue;

        let produkt = await this.productRepository.findOne({
          where: { name: produktItem.name },
        });

        if (!produkt) {
          const parsedPrice = parseFloat(produktItem.price.replace(',', '.'));
          const produktZutaten: IngredientEntity[] = [];

          zutatenMap.forEach((zutatObj, zutatName) => {
            if (
              produktItem.description &&
              produktItem.description
                .toLowerCase()
                .includes(zutatName.toLowerCase())
            ) {
              produktZutaten.push(zutatObj);
            }
          });

          // REGEL 2: Artikelnummer (SKU) und Name strikt trennen per Regex
          let finalSku = '';
          let finalName = produktItem.name;

          const match = produktItem.name.match(/^(\d+)\s*-\s*(.+)$/);

          if (match) {
            finalSku = match[1];
            finalName = match[2];
          } else {
            finalSku = `${cleanCategoryName.toUpperCase()}-${fallbackCounter}`;
            fallbackCounter++;
          }

          const defaultMeta = this.getDefaultProductMeta(
            cleanCategoryName,
            parsedPrice,
          );

          // Produkt in die neue englische Entity-Struktur schreiben
          produkt = this.productRepository.create({
            sku: finalSku,
            name: finalName,
            description: produktItem.description,
            price: parsedPrice,
            isActive: true,
            category: kategorie,
            ingredients: produktZutaten,
            sizes: defaultMeta.sizes,
            options: defaultMeta.options,
          });

          await this.productRepository.save(produkt);
        }
      }
    }

    // 4. Liefergebiete anlegen
    const LeverkusenPlzs = [
      '51371',
      '51373',
      '51375',
      '51377',
      '51379',
      '51381',
    ];

    for (const plz of LeverkusenPlzs) {
      const existiert = await this.deliveryAreaRepository.findOne({
        where: { plz },
      });
      if (!existiert) {
        await this.deliveryAreaRepository.save({ plz, city: 'Leverkusen' });
      }
    }

    console.log(
      'Datenbank-Seeding mitsamt allen Korrekturen erfolgreich beendet!',
    );

    // 5. Test-Gutscheine anlegen
    const testVouchers = [
      {
        code: 'PML10',
        type: 'PERCENTAGE' as const,
        value: 10.0, // 10% Rabatt
        minOrderValue: 15.0, // ab 15€
        isActive: true,
      },
      {
        code: 'WILLKOMMEN5',
        type: 'FIXED' as const,
        value: 5.0, // 5€ Rabatt
        minOrderValue: 20.0, // ab 20€
        isActive: true,
      },
    ];

    for (const vData of testVouchers) {
      const exists = await this.voucherRepository.findOne({
        where: { code: vData.code },
      });
      if (!exists) {
        await this.voucherRepository.save(this.voucherRepository.create(vData));
        console.log(`🎟️ Gutschein ${vData.code} angelegt!`);
      }
    }
  }
}
