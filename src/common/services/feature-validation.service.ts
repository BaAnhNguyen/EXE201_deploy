import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class FeatureValidationService {
  constructor(private readonly prisma: PrismaService) {}

  async validateShopLimit(tenantId: number): Promise<void> {
    // 1. Get tenant's active subscription
    const tenantSubscription = await this.prisma.tenantSubscription.findFirst({
      where: {
        tenant_id: tenantId,
        is_expired: false,
        OR: [
          { end_date: null },
          { end_date: { gt: new Date() } }
        ]
      },
      include: { subscription: true }
    });

    if (!tenantSubscription) {
      throw new ForbiddenException('No active subscription found for this tenant.');
    }

    // 2. Get the feature limit
    const featureLimit = await this.prisma.subscriptionFeature.findFirst({
      where: {
        subscription_id: tenantSubscription.subscription_id,
        feature: {
          feature_code: 'MAX_SHOPS'
        }
      }
    });

    if (!featureLimit || featureLimit.limit_value === null) {
      throw new ForbiddenException('Your subscription plan does not support creating shops.');
    }

    const { limit_value } = featureLimit;

    // 3. Count current active shops for the tenant
    const currentShopCount = await this.prisma.shop.count({
      where: {
        tenant_id: tenantId,
        is_active: true // Or check for deleted_at if you implement soft-delete for shops later
      }
    });

    // 4. Validate
    if (currentShopCount >= limit_value) {
      throw new ForbiddenException(`Your plan allows a maximum of ${limit_value} shop(s). Please upgrade to add more.`);
    }
  }
}
