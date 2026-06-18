import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KategorieEntity } from '../database/entities/kategorie.entity';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(KategorieEntity)
    private readonly kategorieRepository: Repository<KategorieEntity>,
  ) {}

  async getSpeisekarte() {
    return await this.kategorieRepository.find({
      relations: {
        produkte: {
          zutaten: true, // <-- Lädt die Zutaten für jedes Produkt automatisch mit!
        },
      },
      order: {
        id: 'ASC',
      },
    });
  }
}
