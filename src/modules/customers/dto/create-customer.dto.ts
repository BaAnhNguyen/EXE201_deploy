import { IsNotEmpty, IsOptional, IsString, IsInt } from 'class-validator';

export class CreateCustomerDto {
  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsString()
  full_name: string;

  @IsOptional()
  @IsInt()
  tenant_id?: number;
}
