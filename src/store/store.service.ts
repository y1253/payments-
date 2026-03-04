import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Store } from './store.entity';
import {Repository}from 'typeorm'
import { StoreDto } from '../transactions/transactions.dto';

@Injectable()
export class StoreService {
 constructor(
        @InjectRepository(Store)
        private readonly storeRepo:Repository<Store>,
    
 ){}
    async postStore(store:StoreDto){
        const savedStore=await this.getStoreByAddress(store.street,store.postal_code)
        if( savedStore)return savedStore.store_id
        const newStore= this.storeRepo.create({
            street:store.street,
            city:store.city,
            name:store.name,
            postal_code:store.postal_code,
            region:store.region
        })

        const createdStore=await this.storeRepo.save(newStore);
        return createdStore.store_id;
    }
    private async getStoreByAddress(street:string|undefined,postal_code:string|undefined){
        return await this.storeRepo.findOneBy({street,postal_code})
    }

}
