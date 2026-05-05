import { ConflictException, Injectable, BadRequestException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { AdminRepository } from './admin.repository';
import { CreateAdminDto } from './dto/create-admin.dto';
import { LoginAdminDto } from './dto/login-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { Admin } from '@prisma/client';

@Injectable()
export class AdminService {
	constructor(
		private readonly adminRepository: AdminRepository,
		private readonly jwtService: JwtService,
	) {}

	async login(loginDto: LoginAdminDto) {
		const admin = await this.adminRepository.findAdminByEmail(loginDto.email);

		if (!admin) {
			throw new UnauthorizedException('Invalid email or password');
		}

		const isPasswordMatched = await bcrypt.compare(loginDto.password, admin.password);

		if (!isPasswordMatched) {
			throw new UnauthorizedException('Invalid email or password');
		}

		if (!admin.is_active) {
			throw new UnauthorizedException('Admin account is disabled');
		}

		await this.adminRepository.updateLastLogin(admin.id);

		const token = await this.signToken(admin);

		const { password, ...adminWithoutPassword } = admin;

		return {
			accessToken: token,
			admin: adminWithoutPassword,
		};
	}

	private async signToken(admin: Admin): Promise<string> {
		const payload = {
			sub: admin.id,
			email: admin.email,
			type: 'ADMIN', // Admin is not a role, it's a special type
		};

		return this.jwtService.signAsync(payload);
	}

	async createInitialAdmin(createAdminDto: CreateAdminDto) {
		const adminCount = await this.adminRepository.countAdmins();
		
		if (adminCount > 0) {
			throw new BadRequestException('Initial admin already exists. Use the standard create admin endpoint.');
		}

		return this.processAdminCreation(createAdminDto, null);
	}

	async createAdmin(createAdminDto: CreateAdminDto, managerId: number) {
		const manager = await this.adminRepository.findAdminById(managerId);
		if (!manager) {
			throw new BadRequestException('Manager admin not found');
		}

		return this.processAdminCreation(createAdminDto, managerId);
	}

	private async processAdminCreation(createAdminDto: CreateAdminDto, managerId: number | null) {
		const existingAdmin = await this.adminRepository.findAdminByEmail(createAdminDto.email);
		
		if (existingAdmin) {
			throw new ConflictException('Admin with this email already exists');
		}

		const hashedPassword = await bcrypt.hash(createAdminDto.password, 10);

		const admin = await this.adminRepository.createAdmin({
			email: createAdminDto.email,
			password: hashedPassword,
			full_name: createAdminDto.full_name,
			phone: createAdminDto.phone,
			avatar: createAdminDto.avatar,
			managed_by: managerId ? {
				connect: { id: managerId }
			} : undefined
		});

		// Exclude password from response
		const { password, ...adminWithoutPassword } = admin;
		return adminWithoutPassword;
	}

	async getAllAdmins() {
		const admins = await this.adminRepository.findAllAdmins();
		// Remove passwords from response
		return admins.map(admin => {
			const { password, ...adminWithoutPassword } = admin;
			return adminWithoutPassword;
		});
	}

	async deactivateAdmin(id: number, currentAdminId: number) {
		await this.ensureInitialAdmin(currentAdminId);

		const admin = await this.adminRepository.findAdminById(id);
		if (!admin) {
			throw new BadRequestException('Admin not found');
		}

		const deactivatedAdmin = await this.adminRepository.deactivateAdmin(id);
		const { password, ...adminWithoutPassword } = deactivatedAdmin;
		return adminWithoutPassword;
	}

	async activateAdmin(id: number, currentAdminId: number) {
		await this.ensureInitialAdmin(currentAdminId);

		const admin = await this.adminRepository.findAdminById(id);
		if (!admin) {
			throw new BadRequestException('Admin not found');
		}

		const activatedAdmin = await this.adminRepository.activateAdmin(id);
		const { password, ...activatedAdminWithoutPassword } = activatedAdmin;
		return activatedAdminWithoutPassword;
	}

	async updateAdmin(id: number, updateAdminDto: UpdateAdminDto, currentAdminId: number) {
		await this.ensureInitialAdmin(currentAdminId);

		const admin = await this.adminRepository.findAdminById(id);
		if (!admin) {
			throw new BadRequestException('Admin not found');
		}

		if (updateAdminDto.email) {
			const existingAdmin = await this.adminRepository.findAdminByEmail(updateAdminDto.email);
			if (existingAdmin && existingAdmin.id !== id) {
				throw new ConflictException('Admin with this email already exists');
			}
		}

		const updateData: Parameters<AdminRepository['updateAdmin']>[1] = {
			email: updateAdminDto.email,
			full_name: updateAdminDto.full_name,
			phone: updateAdminDto.phone,
			avatar: updateAdminDto.avatar,
			password: updateAdminDto.password ? await bcrypt.hash(updateAdminDto.password, 10) : undefined,
		};

		const updatedAdmin = await this.adminRepository.updateAdmin(id, updateData);
		const { password, ...updatedAdminWithoutPassword } = updatedAdmin;
		return updatedAdminWithoutPassword;
	}

	private async ensureInitialAdmin(adminId: number) {
		const currentAdmin = await this.adminRepository.findAdminById(adminId);
		if (!currentAdmin) {
			throw new UnauthorizedException('Admin not found');
		}

		if (currentAdmin.manager_id !== null) {
			throw new ForbiddenException('Only initial admins can manage other admins');
		}

		return currentAdmin;
	}
}
