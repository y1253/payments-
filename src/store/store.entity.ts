import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Index,
} from 'typeorm';
import { Transactions } from '../transactions/transactions.entity';


@Entity('store')
export class Store {
@PrimaryGeneratedColumn()
store_id!: number;
@Column({ length: 255 })
name!: string;

@Column({ length: 255 })
street!: string;

@Column({ length: 145 })
city!: string;

@Column({ length: 145, nullable: true })
region!: string;   // instead of state

@Column({ length: 45, nullable: true })
postal_code!: string;

@Column({ length: 145 })
country!: string;
 @OneToMany(() => Transactions, (tr) => tr.store)
  transaction!: Transactions[];
}