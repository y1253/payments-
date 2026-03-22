import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async addCategory(user_id: number, category: string) {
    const newCategory = this.categoryRepo.create({ user_id, category });
    return await this.categoryRepo.save(newCategory);
  }

  async findAllByUserId(user_id: number) {
    return this.categoryRepo.find({
      where: { user_id },
      order: { create_at: 'DESC' },
    });
  }
}
