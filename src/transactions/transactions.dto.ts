import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsOptional,
  ValidateNested,
  IsArray,
} from 'class-validator';

export class StoreDto {
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  street?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  region?: string;

  @IsString()
  @IsOptional()
  postal_code?: string;

  @IsString()
  @IsOptional()
  country?: string;
}

export class ItemDto {
  @IsString()
  item!: string; 

   @IsNumber()
   quantity!: number; 

  @IsNumber()
  price!: number;


 
}

export class CreateTransactionDto {
  @IsString()
  cc_number!: string;

  @ValidateNested()
  @Type(() => StoreDto)
  store!: StoreDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items!: ItemDto[];
}