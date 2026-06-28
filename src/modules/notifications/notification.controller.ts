import { Controller, Get, Param, ParseIntPipe, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { NotificationService } from './notification.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @Roles('SHOPOWNER', 'CASHIER')
  async getNotifications(@Req() req: any) {
    const tenantId = req.user.tenant_id;
    return this.notificationService.getNotifications(tenantId);
  }

  @Patch(':id/read')
  @Roles('SHOPOWNER', 'CASHIER')
  async markAsRead(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const tenantId = req.user.tenant_id;
    return this.notificationService.markAsRead(id, tenantId);
  }
}
