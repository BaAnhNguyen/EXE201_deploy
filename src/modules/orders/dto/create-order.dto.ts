import { IsNumber, IsOptional, IsString, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsNumber()
  @Type(() => Number)
  product_id!: number;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity!: number;
}

export class CreateOrderDto {
  @IsNumber()
  @Type(() => Number)
  shift_id!: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  customer_id?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];
}
