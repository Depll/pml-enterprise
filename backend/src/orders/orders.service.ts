import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../database/entities/order.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async createOrder(orderData: any): Promise<Order> {
    const newOrder = this.orderRepository.create(orderData as object);
    const savedOrder = await this.orderRepository.save(newOrder);
    return savedOrder;
  }

  async findAllOrders(): Promise<Order[]> {
    return await this.orderRepository.find({
      relations: {
        positionen: {
          product: true,
        },
      },
      order: {
        bestelltAm: 'DESC',
      },
    });
  }

  // GEÄNDERT: Speichert jetzt auch den Stornogrund ab, falls einer mitgegeben wird
  async updateStatus(
    id: number,
    status: string,
    stornoGrund: string | undefined,
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Bestellung mit ID ${id} nicht gefunden`);
    }

    order.status = status;

    // NEU: Wenn ein Stornogrund übergeben wird, tragen wir ihn ein (sonst bleibt er null/undefined)
    if (stornoGrund !== undefined) {
      order.stornoGrund = stornoGrund;
    }

    return await this.orderRepository.save(order);
  }
}
