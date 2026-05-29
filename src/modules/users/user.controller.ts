import {
	Body,
	Controller,
	Post,
	Req,
	UseGuards,
	UsePipes,
	ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserService } from './user.service';
import { CreateCashierDto } from './dto/create-cashier.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
	constructor(private readonly userService: UserService) {}

	@Post('cashiers')
	@Roles('SHOPOWNER')
	@UsePipes(new ValidationPipe({ transform: true }))
	createCashier(@Body() dto: CreateCashierDto, @Req() req: any) {
		return this.userService.createCashier(dto, req.user?.tenant_id, req.user?.shop_id);
	}
}
