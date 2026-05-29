import { IsArray, IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateShiftDto {
  @IsInt()
  shop_id!: number;

  @IsInt()
  template_id!: number;

  @IsDateString()
  shift_date!: string; // Frontend truyền lên ngày làm việc

  @IsArray()
  @IsInt({ each: true })
  cashiers!: number[];

  @IsOptional()
  @IsString()
  shift_status?: string;
}