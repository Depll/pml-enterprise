/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../database/entities/order.entity';
import { OrderPosition } from '../database/entities/order-position.entity';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderPosition)
    private readonly positionRepository: Repository<OrderPosition>,
  ) {}

  async getDashboardStatistics() {
    // 1. Umsatz & Bestellungen Heute
    const todayResult = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.totalPrice - order.discountAmount)', 'revenueToday')
      .addSelect('COUNT(order.id)', 'countToday')
      .where('order.createdAt >= CURRENT_DATE')
      .andWhere('order.status != :storno', { storno: 'storniert' })
      .getRawOne();

    // 2. Umsatz & Bestellungen Gestern
    const yesterdayResult = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.totalPrice - order.discountAmount)', 'revenueYesterday')
      .addSelect('COUNT(order.id)', 'countYesterday')
      .where('order.createdAt >= CURRENT_DATE - INTERVAL \'1 day\'')
      .andWhere('order.createdAt < CURRENT_DATE')
      .andWhere('order.status != :storno', { storno: 'storniert' })
      .getRawOne();

    // 3. Umsatz Gesamt
    const totalResult = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.totalPrice - order.discountAmount)', 'totalRevenue')
      .addSelect('COUNT(order.id)', 'totalOrders')
      .where('order.status != :storno', { storno: 'storniert' })
      .getRawOne();

    // 4. Bestellungen nach Wochentagen (0 = Sonntag, 1 = Montag, ...)
    const weekdayResult = await this.orderRepository
      .createQueryBuilder('order')
      .select("EXTRACT(DOW FROM order.createdAt)", 'dow')
      .addSelect('COUNT(order.id)', 'count')
      .addSelect('SUM(order.totalPrice - order.discountAmount)', 'revenue')
      .where('order.status != :storno', { storno: 'storniert' })
      .groupBy('dow')
      .orderBy('dow', 'ASC')
      .getRawMany();

    const weekdayMap = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    const ordersByWeekday = weekdayResult.map((row) => ({
      day: weekdayMap[parseInt(row.dow, 10)],
      count: parseInt(row.count, 10),
      revenue: parseFloat(row.revenue || 0),
    }));

    // 5. Top 5 meistverkaufte Gerichte
    const topProducts = await this.positionRepository
      .createQueryBuilder('pos')
      .leftJoin('pos.product', 'product')
      .leftJoin('pos.order', 'order')
      .select('product.name', 'name')
      .addSelect('SUM(pos.quantity)', 'totalQuantity')
      .where('order.status != :storno', { storno: 'storniert' })
      .groupBy('product.name')
      .orderBy('"totalQuantity"', 'DESC')
      .limit(5)
      .getRawMany();

    return {
      today: {
        revenue: Math.max(0, parseFloat(todayResult.revenueToday || 0)),
        count: parseInt(todayResult.countToday || 0),
      },
      yesterday: {
        revenue: Math.max(0, parseFloat(yesterdayResult.revenueYesterday || 0)),
        count: parseInt(yesterdayResult.countYesterday || 0),
      },
      total: {
        revenue: Math.max(0, parseFloat(totalResult.totalRevenue || 0)),
        count: parseInt(totalResult.totalOrders || 0),
      },
      ordersByWeekday,
      topProducts: topProducts.map((p) => ({
        name: p.name || 'Unbekanntes Gericht',
        quantity: parseInt(p.totalQuantity, 10),
      })),
    };
  }
}