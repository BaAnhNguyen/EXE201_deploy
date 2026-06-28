import { IsInt, IsOptional, IsPositive, IsString } from 'class-validator';

export class InitiateRenewSubscriptionDto {
  @IsInt()
  @IsPositive()
  subscription_id: number;

  @IsString()
  @IsOptional()
  payment_method?: 'PAYOS' | 'CASH';
}
