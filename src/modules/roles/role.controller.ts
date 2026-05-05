import {
	Controller,
	Get,
	Post,
	Patch,
	Delete,
	Param,
	Body,
	UseGuards,
	ParseIntPipe,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminOnlyGuard } from '../../common/guards/admin-only.guard';

@Controller('roles')
@UseGuards(JwtAuthGuard, AdminOnlyGuard)
export class RoleController {
	constructor(private readonly roleService: RoleService) {}

	@Post()
	async create(@Body() createRoleDto: CreateRoleDto) {
		return this.roleService.create(createRoleDto);
	}

	@Get()
	async findAll() {
		return this.roleService.findAll();
	}

	@Get(':id')
	async findById(@Param('id', ParseIntPipe) id: number) {
		return this.roleService.findById(id);
	}

	@Get('code/:roleCode')
	async findByRoleCode(@Param('roleCode') roleCode: string) {
		return this.roleService.findByRoleCode(roleCode);
	}

	@Patch(':id')
	async update(
		@Param('id', ParseIntPipe) id: number,
		@Body() updateRoleDto: UpdateRoleDto,
	) {
		return this.roleService.update(id, updateRoleDto);
	}

	@Delete(':id')
	async delete(@Param('id', ParseIntPipe) id: number) {
		return this.roleService.delete(id);
	}
}
