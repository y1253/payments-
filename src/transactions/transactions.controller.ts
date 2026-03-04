import { Body, Controller, Post } from '@nestjs/common';
import { Item } from './item.entity';
import { TransactionsService } from './transactions.service';



@Controller('transactions')
export class TransactionsController {
    constructor(
        private readonly transactionService:TransactionsService
    ){}
    @Post()
    postTransaction(@Body() transaction : any){
        return this.transactionService.postTransaction(transaction)
    }
}
