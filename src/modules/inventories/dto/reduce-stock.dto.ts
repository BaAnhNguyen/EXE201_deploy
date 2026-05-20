import { IsNumber, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class ReduceStockDto {
  @IsNumber()
  @Type(() => Number)
  ingredient_id: number;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  quantity: number;
}
