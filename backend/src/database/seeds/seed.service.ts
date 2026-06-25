import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryEntity } from '../entities/category.entity';
import { ProductEntity } from '../entities/product.entity';
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
  ) {}

  async runSeed() {
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

          // --- NEU: Zuweisung von Größen und Auswahloptionen basierend auf der Kategorie ---
          let finalSizes: any[] | null = null;
          let finalOptions: string[] | null = null;

          if (cleanCategoryName === 'pizza') {
            finalSizes = [
              { name: 'Normal', price: parsedPrice, extraIngredientPrice: 1.5 },
              {
                name: 'XXL',
                price: parsedPrice + 4.0,
                extraIngredientPrice: 2.0,
              },
              { name: 'Partyblech', price: 30.0, extraIngredientPrice: 4.0 },
            ];
          } else if (cleanCategoryName === 'salate') {
            finalOptions = [
              'Joghurt-Dressing',
              'Essig-Öl-Dressing',
              'Kein Dressing',
            ];
          } else if (cleanCategoryName === 'nudelgerichte') {
            finalOptions = [
              'Spaghetti',
              'Rigatoni',
              'Tortellini',
              'Tagliatelle',
            ];
          }

          // Produkt in die neue englische Entity-Struktur schreiben
          produkt = this.productRepository.create({
            sku: finalSku,
            name: finalName,
            description: produktItem.description,
            price: parsedPrice,
            isActive: true,
            category: kategorie,
            ingredients: produktZutaten,
            sizes: finalSizes,
            options: finalOptions,
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
  }
}
