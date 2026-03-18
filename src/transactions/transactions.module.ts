import { Module } from '@nestjs/common';
import { CcModule } from '../cc/cc.module';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './transactions.entity';
import { Item } from './item.entity';
import { Store } from '../store/store.entity';
import { StoreModule } from '../store/store.module';
import { AuthModule } from '../auth/auth.module';
import { ItemTypes } from '../item-types/item-types.entity';
import { Type } from '../type/type.entity';
import { RawItem } from '../raw-items/raw-item.entity';
import { AiModule } from '../ai/ai.module';

@Module({
    imports:[TypeOrmModule.forFeature([Store,Item,Transaction,ItemTypes,Type,RawItem]),CcModule,StoreModule,AuthModule,AiModule],
    controllers:[TransactionsController],
    providers:[TransactionsService]
})
export class TransactionsModule {}
