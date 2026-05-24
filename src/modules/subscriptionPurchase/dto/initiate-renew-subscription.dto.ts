import { IsInt, IsPositive } from 'class-validator';

export class InitiateRenewSubscriptionDto {
  @IsInt()
  @IsPositive()
  subscription_id: number;
}
