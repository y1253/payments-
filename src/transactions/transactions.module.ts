import { Module } from '@nestjs/common';
import { CcModule } from '../cc/cc.module';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './transactions.entity';
import { Item } from './item.entity';
import { Store } from '../store/store.entity';
import { StoreModule } from '../store/store.module';

@Module({
    imports:[TypeOrmModule.forFeature([Store,Item,Transaction]),CcModule,StoreModule],
    controllers:[TransactionsController],
    providers:[TransactionsService]
})
export class TransactionsModule {}
