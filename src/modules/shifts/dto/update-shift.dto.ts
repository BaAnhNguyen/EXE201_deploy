import { IsOptional, IsString, IsDateString, IsInt, IsArray } from 'class-validator';

export class UpdateShiftDto {
  @IsOptional()
  @IsDateString()
  shift_date?: string;

  @IsOptional()
  @IsInt()
  template_id?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  cashiers?: number[];

  @IsOptional()
  @IsString()
  shift_status?: string;
}
