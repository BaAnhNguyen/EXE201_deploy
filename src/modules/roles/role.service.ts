import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { RoleRepository } from './role.repository';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RoleService {
	constructor(private readonly roleRepository: RoleRepository) {}

	getPermissions() {
		return [
			{
				module: 'Products',
				permissions: [
					{ key: 'can_manage_products', name: 'Quản lý sản phẩm (Thêm/Sửa/Xóa)' },
					{ key: 'can_view_products', name: 'Xem danh sách sản phẩm' },
				],
			},
			{
				module: 'Inventory',
				permissions: [
					{ key: 'can_manage_inventory', name: 'Quản lý kho hàng (Nhập/Xuất kho)' },
					{ key: 'can_view_inventory', name: 'Xem tồn kho' },
				],
			},
			{
				module: 'Reports',
				permissions: [
					{ key: 'can_view_reports', name: 'Xem báo cáo doanh số & tài chính' },
				],
			},
			{
				module: 'POS/Orders',
				permissions: [
					{ key: 'can_checkout', name: 'Thực hiện thanh toán đơn hàng (POS)' },
					{ key: 'can_manage_orders', name: 'Quản lý đơn hàng (Xem/Sửa đơn nháp)' },
				],
			},
			{
				module: 'Shifts',
				permissions: [
					{ key: 'can_manage_shifts', name: 'Quản lý phân ca & mẫu ca làm việc' },
				],
			},
		];
	}

	async create(createRoleDto: CreateRoleDto) {
		// Check if role already exists
		const existingRole = await this.roleRepository.findByRoleCode(createRoleDto.role_code);
		if (existingRole) {
			throw new ConflictException(`Role '${createRoleDto.role_code}' already exists`);
		}

		return this.roleRepository.create({
			role_code: createRoleDto.role_code,
			description: createRoleDto.description,
			permissions: createRoleDto.permissions || {},
		});
	}

	async findAll() {
		return this.roleRepository.findAll();
	}

	async findById(id: number) {
		const role = await this.roleRepository.findById(id);
		if (!role) {
			throw new NotFoundException(`Role with ID ${id} not found`);
		}
		return role;
	}

	async findByRoleCode(roleCode: string) {
		const role = await this.roleRepository.findByRoleCode(roleCode);
		if (!role) {
			throw new NotFoundException(`Role '${roleCode}' not found`);
		}
		return role;
	}

	async update(id: number, updateRoleDto: UpdateRoleDto) {
		// Verify role exists
		await this.findById(id);

		// Validate if role_code is being updated
		if (updateRoleDto.role_code) {
			// Check if new role code already exists
			const existingRole = await this.roleRepository.findByRoleCode(updateRoleDto.role_code);
			if (existingRole && existingRole.id !== id) {
				throw new ConflictException(`Role '${updateRoleDto.role_code}' already exists`);
			}
		}

		return this.roleRepository.update(id, {
			role_code: updateRoleDto.role_code,
			description: updateRoleDto.description,
			permissions: updateRoleDto.permissions,
		});
	}

	async delete(id: number) {
		// Verify role exists
		await this.findById(id);

		return this.roleRepository.delete(id);
	}
}
