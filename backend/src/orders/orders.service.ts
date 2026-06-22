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

  // GEÄNDERT: Holt jetzt alle Bestellungen, damit das Frontend das Archiv befüllen kann
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

  // Setzt den Status einer bestimmten Bestellung auf einen neuen Wert (z.B. 'erledigt' oder 'offen')
  async updateStatus(id: number, status: string): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Bestellung mit ID ${id} nicht gefunden`);
    }
    order.status = status;
    return await this.orderRepository.save(order);
  }
}
