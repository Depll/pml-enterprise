import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Liefergebiet } from '../database/entities/liefergebiet.entity';

@Injectable()
export class LiefergebietService {
  constructor(
    @InjectRepository(Liefergebiet)
    private liefergebietRepository: Repository<Liefergebiet>,
  ) {}

  async checkPlz(plz: string): Promise<boolean> {
    const gebiet = await this.liefergebietRepository.findOne({
      where: { plz },
    });
    return !!gebiet;
  }
}
