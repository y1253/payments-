import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Item } from './item.entity';
import { TransactionsService } from './transactions.service';
import { AuthGuard } from '../auth/auth.guard';
import { User } from '../decorators/decorators.user';



@Controller('transactions')
export class TransactionsController {
    constructor(
        private readonly transactionService:TransactionsService
    ){}
    @Post('/get')
    @UseGuards(AuthGuard)
    async getTransactionByCard(@User() user:any,@Body('last_4')last4:string){
        return await this.transactionService.getTransactionByCard(user.user_id,last4)
    }
    @Post()
    postTransaction(@Body() transaction: any){
        return this.transactionService.postTransaction(transaction);
    }


}
