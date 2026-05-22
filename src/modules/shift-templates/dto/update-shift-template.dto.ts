import { IsString, IsBoolean, IsOptional, MinLength } from 'class-validator';

export class UpdateShiftTemplateDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  start_time?: string;

  @IsOptional()
  @IsString()
  end_time?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
