import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateTransactionDto } from './transactions.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from './item.entity';
import { Transaction } from './transactions.entity';
import { CcService } from '../cc/cc.service';
import { StoreService } from '../store/store.service';
import { Type } from '../type/type.entity';
import { Category } from '../category/category.entity';
import { AiService } from '../ai/ai.service';
import { Phone } from '../phones/phone.entity';
import { SignalwireService } from '../signalwire/signalwire.service';


@Injectable()
export class TransactionsService {
    private readonly logger = new Logger(TransactionsService.name);
    constructor(

        @InjectRepository(Item)
        private readonly itemRepo: Repository<Item>,

        @InjectRepository(Transaction)
        private readonly transactionRepo: Repository<Transaction>,

        @InjectRepository(Type)
        private readonly typeRepo: Repository<Type>,

        @InjectRepository(Category)
        private readonly categoryRepo: Repository<Category>,

        @InjectRepository(Phone)
        private readonly phoneRepo: Repository<Phone>,

        private readonly ccService: CcService,
        private readonly storeService: StoreService,
        private readonly aiService: AiService,
        private readonly signalwireService: SignalwireService,

    ) { }
    async getTransactionByCard(user_id: number, last_4: string) {
        const savedCC = await this.ccService.getCcByLast4(last_4, user_id)
        if (!savedCC) throw new NotFoundException('CC not found');
        const transactions = await this.transactionRepo.find({
            where: { cc_id: savedCC.cc_id },
            relations: ['items', 'items.category', 'items.type', 'store'],
        })
        return transactions

    }

    async postTransaction(transaction: CreateTransactionDto) {


        // Ensure the CC belongs to the logged-in user
        const ccHash = this.ccService.hashCC(transaction.cc_number);
        const savedCc = await this.ccService.getCcByNumber(ccHash);
        if (!savedCc) throw new NotFoundException('CC not exists');
        const store_id = await this.storeService.postStore(transaction.store);
        const newTransaction = this.transactionRepo.create({
            store_id,
            cc_id: savedCc.cc_id
        })

        const savedTransaction = await this.transactionRepo.save(newTransaction)

        // Business only (type_id=2). No AI for type.
        const businessTypeId = await this.getOrCreateTypeId(2);

        // Get user's categories for AI assignment.
        let userCategories = await this.categoryRepo.find({
            where: { user_id: savedCc.user_id },
        });

        // If user has no categories, create a default one.
        if (!userCategories.length) {
            const created = await this.categoryRepo.save(
                this.categoryRepo.create({
                    user_id: savedCc.user_id,
                    category: 'Uncategorized',
                }),
            );
            userCategories = [created];
        }

        const categoriesForAi = userCategories.map((c) => ({
            category_id: c.category_id,
            category: c.category,
        }));

        const smsLines: { itemLabel: string; categoryLabel: string }[] = [];

        for (const itemDto of transaction.items) {
            // AI chooses the best category_id from THIS user's category list.
            const categoryId = await this.aiService.assignCategoryId(
                itemDto.item,
                categoriesForAi,
            );

            const categoryRow = userCategories.find((c) => c.category_id === categoryId);
            const categoryLabel = categoryRow?.category ?? 'Uncategorized';

            const qty =
                typeof itemDto.quantity === 'number' && itemDto.quantity >= 1
                    ? Math.floor(itemDto.quantity)
                    : 1;

            const newItem = this.itemRepo.create({
                item: itemDto.item,
                price: itemDto.price,
                quantity: qty,
                transaction_id: savedTransaction.transaction_id,
                transaction: savedTransaction,
                type_id: businessTypeId,
                user_id: savedCc.user_id,
                category_id: categoryId,
            });

            await this.itemRepo.save(newItem);

            smsLines.push({
                itemLabel:
                    ((itemDto.item ?? '').trim() || 'Item') +
                    (qty > 1 ? ` ×${qty}` : ''),
                categoryLabel,
            });
        }

        // SMS: if user has a saved phone, notify immediately with item → category lines.
        const userPhone = await this.phoneRepo.findOne({
            where: { user_id: savedCc.user_id },
            order: { create_at: 'DESC' },
        });
        if (userPhone?.phone && smsLines.length) {
            const body =
                'New transaction\n' +
                smsLines.map((l) => `${l.itemLabel}: ${l.categoryLabel}`).join('\n');
            try {
                await this.signalwireService.sendSms(userPhone.phone, body);
            } catch (err) {
                this.logger.warn(
                    `SignalWire SMS failed for user_id=${savedCc.user_id}: ${(err as Error)?.message ?? err}`,
                );
            }
        }
    }

    private outputTypeToLabel(outputType: 1 | 2): string {
        // DB expects readable labels (PERSONAL / BUSINESS).
        return outputType === 1 ? 'PERSONAL' : 'BUSINESS';
    }

    private async getOrCreateTypeId(outputType: 1 | 2): Promise<number> {
        const typeLabel = this.outputTypeToLabel(outputType);
        const existing = await this.typeRepo.findOneBy({ type: typeLabel });
        if (existing) return existing.type_id;

        const created = await this.typeRepo.save(
            this.typeRepo.create({ type: typeLabel }),
        );
        return created.type_id;
    }

}
