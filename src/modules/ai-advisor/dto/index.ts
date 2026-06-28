import { IsString, IsNotEmpty, IsOptional, IsInt, IsArray, ValidateNested, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatMessageDto {
  @ApiProperty({ enum: ['user', 'assistant'] })
  @IsEnum(['user', 'assistant'])
  role: 'user' | 'assistant';

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class ChatRequestDto {
  @ApiProperty({ description: 'Tenant ID (multi-tenant)' })
  @IsInt()
  @Min(1)
  tenant_id: number;

  @ApiPropertyOptional({ description: 'Filter by specific shop (optional)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  shop_id?: number;

  @ApiProperty({ description: 'Current user message' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ description: 'Previous messages for context (max 10)' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  history?: ChatMessageDto[];

  @ApiPropertyOptional({
    description: 'Analysis period in days (default: 30)',
    minimum: 7,
    maximum: 365,
    default: 30,
  })
  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(365)
  period_days?: number;
}

export class AnalyticsQueryDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  tenant_id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  shop_id?: number;

  @ApiPropertyOptional({ default: 30 })
  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(365)
  period_days?: number;
}
