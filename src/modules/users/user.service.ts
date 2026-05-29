import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { EmailService } from 'src/common/services/email.service';
import { CreateCashierDto } from './dto/create-cashier.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly emailService: EmailService,
	) {}

	async createCashier(dto: CreateCashierDto, tenantId: number | null | undefined, shopIdFromToken: number | null | undefined) {
		if (!tenantId) {
			throw new ForbiddenException('Không tìm thấy tenant của tài khoản đang đăng nhập');
		}

		const targetShopId = dto.shop_id ?? shopIdFromToken;
		if (!targetShopId) {
			throw new BadRequestException('Cần shop_id để tạo tài khoản cashier');
		}

		const shop = await this.prisma.shop.findFirst({
			where: { id: targetShopId, tenant_id: tenantId },
		});

		if (!shop) {
			throw new NotFoundException(`Shop #${targetShopId} not found`);
		}

		const cashierRole = await this.prisma.role.findUnique({
			where: { role_code: 'CASHIER' },
		});

		if (!cashierRole) {
			throw new NotFoundException('Role CASHIER not found');
		}

		const existedUser = await this.prisma.user.findFirst({
			where: {
				OR: [{ username: dto.username }, { email: dto.email }],
			},
		});

		if (existedUser) {
			throw new ConflictException('Username or email already exists');
		}

		const hashedPassword = await bcrypt.hash(dto.password, 10);

		const cashier = await this.prisma.user.create({
			data: {
				username: dto.username,
				email: dto.email,
				password: hashedPassword,
				full_name: dto.full_name,
				tenant_id: tenantId,
				shop_id: targetShopId,
				role_id: cashierRole.id,
				is_active: true,
			},
			include: {
				role: true,
				shop: true,
			},
		});

		let emailSent = true;
		let emailError: string | null = null;

		try {
			const appUrl = process.env.APP_URL || 'http://localhost:5000';
			await this.emailService.sendNewAccountEmail(dto.email, dto.username, dto.password, appUrl);
		} catch (error: any) {
			emailSent = false;
			emailError = error?.message ?? 'Failed to send email';
		}

		return {
			message: emailSent
				? 'Cashier account created and email sent successfully'
				: 'Cashier account created but email could not be sent',
			email_sent: emailSent,
			email_error: emailError,
			cashier: {
				id: cashier.id,
				username: cashier.username,
				email: cashier.email,
				full_name: cashier.full_name,
				shop_id: cashier.shop_id,
				tenant_id: cashier.tenant_id,
				role_code: cashier.role?.role_code,
			},
		};
	}
}
