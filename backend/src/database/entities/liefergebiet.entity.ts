import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('liefergebiet')
export class Liefergebiet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 5 })
  plz: string; // Hier speichern wir die 5-stellige Postleitzahl als String (z.B. '51373')

  @Column({ default: 'Leverkusen' })
  stadt: string; // Standardmäßig Leverkusen
}
