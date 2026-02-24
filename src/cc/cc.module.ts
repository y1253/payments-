import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CcController } from './cc.controller';
import { CcService } from './cc.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cc } from './cc.entity';
import { AuthGuard } from '../auth/auth.guard';

@Module({
    imports:[TypeOrmModule.forFeature([Cc]),AuthModule],
    controllers:[CcController],
    providers:[CcService,AuthGuard]
})
export class CcModule {}
