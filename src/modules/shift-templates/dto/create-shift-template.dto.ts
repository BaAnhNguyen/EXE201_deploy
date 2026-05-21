import { IsString, IsBoolean, IsOptional, Matches } from 'class-validator';

export class CreateShiftTemplateDto {
  @IsString()
  name: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'start_time phải đúng format HH:mm, ví dụ: 08:00'
  })
  start_time: string; // chỉ nhận "08:00", không nhận "08:00:00"

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'end_time phải đúng format HH:mm, ví dụ: 16:00'
  })
  end_time: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}