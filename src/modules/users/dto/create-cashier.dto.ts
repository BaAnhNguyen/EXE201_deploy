import { IsEmail, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCashierDto {
	@IsString()
	@MinLength(3)
	username: string;

	@IsEmail()
	email: string;

	@IsString()
	@MinLength(6)
	password: string;

	@IsOptional()
	@IsString()
	full_name?: string;

	@IsOptional()
	@IsInt()
	shop_id?: number;
}