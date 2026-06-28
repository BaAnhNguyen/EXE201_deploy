import { IsOptional, IsString } from 'class-validator';

export class UpdateOrderDto {
  @IsOptional()
  @IsString()
  order_status?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
