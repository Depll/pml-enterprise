import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { OrderPosition } from './order-position.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'customer_name', type: 'varchar', length: 150 })
  customerName: string;

  @Column({ type: 'varchar', length: 100 })
  street: string;

  @Column({ name: 'house_number', type: 'varchar', length: 10 })
  houseNumber: string;

  @Column({ type: 'varchar', length: 5 })
  postcode: string;

  @Column({ type: 'varchar', length: 50, default: 'Leverkusen' })
  city: string;

  @Column({ type: 'varchar', length: 30 })
  phone: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  email: string;

  @Column({ name: 'delivery_note', type: 'text', nullable: true })
  deliveryNote: string;

  // Falls du den Gesamtpreis mitspeichern willst, lassen wir ihn drin
  @Column({
    name: 'total_price',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  totalPrice: number;

  @Column({ type: 'varchar', length: 20, default: 'open' })
  status: string;

  // GEÄNDERT: Auf 'stornoReason' angepasst, damit es zum Service & DTO passt!
  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  stornoReason: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // GEÄNDERT: Zu 'positions' umbenannt, damit die Relations-Abfrage klappt!
  @OneToMany(() => OrderPosition, (position) => position.order, {
    cascade: true,
  })
  positions: OrderPosition[];
}
