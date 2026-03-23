

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,

} from 'typeorm';
import { Transaction } from './transactions.entity';
import { Type } from '../type/type.entity';
import { Category } from '../category/category.entity';

@Entity('item')
export class Item {
  @PrimaryGeneratedColumn()
  item_id!: number;

  @Column()
  transaction_id!: number;

  @Column({ length: 345, nullable: true })
  item!: string;

  @Column('decimal', { precision: 9, scale: 2 })
  price!: number;

  /** How many units at `price` each. */
  @Column({ name: 'quantity', type: 'int', default: 1 })
  quantity!: number;

  @Column({ name: 'type_id' })
  type_id!: number;

  @Column({ name: 'user_id' })
  user_id!: number;

  @Column({ name: 'category_id' })
  category_id!: number;

  @ManyToOne(() => Transaction, (transaction) => transaction.items)
  @JoinColumn({ name: 'transaction_id' })
  transaction!: Transaction;

  @ManyToOne(() => Type, (type) => type.items, { nullable: false })
  @JoinColumn({ name: 'type_id' })
  type!: Type;

  // Join uses `category_id` (auto_increment => unique across table).
  // `user_id` is still stored in this row for correctness with the composite PK.
  @ManyToOne(() => Category, (category) => category.items, { nullable: false })
  @JoinColumn({ name: 'category_id', referencedColumnName: 'category_id' })
  category!: Category;
}