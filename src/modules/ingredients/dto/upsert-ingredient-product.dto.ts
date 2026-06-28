import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpsertIngredientProductDto {
  @IsNumber()
  @Type(() => Number)
  ingredient_id: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  quantity_required: number;

  @IsOptional()
  @IsString()
  unit?: string;
}
