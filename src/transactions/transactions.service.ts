import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTransactionDto } from './transactions.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from './item.entity';
import { Transaction } from './transactions.entity';
import { CcService } from '../cc/cc.service';
import { StoreService } from '../store/store.service';
import { ItemTypes } from '../item-types/item-types.entity';
import { Type } from '../type/type.entity';


@Injectable()
export class TransactionsService {
    constructor(

        @InjectRepository(Item)
        private readonly itemRepo: Repository<Item>,

        @InjectRepository(Transaction)
        private readonly transactionRepo: Repository<Transaction>,

        @InjectRepository(ItemTypes)
        private readonly itemTypesRepo: Repository<ItemTypes>,

        @InjectRepository(Type)
        private readonly typeRepo: Repository<Type>,

        private readonly ccService: CcService,
        private readonly storeService: StoreService

    ) { }
    async getTransactionByCard(user_id: number, last_4: string) {
        const savedCC = await this.ccService.getCcByLast4(last_4, user_id)
        if (!savedCC) throw new NotFoundException('CC not found');
        const transactions = await this.transactionRepo.find({
            where: { cc_id: savedCC.cc_id },
            relations: ['items', 'store']
        })
        return transactions

    }

    async postTransaction(user_id: number, transaction: CreateTransactionDto) {


        // Ensure the CC belongs to the logged-in user
        const savedCc = await this.ccService.getCcByNumberForUser(
            this.ccService.hashCC(transaction.cc_number),
            user_id,
        );
        if (!savedCc) return 'not exists ' + savedCc
        const store_id = await this.storeService.postStore(transaction.store);
        const newTransaction = this.transactionRepo.create({
            store_id,
            cc_id: savedCc.cc_id
        })

        const savedTransaction = await this.transactionRepo.save(newTransaction)

        for (const itemDto of transaction.items) {
            const itemTypes = await this.getOrCreateItemTypes(itemDto.item);

            const newItem = this.itemRepo.create({
                item: itemDto.item,
                price: itemDto.price,
                // Item entity uses the `transaction` relation to set `transaction_id`
                transaction_id: savedTransaction.transaction_id,
                transaction: savedTransaction,
                itemType: itemTypes,
            });

            await this.itemRepo.save(newItem);
        }



    }

    private async getOrCreateItemTypes(itemName: string) {
        // Your Workbench schema requires `item_types_id` (NOT NULL).
        // Since the demo payload does not send a type_id, we use a single default type.
        const defaultType = await this.getOrCreateDefaultType();

        const existing = await this.itemTypesRepo.findOneBy({
            type_id: defaultType.type_id,
            item: itemName,
        });
        if (existing) return existing;

        const created = this.itemTypesRepo.create({
            type_id: defaultType.type_id,
            type: defaultType,
            item: itemName,
        });
        return await this.itemTypesRepo.save(created);
    }

    private async getOrCreateDefaultType() {
        const typeName = 'default';
        const existing = await this.typeRepo.findOneBy({ type: typeName });
        if (existing) return existing;

        const created = this.typeRepo.create({ type: typeName });
        return await this.typeRepo.save(created);
    }
}
