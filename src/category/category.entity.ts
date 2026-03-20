import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../users/users.entity';
import { Item } from '../transactions/item.entity';

@Entity('category')
export class Category {
  @PrimaryGeneratedColumn({ name: 'category_id' })
  category_id!: number;

  // Composite PK: (category_id, user_id)
  @PrimaryColumn({ name: 'user_id', type: 'int' })
  user_id!: number;

  @Column({ name: 'category', length: 145 })
  category!: string;

  @CreateDateColumn({ name: 'create_at', type: 'datetime' })
  create_at!: Date;

  @ManyToOne(() => User, (user) => user.categories, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @OneToMany(() => Item, (item) => item.category)
  items!: Item[];
}

