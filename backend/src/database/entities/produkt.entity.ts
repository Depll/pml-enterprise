import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { KategorieEntity } from './kategorie.entity';
import { ZutatEntity } from './zutat.entity';

@Entity('produkt')
export class ProduktEntity {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar', length: 150, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  beschreibung: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  preis: number;

  @Column({ type: 'boolean', default: true })
  aktiv: boolean;

  @ManyToOne(() => KategorieEntity, (kategorie) => kategorie.produkte, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'kategorie_id' })
  kategorie: KategorieEntity;

  @ManyToMany(() => ZutatEntity, (zutat) => zutat.produkte)
  @JoinTable({ name: 'produkt_zutaten' })
  zutaten: ZutatEntity[];
}
