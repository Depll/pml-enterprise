import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ProductEntity } from './product.entity';

@Entity('category')
export class CategoryEntity {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string; // Hier kommt z. B. "nudelauflaeufe" rein (klein, ohne Umlaute)

  @Column({ type: 'varchar', length: 100 })
  label: string; // Hier kommt "🍜 Nudelaufläufe" rein (für die Anzeige)

  @OneToMany(() => ProductEntity, (product) => product.category)
  products: ProductEntity[];
}
