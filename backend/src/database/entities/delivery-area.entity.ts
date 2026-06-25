import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('delivery_area')
export class DeliveryAreaEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 5 })
  plz: string;

  @Column({ default: 'Leverkusen' })
  city: string;
}
