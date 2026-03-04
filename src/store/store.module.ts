import { Module } from '@nestjs/common';
import { StoreService } from './store.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Store } from './store.entity';

@Module({
    imports:[TypeOrmModule.forFeature([Store])],
    providers:[StoreService],
    exports:[StoreService]
})
export class StoreModule {}
