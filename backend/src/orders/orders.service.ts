import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../database/entities/order.entity';
import { OrderPosition } from '../database/entities/order-position.entity';
import { CreateOrderDto } from './dto/orders.dto';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { VouchersService } from '../voucher/vouchers.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectBot() private readonly bot: Telegraf<any>,
    private readonly vouchersService: VouchersService,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    const { positions, voucherCode, ...orderData } = createOrderDto;

    const order = this.orderRepository.create(orderData);

    order.positions = positions.map((pos) => {
      const positionInstance = new OrderPosition();

      positionInstance.quantity = pos.quantity;
      positionInstance.priceSnapshot = pos.priceSnapshot;
      positionInstance.selectedSize = pos.selectedSize ?? '';
      positionInstance.selectedOption = pos.selectedOption ?? '';
      positionInstance.comment = pos.comment ?? '';

      positionInstance.selectedIngredientsIds =
        pos.selectedIngredientsIds || [];
      positionInstance.removedIngredientsIds = pos.removedIngredientsIds || [];
      positionInstance.productId = Number(pos.productId);

      return positionInstance;
    });

    // 1. Zwischensumme berechnen
    const subtotal = order.positions.reduce(
      (sum, pos) => sum + Number(pos.priceSnapshot) * pos.quantity,
      0,
    );

    // 2. Gutschein prüfen und Endsumme berechnen
    if (voucherCode && voucherCode.trim().length > 0) {
      const voucherResult = await this.vouchersService.validateVoucher({
        code: voucherCode,
        currentCartTotal: subtotal,
      });

      order.appliedVoucherCode = voucherResult.code;
      order.discountAmount = voucherResult.discountAmount;
      order.totalPrice = voucherResult.newTotal;
    } else {
      order.appliedVoucherCode = null;
      order.discountAmount = 0.0;
      order.totalPrice = subtotal; // WICHTIG: Wenn kein Gutschein, ist der Endpreis = Zwischensumme
    }

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

    const savedOrder = await this.orderRepository.save(order);

    if (savedOrder.telegramChatId) {
      let message = `🔔 *Status-Update zu deiner Bestellung #${savedOrder.id.substring(0, 8)}...*\n\n`;

      switch (status.toLowerCase()) {
        case 'open':
          message += `⏳ Deine Bestellung ist eingegangen und wartet auf Bestätigung!`;
          break;
        case 'zubereitung':
          message += `🍕 Deine Bestellung wird jetzt frisch zubereitet und ist gleich im Ofen!`;
          break;
        case 'erledigt':
          message += `✅ Deine Bestellung wurde erfolgreich übergeben. Guten Appetit! 🎉`;
          break;
        case 'storniert':
          message += `❌ Deine Bestellung musste leider storniert werden.\nGrund: ${stornoReason || 'Keine Angabe'}`;
          break;
        default:
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
        console.error(`Fehler beim Senden des Telegram-Status-Updates:`, error);
      }
    }

    return savedOrder;
  }
}
