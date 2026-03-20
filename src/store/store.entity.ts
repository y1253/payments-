// src/store/store.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { Transaction } from '../transactions/transactions.entity';
import { Role } from '../rule/rule.entity';

@Entity('store')
export class Store {
  @PrimaryGeneratedColumn()
  store_id!: number;

  @Column({ length: 245, nullable: true })
  name!: string;

  @Column({ length: 245, nullable: true })
  street!: string;

  @Column({ length: 145, nullable: true })
  city!: string;

  @Column({ length: 145, nullable: true })
  region!: string;

  @Column({ length: 45, nullable: true })
  postal_code!: string;

  @Column({ length: 45, nullable: true })
  country!: string;

  @OneToMany(() => Transaction, (transaction) => transaction.store)
  transactions!: Transaction[];

  @OneToMany(() => Role, (role) => role.store)
  roles!: Role[];
}