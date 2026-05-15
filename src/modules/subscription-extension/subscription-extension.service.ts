import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SubscriptionExtensionService {
  constructor(private readonly prisma: PrismaService) {}

  async extendSubscription(tenantId: number) {
    if (!tenantId) {
      throw new NotFoundException('Tenant ID is required.');
    }

    // 1. Find the current active or newest tenant subscription
    const currentTenantSubscription = await this.prisma.tenantSubscription.findFirst({
      where: {
        tenant_id: tenantId,
      },
      include: {
        subscription: true,
      },
      orderBy: {
        end_date: 'desc'
      }
    });

    if (!currentTenantSubscription) {
      throw new NotFoundException('No subscription found for this tenant.');
    }

    const billingCycle = currentTenantSubscription.subscription.billing_cycle;
    
    // 2. Calculate new end date
    const currentEndDate = currentTenantSubscription.end_date || new Date();
    // Compare with current date, in case the subscription has already expired
    const baseDate = currentEndDate.getTime() > new Date().getTime() ? currentEndDate : new Date();
    const newEndDate = new Date(baseDate);

    if (billingCycle === 'MONTHLY') {
      newEndDate.setDate(newEndDate.getDate() + 30);
    } else if (billingCycle === 'YEARLY') {
      newEndDate.setDate(newEndDate.getDate() + 365);
    } else {
      newEndDate.setDate(newEndDate.getDate() + 30); // fallback
    }

    // 3. Update the tenant subscription
    const updatedTenantSubscription = await this.prisma.tenantSubscription.update({
      where: {
        id: currentTenantSubscription.id,
      },
      data: {
        end_date: newEndDate,
        is_expired: false,
        number_of_renewals: {
          increment: 1,
        },
      }
    });

    return {
      message: 'Subscription extended successfully.',
      data: updatedTenantSubscription,
    };
  }
}
