import { IsOptional, IsString, IsDateString } from 'class-validator';

export class UpdateShiftDto {
  @IsOptional()
  @IsDateString()
  start_time?: string;

  @IsOptional()
  @IsDateString()
  end_time?: string;

  @IsOptional()
  @IsString()
  shift_status?: string;
}
