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
import { Store } from '../store/store.entity';

@Entity('transactions')
export class Transactions {
  @PrimaryGeneratedColumn({ name: 'transactions_id' })
  transactionId!: number;

  @Column({ name: 'cc_id' })
  ccId!: number;

  @Column({ name: 'store_id' })
  store_id!: number;

  @CreateDateColumn({ name: 'create_at' })
  createAt!: Date;

  @ManyToOne(() => Cc, (cc) => cc.transactions)
  @JoinColumn({ name: 'cc_id' })
  cc!: Cc;

  @ManyToOne(() => Store, (store) => store.transaction)
    @JoinColumn({ name: 'store_id' })
    store!: Store;

  @OneToMany(() => Item, (item) => item.transactions)
  items!: Item[];
}