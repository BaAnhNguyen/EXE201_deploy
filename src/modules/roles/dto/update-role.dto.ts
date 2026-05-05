import { IsString, IsOptional } from 'class-validator';

export class UpdateRoleDto {
	@IsOptional()
	@IsString()
	role_code?: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	permissions?: Record<string, any>;
}
