import { Body, Controller, Post, Get, Patch, Delete, Param, Req, UnauthorizedException, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { LoginAdminDto } from './dto/login-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminOnlyGuard } from 'src/common/guards/admin-only.guard';
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
	@UseGuards(JwtAuthGuard,AdminOnlyGuard)
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

	@Get()
	@UseGuards(JwtAuthGuard, AdminOnlyGuard)
	getAllAdmins() {
		return this.adminService.getAllAdmins();
	}

	@Patch(':id/deactivate')
	@UseGuards(JwtAuthGuard, AdminOnlyGuard)
	deactivateAdmin(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
		const currentAdminId = req.user?.sub || req.user?.id;

		if (!currentAdminId) {
			throw new UnauthorizedException('Authentication required.');
		}

		return this.adminService.deactivateAdmin(id, currentAdminId);
	}

	@Patch(':id/activate')
	@UseGuards(JwtAuthGuard, AdminOnlyGuard)
	activateAdmin(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
		const currentAdminId = req.user?.sub || req.user?.id;

		if (!currentAdminId) {
			throw new UnauthorizedException('Authentication required.');
		}

		return this.adminService.activateAdmin(id, currentAdminId);
	}

	@Patch(':id')
	@UseGuards(JwtAuthGuard, AdminOnlyGuard)
	updateAdmin(
		@Param('id', ParseIntPipe) id: number,
		@Body() updateAdminDto: UpdateAdminDto,
		@Req() req: any,
	) {
		const currentAdminId = req.user?.sub || req.user?.id;

		if (!currentAdminId) {
			throw new UnauthorizedException('Authentication required.');
		}

		return this.adminService.updateAdmin(id, updateAdminDto, currentAdminId);
	}
}
