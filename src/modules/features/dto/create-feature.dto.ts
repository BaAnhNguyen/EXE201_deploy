import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateFeatureDto {
  @IsString()
  @IsNotEmpty()
  feature_code: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
