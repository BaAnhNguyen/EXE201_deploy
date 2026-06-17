import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { SubscriptionPurchaseService } from './subscription-purchase.service';
import { InitiateSubscriptionDto } from './dto/initiate-subscription.dto';
import { InitiateRenewSubscriptionDto } from './dto/initiate-renew-subscription.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('subscriptions/purchase')
export class SubscriptionPurchaseController {
  constructor(private readonly purchaseService: SubscriptionPurchaseService) {}

  @Post('initiate')
  initiate(@Body() dto: InitiateSubscriptionDto) {
    return this.purchaseService.initiatePayment(dto);
  }

  @Post('renew/initiate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SHOPOWNER')
  initiateRenew(@Req() req: { user: { sub: number; tenant_id?: number | null } }, @Body() dto: InitiateRenewSubscriptionDto) {
    return this.purchaseService.initiateRenewPayment(
      req.user.sub,
      req.user.tenant_id,
      dto.subscription_id,
      dto.payment_method,
    );
  }

  @Post('webhook')
  webhook(@Body() body: any) {
    return this.purchaseService.handlePayOSWebhook(body);
  }

  @Get('status/:orderCode')
  checkStatus(@Param('orderCode') orderCode: string) {
    return this.purchaseService.checkStatus(orderCode);
  }

  /** Gọi từ trang success khi PayOS redirect status=PAID (bù webhook localhost) */
  @Post('confirm')
  confirmPayment(@Body() dto: ConfirmPaymentDto) {
    return this.purchaseService.confirmPaymentFromReturn(dto.orderCode);
  }

  @Get('pending-cash')
  getPendingCashRequests() {
    return this.purchaseService.getPendingCashRequests();
  }

  @Post('confirm-cash/:orderCode')
  confirmCashPayment(@Param('orderCode') orderCode: string) {
    return this.purchaseService.confirmCashPayment(orderCode);
  }
  // Thêm vào controller
    @Post('confirm-webhook')
  confirmWebhook() {
    return this.purchaseService.confirmWebhook();
  }

  // API dùng để test chức năng xóa tenant hết hạn thủ công qua Postman
  @Post('test-cleanup-tenants')
  async testCleanupTenants() {
    await this.purchaseService.cleanupExpiredTenants();
    return { success: true, message: 'Cleanup expired tenants triggered successfully' };
  }

  // API dùng để test update trạng thái is_expired = true cho những subscription đã hết hạn
  @Post('test-update-expired')
  async testUpdateExpired() {
    const result = await this.purchaseService.updateExpiredSubscriptions();
    return { success: true, updatedCount: result.count, message: 'Expired subscriptions updated successfully' };
  }
}
