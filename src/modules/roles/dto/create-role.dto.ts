import { IsString, IsOptional, IsJSON } from 'class-validator';

export class CreateRoleDto {
	@IsString()
	role_code: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	permissions?: Record<string, any>;
}
