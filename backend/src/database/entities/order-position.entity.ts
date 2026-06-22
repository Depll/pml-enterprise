import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { ProduktEntity } from '../entities/produkt.entity'; // Pfad zu deiner Produkt-Entity anpassen

@Entity('bestellung_position')
export class OrderPosition {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  menge: number;

  @Column({ name: 'preis_snapshot', type: 'numeric', precision: 10, scale: 2 })
  preisSnapshot: number;

  @Column({ type: 'text', nullable: true })
  anmerkung: string;

  // Wir speichern die IDs der gewählten/entfernten Zutaten einfach als JSON-Arrays,
  // da PostgreSQL das nativ unterstützt und es für historische Bestellungen performanter ist.
  @Column({ name: 'gewaehlte_zutaten_ids', type: 'jsonb', default: [] })
  gewaehlteZutatenIds: number[];

  @Column({ name: 'entfernte_zutaten_ids', type: 'jsonb', default: [] })
  entfernteZutatenIds: number[];

  // Verknüpfung zur Hauptbestellung
  @ManyToOne(() => Order, (order) => order.positionen, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bestellung_id' })
  order: Order;

  // Verknüpfung zum Original-Produkt
  @ManyToOne(() => ProduktEntity)
  @JoinColumn({ name: 'produkt_id' })
  product: ProduktEntity;

  @Column({ name: 'produkt_id' })
  produktId: number;
}
