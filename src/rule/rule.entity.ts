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

@Entity('role')
export class Role {
  @PrimaryGeneratedColumn({ name: 'role_id' })
  role_id!: number;

  @Column({ name: 'store_id', type: 'int' })
  store_id!: number;

  @Column({ name: 'type_id', type: 'int' })
  type_id!: number;

  @Column({ name: 'user_id', type: 'int' })
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