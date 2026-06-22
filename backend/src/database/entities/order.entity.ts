import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { OrderPosition } from './order-position.entity';

@Entity('bestellung')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'kunde_name', type: 'varchar', length: 150 })
  kundeName: string;

  @Column({ type: 'varchar', length: 100 })
  strasse: string;

  @Column({ type: 'varchar', length: 10 })
  hausnummer: string;

  @Column({ type: 'varchar', length: 5 })
  plz: string;

  @Column({ type: 'varchar', length: 50, default: 'Leverkusen' })
  stadt: string;

  @Column({ type: 'varchar', length: 30 })
  telefon: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  email: string;

  @Column({ name: 'liefer_anmerkung', type: 'text', nullable: true })
  lieferAnmerkung: string;

  @Column({ name: 'gesamt_preis', type: 'numeric', precision: 10, scale: 2 })
  gesamtPreis: number;

  @CreateDateColumn({ name: 'bestellt_am' })
  bestelltAm: Date;

  // Beziehung zu den einzelnen Pizzen/Gerichten dieser Bestellung
  @OneToMany(() => OrderPosition, (position) => position.order, {
    cascade: true,
  })
  positionen: OrderPosition[];
}
