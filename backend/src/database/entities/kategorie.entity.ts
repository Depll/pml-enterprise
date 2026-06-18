import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ProduktEntity } from './produkt.entity';

@Entity('kategorie')
export class KategorieEntity {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  label: string;

  @OneToMany(() => ProduktEntity, (produkt) => produkt.kategorie)
  produkte: ProduktEntity[];
}
