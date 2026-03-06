import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { join } from 'path';

@Controller()
export class AppController {
  @Get()
  getDemo(@Res() res: Response): void {
    res.sendFile(join(process.cwd(), 'public', 'index.html'));
  }

  @Get('new')
  getNewOrder(@Res() res: Response): void {
    res.sendFile(join(process.cwd(), 'public', 'new.html'));
  }
}
