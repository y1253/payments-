import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/users.entity';
import { Cc } from '../cc/cc.entity';
import { Transaction } from '../transactions/transactions.entity';
import { Item } from '../transactions/item.entity';
import { Store } from '../store/store.entity';
import { Role } from '../rule/rule.entity';
import { Type } from '../type/type.entity';
import { Category } from '../category/category.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      driver: require('mysql2'),
      host: 'localhost',
      port: 3306,
      username: 'yg',
      password: '12345',
      database: 'payments',
      // Prevent TypeORM from altering the existing Workbench schema at runtime.
      // Your DB may contain rows that violate FK constraints during schema sync,
      // which causes app startup to fail.
      synchronize: false,
      autoLoadEntities: true,
      entities: [User, Transaction, Cc, Item, Store, Role, Type, Category]

    }),

  ],
  exports: [TypeOrmModule]
})
export class DbConfigModule { }
