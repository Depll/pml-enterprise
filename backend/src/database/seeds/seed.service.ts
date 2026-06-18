import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KategorieEntity } from '../entities/kategorie.entity';
import { ProduktEntity } from '../entities/produkt.entity';
import { ZutatEntity } from '../entities/zutat.entity';
import * as fs from 'fs';
import * as path from 'path';

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
    @InjectRepository(KategorieEntity)
    private readonly kategorieRepository: Repository<KategorieEntity>,
    @InjectRepository(ProduktEntity)
    private readonly produktRepository: Repository<ProduktEntity>,
    @InjectRepository(ZutatEntity)
    private readonly zutatRepository: Repository<ZutatEntity>,
  ) {}

  async runSeed() {
    console.log('Starte Enterprise-Datenbank-Seeding...');

    // 1. JSON-Datei einlesen
    const filePath = path.join(process.cwd(), 'src', 'database', 'products.json');
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const sourceProducts: PizzaCategoryGroup[] = JSON.parse(rawData);

    // 2. Standard-Zutaten vorab anlegen
    const zutatenNamen = ['Tomatensauce', 'Käse', 'Salami', 'Schinken', 'Pilze', 'Thunfisch', 'Zwiebeln'];
    const zutatenMap = new Map<string, ZutatEntity>();

    for (const name of zutatenNamen) {
      let zutat = await this.zutatRepository.findOne({ where: { name } });
      if (!zutat) {
        zutat = this.zutatRepository.create({ name, aufpreis: 1.00 });
        await this.zutatRepository.save(zutat);
      }
      zutatenMap.set(name, zutat);
    }

    // 3. Kategorien und deren verschachtelte Produkte importieren
    for (const kategorialesElement of sourceProducts) {
      if (!kategorialesElement || !kategorialesElement.category || !kategorialesElement.items) {
        continue;
      }

      // 3a. Kategorie prüfen/erstellen
      let kategorie = await this.kategorieRepository.findOne({
        where: { name: kategorialesElement.category.toLowerCase() },
      });

      if (!kategorie) {
        kategorie = this.kategorieRepository.create({
          name: kategorialesElement.category.toLowerCase(),
          label: kategorialesElement.label || kategorialesElement.category,
        });
        kategorie = await this.kategorieRepository.save(kategorie);
      }

      // 3b. Produkte durchlaufen
      for (const produktItem of kategorialesElement.items) {
        if (!produktItem || !produktItem.name) continue;

        let produkt = await this.produktRepository.findOne({
          where: { name: produktItem.name },
        });

        if (!produkt) {
          const parsedPrice = parseFloat(produktItem.price.replace(',', '.'));
          const produktZutaten: ZutatEntity[] = [];
          
          zutatenMap.forEach((zutatObj, zutatName) => {
            if (
              produktItem.description &&
              produktItem.description.toLowerCase().includes(zutatName.toLowerCase())
            ) {
              produktZutaten.push(zutatObj);
            }
          });

          produkt = this.produktRepository.create({
            name: produktItem.name,
            beschreibung: produktItem.description,
            preis: parsedPrice,
            aktiv: true,
            kategorie: kategorie,
            zutaten: produktZutaten,
          });

          await this.produktRepository.save(produkt);
        }
      }
    }

    console.log('Datenbank-Seeding mitsamt Zutaten erfolgreich beendet!');
  } // <--- Schließt runSeed()
} // <--- Schließt die Klasse SeedService