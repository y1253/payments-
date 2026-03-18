import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Type } from '../type/type.entity';
import { Item } from '../transactions/item.entity';

@Entity('item_types')
export class ItemTypes {
  @PrimaryGeneratedColumn({ name: 'item_types_id' })
  item_types_id!: number;

  @Column({ name: 'type_id' })
  type_id!: number;

  @ManyToOne(() => Type, (type) => type.itemTypes, { nullable: false })
  @JoinColumn({ name: 'type_id' })
  type!: Type;

  // optional item name stored per type (nullable in schema)
  // Note: keep property type as `string` (not `string | null`), otherwise
  // TypeORM may detect it as a generic Object column type.
  @Column({ name: 'item', type: 'varchar', length: 245, nullable: true })
  item!: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  created_at!: Date;

  @OneToMany(() => Item, (item) => item.itemType)
  items!: Item[];
}

