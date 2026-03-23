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
import { Category } from '../category/category.entity';
import { Type } from '../type/type.entity';
import { AiModule } from '../ai/ai.module';
import { SignalwireModule } from '../signalwire/signalwire.module';
import { Phone } from '../phones/phone.entity';

@Module({
    imports:[TypeOrmModule.forFeature([Store,Item,Transaction,Category,Type,Phone]),CcModule,StoreModule,AuthModule,AiModule,SignalwireModule],
    controllers:[TransactionsController],
    providers:[TransactionsService]
})
export class TransactionsModule {}
