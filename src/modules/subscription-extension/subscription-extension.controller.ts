import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { SubscriptionExtensionService } from './subscription-extension.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('subscription-extension')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubscriptionExtensionController {
  constructor(private readonly subscriptionExtensionService: SubscriptionExtensionService) {}

  @Post('extend')
  @Roles('SHOPOWNER')
  async extendSubscription(@Req() req: any) {
    const tenantId = req.user?.tenant_id;
    return this.subscriptionExtensionService.extendSubscription(tenantId);
  }
}
