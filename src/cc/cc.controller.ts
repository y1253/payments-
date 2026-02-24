import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CcService } from './cc.service';
import { AuthGuard } from '../auth/auth.guard';
import { User } from '../decorators/decorators.user';

@Controller('cc')
export class CcController {
    constructor(
        private readonly ccService:CcService
    ){}
    @Get()
    @UseGuards(AuthGuard)
    getCards(@User() user :any){
        return this.ccService.getCards(user.user_id)    
    }

    @Post()
     @UseGuards(AuthGuard)
    async postCard(@User() user:any,@Body('cardNumber') cc:string){
        return await this.ccService.addCard(user.user_id,cc);
    }

}
