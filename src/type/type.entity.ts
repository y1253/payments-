// src/type/type.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { Role } from '../rule/rule.entity';
import { Item } from '../transactions/item.entity';

@Entity('type')
export class Type {
  @PrimaryGeneratedColumn()
  type_id!: number;

  @Column({ length: 145 })
  type!: string;

  @OneToMany(() => Item, (item) => item.type)
  items!: Item[];

  @OneToMany(() => Role, (role) => role.roleType)
  roles!: Role[];
}