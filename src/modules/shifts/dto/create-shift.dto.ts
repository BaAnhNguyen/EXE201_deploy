import { IsInt, IsOptional, IsString, Matches } from 'class-validator';

export class CreateShiftDto {
  @IsInt()
  shop_id: number;

  @IsInt()
  template_id: number;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'start_time phải đúng format HH:mm, ví dụ: 09:00'
  })
  start_time?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'end_time phải đúng format HH:mm, ví dụ: 17:00'
  })
  end_time?: string;

  @IsOptional()
  @IsString()
  shift_status?: string;
}