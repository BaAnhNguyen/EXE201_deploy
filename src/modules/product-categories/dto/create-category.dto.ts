// === create-category.dto.ts ===
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @MinLength(1)
  category_name!: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  par_category_id?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
