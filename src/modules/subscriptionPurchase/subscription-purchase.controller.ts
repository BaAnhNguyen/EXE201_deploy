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
}
