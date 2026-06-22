import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KategorieEntity } from '../database/entities/kategorie.entity';
import { ProduktEntity } from '../database/entities/produkt.entity';
import { ZutatEntity } from '../database/entities/zutat.entity';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  Length,
} from 'class-validator';

export class CreateProductDto {
  @IsString({ message: 'Der Name muss ein Text sein.' })
  @Length(2, 50, {
    message: 'Der Name muss zwischen 2 und 50 Zeichen lang sein.',
  })
  name: string;

  @IsOptional()
  @IsString({ message: 'Die Beschreibung muss ein Text sein.' })
  beschreibung?: string;

  @IsNumber({}, { message: 'Der Preis muss eine Zahl sein.' })
  @Min(0, { message: 'Der Preis darf nicht negativ sein.' })
  preis: number;

  @IsNumber({}, { message: 'Die Kategorie-ID muss eine Zahl sein.' })
  kategorieId: number;

  @IsOptional()
  @IsBoolean({ message: 'Aktiv muss ein Boolean sein.' })
  aktiv?: boolean;
}

export class UpdateZutatDto {
  @IsOptional()
  @IsString({ message: 'Der Name muss ein Text sein.' })
  @Length(2, 50, {
    message: 'Der Name muss zwischen 2 und 50 Zeichen lang sein.',
  })
  name?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Der Aufpreis muss eine Zahl sein.' })
  @Min(0, { message: 'Der Aufpreis darf nicht negativ sein.' })
  aufpreis?: number;
}

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(KategorieEntity)
    private readonly kategorieRepository: Repository<KategorieEntity>,

    @InjectRepository(ProduktEntity)
    private readonly produktRepository: Repository<ProduktEntity>,

    @InjectRepository(ZutatEntity)
    private readonly zutatRepository: Repository<ZutatEntity>,
  ) {}

  async getSpeisekarte() {
    return await this.kategorieRepository.find({
      relations: {
        produkte: {
          zutaten: true,
        },
      },
      order: {
        id: 'ASC',
      },
    });
  }

  async addGericht(productData: CreateProductDto) {
    const { kategorieId, ...restlicheDaten } = productData;

    const neuesProdukt = this.produktRepository.create({
      ...restlicheDaten,
      kategorie: { id: Number(kategorieId) } as KategorieEntity,
    });

    return await this.produktRepository.save(neuesProdukt);
  }

  async updateGericht(id: number, productData: Partial<CreateProductDto>) {
    const produkt = await this.produktRepository.findOne({ where: { id } });
    if (!produkt) {
      throw new NotFoundException(`Gericht mit ID ${id} nicht gefunden`);
    }

    const { kategorieId, ...restlicheDaten } = productData;

    if (kategorieId) {
      produkt.kategorie = { id: Number(kategorieId) } as KategorieEntity;
    }

    Object.assign(produkt, restlicheDaten);
    return await this.produktRepository.save(produkt);
  }

  async addZutat(
    produktId: number,
    zutatData: { name: string; preis: number },
  ) {
    const produkt = await this.produktRepository.findOne({
      where: { id: produktId },
    });
    if (!produkt) {
      throw new NotFoundException(`Produkt mit ID ${produktId} nicht gefunden`);
    }

    // Korrektur: Nutzt 'aufpreis' und übergibt das Produkt in einem Array [produkt]
    const neueZutat = this.zutatRepository.create({
      name: zutatData.name,
      aufpreis: Number(zutatData.preis),
      produkte: [produkt],
    });

    return await this.zutatRepository.save(neueZutat);
  }

  async updateZutat(id: number, zutatData: UpdateZutatDto) {
    const zutat = await this.zutatRepository.findOne({ where: { id } });
    if (!zutat) {
      throw new NotFoundException(`Zutat mit ID ${id} nicht gefunden`);
    }
    Object.assign(zutat, zutatData);
    return await this.zutatRepository.save(zutat);
  }

  async deleteGericht(id: number) {
    const produkt = await this.produktRepository.findOne({ where: { id } });
    if (!produkt) {
      throw new NotFoundException(`Gericht mit ID ${id} nicht gefunden`);
    }
    return await this.produktRepository.remove(produkt);
  }

  async deleteZutat(id: number) {
    const zutat = await this.zutatRepository.findOne({ where: { id } });
    if (!zutat) {
      throw new NotFoundException(`Zutat mit ID ${id} nicht gefunden`);
    }
    return await this.zutatRepository.remove(zutat);
  }
}
