import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateTransactionDto } from './transactions.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from './item.entity';
import { Transaction } from './transactions.entity';
import { CcService } from '../cc/cc.service';
import { StoreService } from '../store/store.service';
import { ItemTypes } from '../item-types/item-types.entity';
import { Type } from '../type/type.entity';
import { RawItem } from '../raw-items/raw-item.entity';
import { AiService, ItemTypeCandidate, AssigningResult } from '../ai/ai.service';


@Injectable()
export class TransactionsService {
    private readonly logger = new Logger(TransactionsService.name);
    constructor(

        @InjectRepository(Item)
        private readonly itemRepo: Repository<Item>,

        @InjectRepository(Transaction)
        private readonly transactionRepo: Repository<Transaction>,

        @InjectRepository(ItemTypes)
        private readonly itemTypesRepo: Repository<ItemTypes>,

        @InjectRepository(Type)
        private readonly typeRepo: Repository<Type>,

        @InjectRepository(RawItem)
        private readonly rawItemRepo: Repository<RawItem>,

        private readonly ccService: CcService,
        private readonly storeService: StoreService,
        private readonly aiService: AiService,

    ) { }
    async getTransactionByCard(user_id: number, last_4: string) {
        const savedCC = await this.ccService.getCcByLast4(last_4, user_id)
        if (!savedCC) throw new NotFoundException('CC not found');
        const transactions = await this.transactionRepo.find({
            where: { cc_id: savedCC.cc_id },
            relations: ['items', 'items.itemType', 'items.itemType.type', 'store'],
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

        for (const itemDto of transaction.items) {
            const resolved = await this.resolveItemTypesForRawItem(itemDto.item);
            this.logger.log(
                `Resolved item "${itemDto.item}" -> item_types_id=${resolved.itemTypesId}, item="${resolved.itemName}"`,
            );

            const newItem = this.itemRepo.create({
                // store the raw user-provided item text in `item` column
                // normalized/canonical name will be read from `itemType.item`
                item: itemDto.item,
                price: itemDto.price,
                // Item entity uses the `transaction` relation to set `transaction_id`
                transaction_id: savedTransaction.transaction_id,
                transaction: savedTransaction,
                itemType: this.itemTypesRepo.create({
                    item_types_id: resolved.itemTypesId,
                } as ItemTypes),
            });

            await this.itemRepo.save(newItem);
        }



    }

    private cosineSimilarity(a: number[], b: number[]): number {
        if (a.length !== b.length) {
            throw new BadRequestException('Embedding vectors must have same length');
        }

        let dot = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        const denom = Math.sqrt(normA) * Math.sqrt(normB);
        return denom === 0 ? 0 : dot / denom;
    }

    private resolveMatchThreshold(): number {
        return parseFloat(process.env.OPENAI_MATCH_THRESHOLD ?? '0.82');
    }

    private async matchRawItemByExactOrEmbedding(item: string): Promise<RawItem | null> {
        const input = (item ?? '').trim();
        if (!input) return null;

        // 1) Exact match (fast path)
        const exact = await this.rawItemRepo.findOneBy({ item: input });
        if (exact) return exact;

        // 2) Embedding-based match (handles typos/near variants)
        const candidates = await this.rawItemRepo.find({
            select: ['raw_item_id', 'item', 'item_types_id'],
        });

        if (!candidates.length) return null;

        const inputEmbedding = await this.aiService.embedText(input);
        let bestScore = -Infinity;
        let best: RawItem | null = null;

        const threshold = this.resolveMatchThreshold();
        for (const c of candidates) {
            const text = (c.item ?? '').trim();
            if (!text) continue;
            const candEmbedding = await this.aiService.embedText(text);
            const score = this.cosineSimilarity(inputEmbedding, candEmbedding);
            if (score > bestScore) {
                bestScore = score;
                best = c;
            }
        }

        if (!best) return null;
        return bestScore >= threshold ? best : null;
    }

    private async resolveItemTypesForRawItem(
        rawItemText: string,
    ): Promise<{ itemTypesId: number; itemName: string }> {
        // Step 1: check raw_item cache table
        const rawMatch = await this.matchRawItemByExactOrEmbedding(rawItemText);
        if (rawMatch) {
            const itemTypes = await this.itemTypesRepo.findOneBy({
                item_types_id: rawMatch.item_types_id,
            });
            if (!itemTypes) {
                // stale raw_item row; fall through to AI resolution
            } else {
                this.logger.log(
                    `raw_item hit for "${rawItemText}" -> item_types_id=${rawMatch.item_types_id}`,
                );
                return {
                    itemTypesId: itemTypes.item_types_id,
                    itemName: (itemTypes.item ?? rawItemText) as string,
                };
            }
        }

        // Step 2: call AI to match against existing item_types
        const itemTypes = await this.itemTypesRepo.find({
            select: ['item_types_id', 'item', 'type_id'],
        });

        const candidates: ItemTypeCandidate[] = itemTypes
            .filter((it) => (it.item ?? '').trim().length > 0)
            .map((it) => ({
                item_types_id: it.item_types_id,
                item: it.item as string,
                type_id: it.type_id as number,
            }));

        if (!candidates.length) {
            // If there is no info in `item_types`, normalize/classify the raw
            // input using AI and create the needed `type` + `item_types` rows.
            const normalized = await this.aiService.normalize(rawItemText, 1);
            const typeId = await this.getOrCreateTypeId(normalized.type);

            const existingItemType = await this.itemTypesRepo.findOneBy({
                type_id: typeId,
                item: normalized.item,
            });

            const savedItemTypes = existingItemType
                ? existingItemType
                : await this.itemTypesRepo.save(
                    this.itemTypesRepo.create({
                        item: normalized.item,
                        type_id: typeId,
                    }),
                );

            const existingRaw = await this.rawItemRepo.findOneBy({
                item: rawItemText,
                item_types_id: savedItemTypes.item_types_id,
            });

            if (!existingRaw) {
                await this.rawItemRepo.save(
                    this.rawItemRepo.create({
                        item: rawItemText,
                        item_types_id: savedItemTypes.item_types_id,
                    }),
                );
            }

            return {
                itemTypesId: savedItemTypes.item_types_id,
                itemName: savedItemTypes.item ?? normalized.item,
            };
        }

        const result: AssigningResult = await this.aiService.assigning(
            candidates,
            rawItemText,
        );

        // Step 3A: AI matched an existing item_types_id
        if (typeof result === 'number') {
            const matched = candidates.find((c) => c.item_types_id === result);
            if (!matched) {
                throw new NotFoundException('AI returned an item_types_id not found');
            }

            // Cache the raw input -> item_types_id mapping (so raw_item gets filled)
            this.logger.log(
                `AI matched existing item_types_id=${matched.item_types_id} for "${rawItemText}"`,
            );
            const existingRaw = await this.rawItemRepo.findOneBy({
                item: rawItemText,
                item_types_id: matched.item_types_id,
            });
            if (!existingRaw) {
                await this.rawItemRepo.save(
                    this.rawItemRepo.create({
                        item: rawItemText,
                        item_types_id: matched.item_types_id,
                    }),
                );
            }

            return { itemTypesId: matched.item_types_id, itemName: matched.item };
        }

        // Step 3B: AI returned a new summary -> create item_types + raw_item
        this.logger.log(`AI fallback produced new item_types for "${rawItemText}"`);
        const typeId = await this.getOrCreateTypeId(result.type);

        const existingItemType = await this.itemTypesRepo.findOneBy({
            type_id: typeId,
            item: result.item,
        });

        const savedItemTypes = existingItemType
            ? existingItemType
            : await this.itemTypesRepo.save(
                this.itemTypesRepo.create({
                    item: result.item,
                    type_id: typeId,
                }),
            );

        // Cache the raw input -> item_types_id mapping (avoid duplicates)
        const existingRaw = await this.rawItemRepo.findOneBy({
            item: rawItemText,
            item_types_id: savedItemTypes.item_types_id,
        });

        if (!existingRaw) {
            await this.rawItemRepo.save(
                this.rawItemRepo.create({
                    item: rawItemText,
                    item_types_id: savedItemTypes.item_types_id,
                }),
            );
        }

        return {
            itemTypesId: savedItemTypes.item_types_id,
            itemName: result.item,
        };
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
