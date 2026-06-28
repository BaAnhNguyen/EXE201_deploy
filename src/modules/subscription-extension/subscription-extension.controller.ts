import { BadRequestException, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('subscription-extension')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubscriptionExtensionController {
  @Post('extend')
  @Roles('SHOPOWNER')
  extendSubscription() {
    throw new BadRequestException(
      'Gia hạn phải qua thanh toán PayOS. Dùng POST /subscriptions/purchase/renew/initiate',
    );
  }
}
