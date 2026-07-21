import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('voucher')
export class VoucherEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string; // e.g : 'DISCOUNT10' or WELCOME20'

  @Column({ type: 'enum', enum: ['PERCENTAGE', 'FIXED'] })
  type: 'PERCENTAGE' | 'FIXED';

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  value: number; // e.g : 10.00 for 10% or 20.00 for $20 off

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  minOrderValue: number; // Mindestbestellwert, damit der Code gilt

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date; // e.g : '2023-12-31T23:59:59Z'

  @CreateDateColumn()
  createdAt: Date;
}
