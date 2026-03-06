import { Injectable } from '@nestjs/common';
import { CreateTransactionDto } from './transactions.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from './item.entity';
import { Transaction } from './transactions.entity';
import { CcService } from '../cc/cc.service';
import { StoreService } from '../store/store.service';


@Injectable()
export class TransactionsService {
    constructor(

        @InjectRepository(Item)
        private readonly itemRepo: Repository<Item>,

        @InjectRepository(Transaction)
        private readonly transactionRepo: Repository<Transaction>,

        private readonly ccService: CcService,
        private readonly storeService: StoreService

    ) { }
    async getTransactionByCard(user_id: number, last_4: string) {
        const savedCC = await this.ccService.getCcByLast4(last_4, user_id)
        if (!savedCC) return 'error';
        const transactions = await this.transactionRepo.find({
            where: { cc_id: savedCC.cc_id },
            relations: ['items', 'store']
        })
        return transactions

    }

    async postTransaction(transaction: CreateTransactionDto) {


        const savedCc = await this.ccService.getCcByNumber(this.ccService.hashCC(transaction.cc_number));
        if (!savedCc) return 'not exists ' + savedCc
        const store_id = await this.storeService.postStore(transaction.store);
        const newTransaction = this.transactionRepo.create({
            store_id,
            cc_id: savedCc.cc_id
        })

        const { transaction_id } = await this.transactionRepo.save(newTransaction)

        for (let items of transaction.items) {
            const newItem = this.itemRepo.create({
                item: items.item,
                quantity: items.quantity,
                price: items.price,
                transaction_id
            })

            await this.itemRepo.save(newItem)

        }



    }
}
