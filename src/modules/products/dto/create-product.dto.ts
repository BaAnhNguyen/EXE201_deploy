import { IsString, IsNumber, IsOptional, IsBoolean, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsNumber()
  @Type(() => Number)
  category_id!: number;

  @IsString()
  @MinLength(1)
  product_name!: string;

  @IsString()
  @MinLength(1)
  sku!: string; // required, unique

  @IsNumber()
  @Type(() => Number)
  basic_price!: number; // required per schema

  @IsNumber()
  @Type(() => Number)
  unit_price!: number; // required per schema

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  measure_unit?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}