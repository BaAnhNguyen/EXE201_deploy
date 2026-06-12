import { IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

// Manually set quantities for an InventoryItem
export class UpdateQuantitiesDto {
  @IsNumber()
  @Type(() => Number)
  ingredient_id: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  theorical_quantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  adjusted_quantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  actual_quantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minimum_threshold?: number;
}
