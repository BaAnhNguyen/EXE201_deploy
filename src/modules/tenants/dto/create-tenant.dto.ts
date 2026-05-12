import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateTenantDto {
  @IsNotEmpty()
  @IsString()
  tenant_name!: string;

  @IsOptional()
  @IsNumber()
  admin_id?: number;

  @IsOptional()
  @IsNumber()
  tax_percentage?: number;

  @IsOptional()
  @IsNumber()
  loyal_point_per_unit?: number;
}
