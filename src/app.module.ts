import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbConfigModule } from './db-config/db-config.module';
import { UsersController } from './users/users.controller';
import { CcController } from './cc/cc.controller';
import { TransactionsController } from './transactions/transactions.controller';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { CcService } from './cc/cc.service';
import { CcModule } from './cc/cc.module';

@Module({
  imports: [DbConfigModule,ConfigModule.forRoot({isGlobal: true,}),UsersModule, CcModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
