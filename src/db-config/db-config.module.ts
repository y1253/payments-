import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/users.entity';
import { Cc } from '../cc/cc.entity';
import { Transactions } from '../transactions/transactions.entity';
import { Item } from '../transactions/item.entity';
import { Store } from '../store/store.entity';

@Module({
    imports:[
        TypeOrmModule.forRoot({     
      type: 'mysql',
      driver: require('mysql2'),
      host: '52.255.206.58',
      port: 3306,
      username: 'yg',
      password: '12345',
      database: 'payments',
      synchronize: true,
      autoLoadEntities:true,
      entities:[User,Cc,Transactions,Item,Store]
      
    }),
   
    ],
     exports:[TypeOrmModule]
})
export class DbConfigModule {}
