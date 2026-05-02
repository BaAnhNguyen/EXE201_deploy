import {
	BadRequestException,
	ConflictException,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { StringValue } from 'ms';
import { PrismaService } from 'src/database/prisma.service';
import { AuthRepository } from './auth.repository';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

type AuthPayload = {
	sub: number;
	username: string;
	email: string;
	role_id: number | null;
	tenant_id: number | null;
	shop_id: number | null;
};

@Injectable()
export class AuthService {
	constructor(
		private readonly authRepository: AuthRepository,
		private readonly prismaService: PrismaService,
		private readonly jwtService: JwtService,
		private readonly configService: ConfigService,
	) {}

	async register(registerDto: RegisterDto) {
		const existedUser = await this.authRepository.findUserByEmailOrUsername(
			registerDto.email,
			registerDto.username,
		);

		if (existedUser) {
			throw new ConflictException('Email or username already exists');
		}

		const hashedPassword = await bcrypt.hash(registerDto.password, 10);

		return this.prismaService.withTransaction(async (transactionClient) => {
			const createdUser = await this.authRepository.createUser(
				{
					username: registerDto.username,
					email: registerDto.email,
					password: hashedPassword,
					full_name: registerDto.full_name,
					phone: registerDto.phone,
					tenant_id: registerDto.tenant_id ?? null,
					shop_id: registerDto.shop_id ?? null,
					role_id: registerDto.role_id ?? null,
				},
				transactionClient,
			);

			const token = await this.signToken(createdUser);

			return {
				user: this.mapUserResponse(createdUser),
			};
		});
	}

	async login(loginDto: LoginDto) {
		if (!loginDto.username && !loginDto.email) {
			throw new BadRequestException('Username or email is required');
		}

		const user = await this.authRepository.findUserByEmailOrUsername(
			loginDto.email ?? '',
			loginDto.username ?? '',
		);

		if (!user) {
			throw new UnauthorizedException('Invalid username/email or password');
		}

		const isPasswordMatched = await bcrypt.compare(loginDto.password, user.password);

		if (!isPasswordMatched) {
			throw new UnauthorizedException('Invalid username/email or password');
		}

		await this.authRepository.updateLastLogin(user.id);

		const token = await this.signToken(user);

		return {
			accessToken: token,
			user: this.mapUserResponse(user),
		};
	}

	private async signToken(user: User): Promise<string> {
		const payload: AuthPayload = {
			sub: user.id,
			username: user.username,
			email: user.email,
			role_id: user.role_id,
			tenant_id: user.tenant_id,
			shop_id: user.shop_id,
		};

		return this.jwtService.signAsync(payload);
	}

	private mapUserResponse(user: User) {
		return {
			id: user.id,
			username: user.username,
			email: user.email,
			full_name: user.full_name,
			phone: user.phone,
			avatar: user.avatar,
			role_id: user.role_id,
			tenant_id: user.tenant_id,
			shop_id: user.shop_id,
			is_active: user.is_active,
			created_at: user.created_at,
			updated_at: user.updated_at,
			last_login: user.last_login,
		};
	}
}
