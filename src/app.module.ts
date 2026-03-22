import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbConfigModule } from './db-config/db-config.module';

import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';

import { CcModule } from './cc/cc.module';
import { TransactionsModule } from './transactions/transactions.module';
import { StoreModule } from './store/store.module';
import { AiModule } from './ai/ai.module';
import { CategoryModule } from './category/category.module';
import { PhonesModule } from './phones/phones.module';


@Module({
  imports: [
    DbConfigModule,
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    CcModule,
    TransactionsModule,
    StoreModule,
    AiModule,
    CategoryModule,
    PhonesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
