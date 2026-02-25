// src/role/role.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Store } from '../store/store.entity';
import { Type } from '../type/type.entity';
import { User } from '../users/users.entity';

@Entity('rule')
export class Rule {
  @PrimaryGeneratedColumn()
  rule_id!: number;

  @Column()
  store_id!: number;

  @Column()
  type_id!: number;

  @Column()
  user_id!: number;

  @ManyToOne(() => Store, (store) => store.roles)
  @JoinColumn({ name: 'store_id' })
  store!: Store;

  @ManyToOne(() => Type, (type) => type.roles)
  @JoinColumn({ name: 'type_id' })
  roleType!: Type;

  @ManyToOne(() => User, (user) => user.roles)
  @JoinColumn({ name: 'user_id' })
  user!: User;
}