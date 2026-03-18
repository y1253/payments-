// src/type/type.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import {  Rule } from '../rule/rule.entity';
import { ItemTypes } from '../item-types/item-types.entity';

@Entity('type')
export class Type {
  @PrimaryGeneratedColumn()
  type_id!: number;

  @Column({ length: 145 })
  type!: string;

  @OneToMany(() => ItemTypes, (itemTypes) => itemTypes.type)
  itemTypes!: ItemTypes[];

  @OneToMany(() => Rule, (role) => role.roleType)
  roles!: Rule[];
}