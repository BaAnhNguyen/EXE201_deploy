import {
	IsEmail,
	IsInt,
	IsOptional,
	IsPhoneNumber,
	IsString,
	MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RegisterDto {
	@IsString()
	@MinLength(3)
	username!: string;

	@IsEmail()
	email!: string;

	@IsString()
	@MinLength(8)
	password!: string;

	@IsOptional()
	@IsString()
	full_name?: string;

	@IsOptional()
	@IsPhoneNumber('VN')
	phone?: string;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	tenant_id?: number;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	shop_id?: number;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	role_id?: number;
}
