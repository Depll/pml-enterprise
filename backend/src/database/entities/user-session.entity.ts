import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('user_sessions')
export class UserSessionEntity {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  telegramChatId: string;

  @Column({ type: 'varchar', length: 30, default: 'IDLE' })
  state: string; // IDLE, ORDERING, AWAITING_CORRECTION, etc.

  // Speichert das strukturierte JSON des aktuellen, unfertigen Warenkorbs
  @Column({ type: 'jsonb', default: [] })
  tempCart: any[];

  // Speichert die Zwischenstände der Lieferdaten (Name, Adresse, Telefon, E-Mail, Küchennotiz)
  @Column({ type: 'jsonb', default: {} })
  contactData: {
    customerName?: string;
    street?: string;
    houseNumber?: string;
    postcode?: string;
    city?: string;
    phone?: string;
    email?: string;
    deliveryNote?: string;
    kitchenNote?: string;
  };

  // Speichert die letzten X Nachrichten als Kontext-Array für OpenAI
  @Column({ type: 'jsonb', default: [] })
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
