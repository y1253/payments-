// src/entities/transaction-item.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Transactions } from './transactions.entity';

@Entity('item')
export class Item {
  @PrimaryGeneratedColumn({ name: 'item_id' })
  itemId!: number;

  @Column({ name: 'transactions_id' })
  transactionsId!: number;

  @Column({ length: 245 })
  name!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price!: number;

  @Column({ default: 1 })
  quantity!: number;

  @ManyToOne(() => Transactions, (transaction) => transaction.items)
  @JoinColumn({ name: 'transactions_id' })
  transactions!: Transactions;
}