import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionPurchaseService } from './subscription-purchase.service';

@Injectable()
export class SubscriptionCleanupTask {
  constructor(private readonly purchaseService: SubscriptionPurchaseService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    await this.purchaseService.cleanupExpiredPending();
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpiredTenantsCron() {
    await this.purchaseService.cleanupExpiredTenants();
  }
}
