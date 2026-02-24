// src/entities/cc.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../users/users.entity';
import { Transactions } from '../transactions/transactions.entity';

@Entity('cc')
export class Cc {
  @PrimaryGeneratedColumn({ name: 'cc_id' })
  cc_id!: number;

  @Column({ name: 'user_id' })
  user_id!: number;

  // The encrypted card number (AES-256 encrypted)
  @Column({ name: 'encrypted_number', length: 512, nullable: true })
  encrypted_number!: string;

  // Deterministic hash for fast lookups — INDEXED
  @Index('idx_cc_hash')
  @Column({ length: 64 })
  hash!: string;

  @Column({ name: 'last_4', length: 4, nullable: true })
  last_4!: string;

  @ManyToOne(() => User, (user) => user.cards)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @OneToMany(() => Transactions, (transaction) => transaction.cc)
  transactions!: Transactions[];
}