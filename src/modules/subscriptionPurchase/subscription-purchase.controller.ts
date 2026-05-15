import { Body, Controller, Get, Param, Post, Headers } from '@nestjs/common';
import { SubscriptionPurchaseService } from './subscription-purchase.service';
import { InitiateSubscriptionDto } from './dto/initiate-subscription.dto';

@Controller('subscriptions/purchase')
export class SubscriptionPurchaseController {
  constructor(private readonly purchaseService: SubscriptionPurchaseService) {}

  @Post('initiate')
  initiate(@Body() dto: InitiateSubscriptionDto) {
    return this.purchaseService.initiatePayment(dto);
  }

  @Post('webhook')
  webhook(@Body() body: any) {
    return this.purchaseService.handlePayOSWebhook(body);
  }

  @Get('status/:orderCode')
  checkStatus(@Param('orderCode') orderCode: string) {
    return this.purchaseService.checkStatus(orderCode);
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
