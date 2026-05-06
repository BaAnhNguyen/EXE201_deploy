import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  package_code: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Type(() => Number)
  @IsNotEmpty()
  price: number;

  @IsString()
  @IsNotEmpty()
  billing_cycle: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
