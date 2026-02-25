

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Transaction } from './transactions.entity';
import { Type } from '../type/type.entity';

@Entity('item')
export class Item {
  @PrimaryGeneratedColumn()
  item_id!: number;

  @Column()
  transaction_id!: number;

  @Column({ nullable: true })
  type_id!: number;

  @Column({ length: 345, nullable: true })
  item!: string;

  @Column('decimal', { precision: 9, scale: 2 })
  price!: number;

  @ManyToOne(() => Transaction, (transaction) => transaction.items)
  @JoinColumn({ name: 'transaction_id' })
  transaction!: Transaction;

  @ManyToOne(() => Type, (type) => type.items, { nullable: true })
  @JoinColumn({ name: 'type_id' })
  itemType!: Type;
}