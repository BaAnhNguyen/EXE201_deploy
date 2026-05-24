import { IsString, Matches } from 'class-validator';

export class ConfirmPaymentDto {
  @IsString()
  @Matches(/^\d+$/, { message: 'orderCode must be numeric' })
  orderCode: string;
}
