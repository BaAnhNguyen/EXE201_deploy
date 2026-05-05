import { Injectable } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class RoleRepository {
	constructor(private readonly prisma: PrismaService) {}

	async create(data: Prisma.RoleCreateInput): Promise<Role> {
		return this.prisma.role.create({ data });
	}

	async findAll(): Promise<Role[]> {
		return this.prisma.role.findMany({
			include: {
				users: true,
			},
		});
	}

	async findById(id: number): Promise<Role | null> {
		return this.prisma.role.findUnique({
			where: { id },
			include: {
				users: true,
			},
		});
	}

	async findByRoleCode(roleCode: string): Promise<Role | null> {
		return this.prisma.role.findUnique({
			where: { role_code: roleCode },
			include: {
				users: true,
			},
		});
	}

	async update(id: number, data: Prisma.RoleUpdateInput): Promise<Role> {
		return this.prisma.role.update({
			where: { id },
			data,
			include: {
				users: true,
			},
		});
	}

	async delete(id: number): Promise<Role> {
		return this.prisma.role.delete({
			where: { id },
			include: {
				users: true,
			},
		});
	}

	async countByRoleCode(roleCode: string): Promise<number> {
		return this.prisma.role.count({
			where: { role_code: roleCode },
		});
	}
}
