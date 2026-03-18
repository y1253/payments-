

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Transaction } from './transactions.entity';
import { ItemTypes } from '../item-types/item-types.entity';

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

  @ManyToOne(() => Transaction, (transaction) => transaction.items)
  @JoinColumn({ name: 'transaction_id' })
  transaction!: Transaction;

  @ManyToOne(() => ItemTypes, (itemTypes) => itemTypes.items, { nullable: true })
  @JoinColumn({ name: 'item_types_id' })
  itemType?: ItemTypes;
}