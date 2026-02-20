import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbConfigModule } from './db-config/db-config.module';
import { UsersController } from './users/users.controller';
import { CcController } from './cc/cc.controller';
import { TransactionsController } from './transactions/transactions.controller';

@Module({
  imports: [DbConfigModule],
  controllers: [AppController, UsersController, CcController, TransactionsController],
  providers: [AppService],
})
export class AppModule {}
