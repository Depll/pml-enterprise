import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeliveryAreaEntity } from '../database/entities/delivery-area.entity'; // Korrekter Import

@Injectable()
export class DeliveryAreaService {
  constructor(
    @InjectRepository(DeliveryAreaEntity)
    private readonly deliveryAreaRepository: Repository<DeliveryAreaEntity>,
  ) {}

  async checkPlz(plz: string): Promise<boolean> {
    const area = await this.deliveryAreaRepository.findOne({
      where: { plz },
    });
    return !!area;
  }
}
