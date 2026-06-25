import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { ProductEntity } from './product.entity';

@Entity('order_position')
export class OrderPosition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ name: 'price_snapshot', type: 'numeric', precision: 10, scale: 2 })
  priceSnapshot: number;

  @Column({
    name: 'selected_size',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  selectedSize: string;

  @Column({
    name: 'selected_option',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  selectedOption: string;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ name: 'ingredients_text', type: 'text', nullable: true })
  ingredientsText: string;

  @Column({ name: 'selected_ingredients_ids', type: 'jsonb', default: [] })
  selectedIngredientsIds: number[];

  @Column({ name: 'removed_ingredients_ids', type: 'jsonb', default: [] })
  removedIngredientsIds: number[];

  @ManyToOne(() => Order, (order) => order.positions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  // Verknüpft die Relation sauber mit der product_id Spalte darunter
  @ManyToOne(() => ProductEntity)
  @JoinColumn({ name: 'product_id', referencedColumnName: 'id' })
  product: ProductEntity;

  // GEÄNDERT: Typ von 'uuid' auf 'int' geändert, da deine Produkt-IDs Nummern sind!
  @Column({ name: 'product_id', type: 'int' })
  productId: number;
}
