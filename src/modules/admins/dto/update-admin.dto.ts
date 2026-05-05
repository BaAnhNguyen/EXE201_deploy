import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateAdminDto {
	@IsEmail()
	@IsOptional()
	email?: string;

	@IsString()
	@MinLength(6)
	@IsOptional()
	password?: string;

	@IsString()
	@IsOptional()
	full_name?: string;

	@IsString()
	@IsOptional()
	phone?: string;

	@IsString()
	@IsOptional()
	avatar?: string;
}