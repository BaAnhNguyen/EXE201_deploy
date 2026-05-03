import { Body, Controller, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { LoginAdminDto } from './dto/login-admin.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('admins')
export class AdminController {
	constructor(private readonly adminService: AdminService) {}

	@Post('login')
	login(@Body() loginDto: LoginAdminDto) {
		return this.adminService.login(loginDto);
	}

	@Post('initial')
	createInitialAdmin(@Body() createAdminDto: CreateAdminDto) {
		return this.adminService.createInitialAdmin(createAdminDto);
	}

	@Post()
	@UseGuards(JwtAuthGuard)
	createAdmin(
		@Body() createAdminDto: CreateAdminDto,
		@Req() req: any // Typically this would be handled by a JwtAuthGuard injecting the user into req
	) {
		// Extracting the current admin token from request after guard check
		const managerId = req.user?.sub || req.user?.id;
		
		if (!managerId) {
			throw new UnauthorizedException('Authentication required. Only existing admins can create new admins.');
		}

		return this.adminService.createAdmin(createAdminDto, managerId);
	}
}
