import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../database/entities/order.entity';
import { OrderPosition } from '../database/entities/order-position.entity';
import { CreateOrderDto } from './dto/orders.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    const { positions, ...orderData } = createOrderDto;

    const order = this.orderRepository.create(orderData);

    order.positions = positions.map((pos) => {
      const positionInstance = new OrderPosition();

      positionInstance.quantity = pos.quantity;
      positionInstance.priceSnapshot = pos.priceSnapshot;

      // Weist einen leeren String zu, falls das Feld undefined oder null ist
      positionInstance.selectedSize = pos.selectedSize ?? '';
      positionInstance.selectedOption = pos.selectedOption ?? '';
      positionInstance.comment = pos.comment ?? '';

      positionInstance.selectedIngredientsIds =
        pos.selectedIngredientsIds || [];

      positionInstance.removedIngredientsIds = pos.removedIngredientsIds || [];

      positionInstance.productId = Number(pos.productId);

      return positionInstance;
    });

    return await this.orderRepository.save(order);
  }

  async findAllOrders(): Promise<Order[]> {
    return await this.orderRepository.find({
      relations: {
        positions: {
          product: true,
        },
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async updateStatus(
    id: string,
    status: string,
    stornoReason: string | undefined,
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Bestellung mit ID ${id} nicht gefunden`);
    }

    order.status = status;

    if (stornoReason !== undefined) {
      order.stornoReason = stornoReason;
    }

    return await this.orderRepository.save(order);
  }
}
