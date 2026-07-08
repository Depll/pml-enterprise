import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ProductEntity } from './product.entity';

@Entity('ingredient') // Tabellenname auf Englisch geändert
export class IngredientEntity {
  // Klassenname auf Englisch geändert

  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  // unique true no more needed
  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.0 })
  extraPrice: number; // von 'aufpreis' zu 'extraPrice'

  // Gegenseite der Beziehung auf die neuen englischen Felder angepasst
  @ManyToMany(() => ProductEntity, (product) => product.ingredients)
  products: ProductEntity[]; // von 'produkte' zu 'products'
}
