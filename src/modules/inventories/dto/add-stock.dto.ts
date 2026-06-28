import { IsNumber, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

// ingredient_id + quantity để add stock cho 1 InventoryItem
export class AddStockDto {
  @IsNumber()
  @Type(() => Number)
  ingredient_id: number;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  quantity: number;
}
