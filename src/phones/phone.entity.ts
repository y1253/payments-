import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/users.entity';

@Entity('phones')
export class Phone {
  @PrimaryGeneratedColumn({ name: 'phone_id' })
  phone_id!: number;

  @Column({ name: 'phone', length: 20 })
  phone!: string;

  @Column({ name: 'user_id', type: 'int' })
  user_id!: number;

  @CreateDateColumn({ name: 'create_at', type: 'datetime' })
  create_at!: Date;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
