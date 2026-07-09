import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../database/entities/order.entity';
import { OrderPosition } from '../database/entities/order-position.entity';
import { CreateOrderDto } from './dto/orders.dto';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectBot() private readonly bot: Telegraf<any>,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    // Nimmt telegramChatId automatisch aus den orderData mit auf
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

    // 1. In der Datenbank speichern
    const savedOrder = await this.orderRepository.save(order);

    // 2. Status-Update an Telegram senden, falls eine Chat-ID vorhanden ist
    if (savedOrder.telegramChatId) {
      let message = `🔔 *Status-Update zu deiner Bestellung # ${savedOrder.id.substring(0, 8)}...*\n\n`;

      switch (status) {
        case 'IN_PREPARATION':
          message += `🍕 Deine Bestellung wird jetzt frisch zubereitet und ist gleich im Ofen!`;
          break;
        case 'IN_DELIVERY':
          message += `🚀 Gute Nachrichten! Deine Pizza ist auf dem Weg zu dir und wird heiß geliefert.`;
          break;
        case 'COMPLETED':
          message += `✅ Deine Bestellung wurde erfolgreich übergeben. Guten Appetit! 🎉`;
          break;
        case 'CANCELLED':
          message += `❌ Deine Bestellung musste leider storniert werden.\nGrund: ${stornoReason || 'Keine Angabe'}`;
          break;
        default:
          // Bei jedem anderen Status senden wir keine Nachricht, geben aber die Bestellung zurück
          return savedOrder;
      }

      try {
        await this.bot.telegram.sendMessage(
          savedOrder.telegramChatId,
          message,
          {
            parse_mode: 'Markdown',
          },
        );
      } catch (error) {
        // Fehler wird nur geloggt, damit die HTTP-Response (200 OK) nicht fehlschlägt
        console.error(`Fehler beim Senden des Telegram-Status-Updates:`, error);
      }
    }

    return savedOrder;
  }
}
