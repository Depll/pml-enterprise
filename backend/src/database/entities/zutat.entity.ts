import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ProduktEntity } from './produkt.entity';

@Entity('zutat')
export class ZutatEntity {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  name: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.0 })
  aufpreis: number;

  @ManyToMany(() => ProduktEntity, (produkt) => produkt.zutaten)
  produkte: ProduktEntity[];
}
