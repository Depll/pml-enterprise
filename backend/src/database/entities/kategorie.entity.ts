import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('kategorie')
export class KategorieEntity {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  label: string;
}
