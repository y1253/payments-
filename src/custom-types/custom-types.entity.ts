import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/users.entity';
import { Type } from '../type/type.entity';
import { ItemTypes } from '../item-types/item-types.entity';

@Entity('custom_types')
export class CustomTypes {
  @PrimaryGeneratedColumn({ name: 'custom_type_id' })
  custom_type_id!: number;

  @Column({ name: 'user_id' })
  user_id!: number;

  @Column({ name: 'type_id' })
  type_id!: number;

  @Column({ name: 'item_types_id' })
  item_types_id!: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Type, { nullable: false })
  @JoinColumn({ name: 'type_id' })
  type!: Type;

  @ManyToOne(() => ItemTypes, { nullable: false })
  @JoinColumn({ name: 'item_types_id' })
  itemTypes!: ItemTypes;
}

