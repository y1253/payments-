import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { PhonesService } from './phones.service';
import { AuthGuard } from '../auth/auth.guard';
import { User } from '../decorators/decorators.user';

@Controller('phones')
export class PhonesController {
  constructor(private readonly phonesService: PhonesService) {}

  @Get()
  @UseGuards(AuthGuard)
  getPhones(@User() user: { user_id: number }) {
    return this.phonesService.findAllByUserId(user.user_id);
  }

  @Post()
  @UseGuards(AuthGuard)
  addPhone(
    @User() user: { user_id: number },
    @Body('phone') phone: string,
  ) {
    return this.phonesService.requestVerification(phone, user.user_id);
  }

  @Post('verify')
  @UseGuards(AuthGuard)
  verifyPhone(
    @Body('phone') phone: string,
    @Body('code') code: string,
  ) {
    return this.phonesService.verify(phone, code);
  }
}
