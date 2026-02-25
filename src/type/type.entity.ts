// src/type/type.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { Item } from '../transactions/item.entity';
import {  Rule } from '../rule/rule.entity';

@Entity('type')
export class Type {
  @PrimaryGeneratedColumn()
  type_id!: number;

  @Column({ length: 145 })
  type!: string;

  @OneToMany(() => Item, (item) => item.itemType)
  items!: Item[];

  @OneToMany(() => Rule, (role) => role.roleType)
  roles!: Rule[];
}