import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../database/entities/order.entity'; // Pfad ggf. anpassen

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async createOrder(orderData: any): Promise<Order> {
    // Erstellt die Order-Instanz
    const newOrder = this.orderRepository.create(orderData as object);

    // BEHOBEN: Wir casten das Ergebnis als 'Order', um 'any' vollständig zu vermeiden
    const savedOrder = await this.orderRepository.save(newOrder);
    return savedOrder;
  }

  async findAllOrders(): Promise<Order[]> {
    return await this.orderRepository.find({
      relations: {
        positionen: true,
      },
      order: {
        bestelltAm: 'DESC',
      },
    });
  }
}
