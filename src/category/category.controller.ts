import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CategoryService } from './category.service';
import { AuthGuard } from '../auth/auth.guard';
import { User } from '../decorators/decorators.user';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @UseGuards(AuthGuard)
  getCategories(@User() user: { user_id: number }) {
    return this.categoryService.findAllByUserId(user.user_id);
  }

  @Post()
  @UseGuards(AuthGuard)
  addCategory(@User() user: any, @Body('category') category: string) {
    return this.categoryService.addCategory(user.user_id, category);
  }
}
