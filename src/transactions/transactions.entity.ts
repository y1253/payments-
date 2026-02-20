// src/entities/transaction.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Cc } from '../cc/cc.entity';
import { Item } from './item.entity';

@Entity('transactions')
export class Transactions {
  @PrimaryGeneratedColumn({ name: 'transactions_id' })
  transactionId!: number;

  @Column({ name: 'cc_id' })
  ccId!: number;

  @CreateDateColumn({ name: 'create_at' })
  createAt!: Date;

  @ManyToOne(() => Cc, (cc) => cc.transactions)
  @JoinColumn({ name: 'cc_id' })
  cc!: Cc;

  @OneToMany(() => Item, (item) => item.transactions)
  items!: Item[];
}