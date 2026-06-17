import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

export class InitiateSubscriptionDto {
  @IsNumber()
  @IsNotEmpty()
  subscription_id: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsString()
  @IsNotEmpty()
  tenant_name: string;

  @IsString()
  @IsOptional()
  payment_method?: 'PAYOS' | 'CASH';
}
