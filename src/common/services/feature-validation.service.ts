import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class FeatureValidationService {
  constructor(private readonly prisma: PrismaService) {}

  async validateShopLimit(tenantId: number): Promise<void> {
    const quota = await this.getShopQuota(tenantId);
    if (quota.max_shops == null) {
      throw new ForbiddenException('Your subscription plan does not support creating shops.');
    }
    if (quota.current_count >= quota.max_shops) {
      throw new ForbiddenException(
        `Your plan allows a maximum of ${quota.max_shops} shop(s). Please upgrade to add more.`,
      );
    }
  }

  /** Hạn mức MAX_SHOPS — dùng cho GET /shops/quota */
  async getShopQuota(tenantId: number): Promise<{
    current_count: number;
    max_shops: number | null;
    can_create_more: boolean;
    package_code: string | null;
  }> {
    const current_count = await this.prisma.shop.count({
      where: {
        tenant_id: tenantId,
        is_active: true,
      },
    });

    const tenantSubscription = await this.prisma.tenantSubscription.findFirst({
      where: {
        tenant_id: tenantId,
        is_expired: false,
        OR: [{ end_date: null }, { end_date: { gt: new Date() } }],
      },
      include: { subscription: true },
      orderBy: { end_date: 'desc' },
    });

    if (!tenantSubscription) {
      return {
        current_count,
        max_shops: null,
        can_create_more: false,
        package_code: null,
      };
    }

    const featureLimit = await this.prisma.subscriptionFeature.findFirst({
      where: {
        subscription_id: tenantSubscription.subscription_id,
        feature: {
          feature_code: 'MAX_SHOPS',
        },
      },
    });

    const max_shops =
      featureLimit?.limit_value != null ? featureLimit.limit_value : null;
    const can_create_more =
      max_shops != null && max_shops > 0 && current_count < max_shops;

    return {
      current_count,
      max_shops,
      can_create_more,
      package_code: tenantSubscription.subscription.package_code,
    };
  }
}
