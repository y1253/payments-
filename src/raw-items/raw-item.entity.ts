import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('raw_item')
export class RawItem {
  @PrimaryGeneratedColumn({ name: 'raw_item_id' })
  raw_item_id!: number;

  // Raw item text/value
  @Column({ name: 'item', type: 'varchar', length: 345 })
  item!: string;

  @Column({ name: 'item_types_id', type: 'int' })
  item_types_id!: number;
}

