import { Injectable } from '@nestjs/common';
import { Prisma, Admin } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class AdminRepository {
	constructor(private readonly prisma: PrismaService) {}

	async countAdmins(): Promise<number> {
		return this.prisma.admin.count();
	}

	async findAdminByEmail(email: string): Promise<Admin | null> {
		return this.prisma.admin.findUnique({ where: { email } });
	}

	async findAdminById(id: number): Promise<Admin | null> {
		return this.prisma.admin.findUnique({ where: { id } });
	}

	async createAdmin(data: Prisma.AdminCreateInput): Promise<Admin> {
		return this.prisma.admin.create({ data });
	}

	async updateLastLogin(id: number): Promise<Admin> {
		return this.prisma.admin.update({
			where: { id },
			data: { last_login: new Date() },
		});
	}
}
