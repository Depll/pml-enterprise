import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('zutat')
export class ZutatEntity {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  anzeigename: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1.5 })
  aufpreis: number;
}
