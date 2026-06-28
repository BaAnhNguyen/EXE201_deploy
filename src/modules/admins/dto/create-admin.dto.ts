import { IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, MinLength } from 'class-validator';

export class CreateAdminDto {
	@IsEmail()
	@IsNotEmpty()
	email: string;

	@IsString()
	@MinLength(6)
	@IsNotEmpty()
	password: string;

	@IsString()
	@IsOptional()
	full_name?: string;

	@IsString()
	@IsOptional()
	phone?: string;

	@IsOptional()
	@IsString()
	avatar?: string;
}