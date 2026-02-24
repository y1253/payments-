// src/entities/user.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Cc } from '../cc/cc.entity';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn({ name: 'user_id' })
  user_id!: number;

  @Column({ name: 'first_name', length: 145, nullable: true })
  first_name!: string;

  @Column({ name: 'last_name', length: 145, nullable: true })
  last_name!: string;

  @Column({ length: 145, nullable: true })
  email!: string;

  @Column({ length: 245 })
  password!: string;

  @Column({ name: 'auth_type', length: 45, nullable: true })
  auth_type!: string;

  @CreateDateColumn({ name: 'create_at' })
  createAt!: Date;

  @OneToMany(() => Cc, (cc) => cc.user)
  cards!: Cc[];
}