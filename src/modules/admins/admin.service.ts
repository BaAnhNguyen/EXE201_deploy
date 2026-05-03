import { ConflictException, Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { AdminRepository } from './admin.repository';
import { CreateAdminDto } from './dto/create-admin.dto';
import { LoginAdminDto } from './dto/login-admin.dto';
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
			role: 'ADMIN', // Optional: Helps to identify token type later if needed
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
}
