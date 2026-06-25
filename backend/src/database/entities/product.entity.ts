import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
} from 'typeorm';
import { CategoryEntity } from './category.entity';
import { IngredientEntity } from './ingredient.entity';

// Struktur für die Größen-Definition im Code (Typ-Sicherheit)
export interface ProductSize {
  name: string; // 'Normal', 'XXL', 'Partyblech'
  price: number; // 8.00, 12.00, 30.00
  extraIngredientPrice: number; // 1.50, 2.00, 4.00 (Aufpreis für Extra-Zutaten bei DIESER Größe)
}

@Entity('product')
export class ProductEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  sku: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  price: number; // Das ist der Basispreis (z.B. für die Größe "Normal")

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  // NEU: Für Größen wie Pizza (Normal, XXL, Partyblech) inkl. deren Preisen und Zutaten-Aufpreisen
  @Column({ type: 'jsonb', nullable: true, default: null })
  sizes: ProductSize[] | null;

  // NEU: Für kostenlose Optionen wie ["Spaghetti", "Rigatoni"] oder ["Joghurt", "Essig-Öl", "Kein Dressing"]
  @Column({ type: 'jsonb', nullable: true, default: null })
  options: string[] | null;

  @ManyToOne(() => CategoryEntity, (category) => category.products, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'category_id' })
  category: CategoryEntity;

  @ManyToMany(() => IngredientEntity, (ingredient) => ingredient.products, {
    cascade: true,
  })
  @JoinTable({
    name: 'product_ingredients',
    joinColumn: { name: 'product_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'ingredient_id', referencedColumnName: 'id' },
  })
  ingredients: IngredientEntity[];
}
