

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Cc } from '../cc/cc.entity';
import { Store } from '../store/store.entity';
import { Item } from './item.entity';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  transaction_id!: number;

  @Column()
  cc_id!: number;

  @Column()
  store_id!: number;

  @CreateDateColumn()
  create_at!: Date;

  @ManyToOne(() => Cc, (cc) => cc.transactions)
  @JoinColumn({ name: 'cc_id' })
  cc!: Cc;

  @ManyToOne(() => Store, (store) => store.transactions)
  @JoinColumn({ name: 'store_id' })
  store!: Store;

  @OneToMany(() => Item, (item) => item.transaction)
  items!: Item[];
}