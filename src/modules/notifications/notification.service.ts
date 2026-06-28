import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationRepository } from './notification.repository';


@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly prisma: PrismaService,
  ) {}

  async getNotifications(tenantId: number) {
    // 1. Run dynamic system checks to generate notifications
    await this.generateSubscriptionNotifications(tenantId);
    await this.generateInventoryNotifications(tenantId);

    // 2. Retrieve all notifications for the tenant
    return this.notificationRepository.findAll(tenantId);
  }

  async markAsRead(id: number, tenantId: number) {
    return this.notificationRepository.markAsRead(id, tenantId);
  }

  // Helper to generate notifications about subscription status
  private async generateSubscriptionNotifications(tenantId: number) {
    const activeSub = await this.prisma.tenantSubscription.findFirst({
      where: { tenant_id: tenantId },
      include: { subscription: true },
      orderBy: { end_date: 'desc' },
    });

    if (!activeSub || !activeSub.end_date) {
      return;
    }

    const now = new Date();
    const expiry = new Date(activeSub.end_date);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      const title = 'Gói dịch vụ SaaS đã hết hạn';
      const content = `Gói dịch vụ "${activeSub.subscription.description || activeSub.subscription.package_code}" của bạn đã hết hạn. Vui lòng gia hạn ngay để không bị gián đoạn truy cập.`;
      
      const existing = await this.notificationRepository.findExistingUnread(tenantId, title);
      if (!existing) {
        await this.notificationRepository.create({
          tenant_id: tenantId,
          title,
          content,
          severity_level: 'CRITICAL',
        });
      }
    } else if (diffDays <= 3) {
      const title = 'Gói dịch vụ SaaS sắp hết hạn';
      const content = `Gói dịch vụ "${activeSub.subscription.description || activeSub.subscription.package_code}" của bạn sẽ hết hạn trong ${diffDays} ngày nữa. Vui lòng gia hạn.`;
      
      const existing = await this.notificationRepository.findExistingUnread(tenantId, title);
      if (!existing) {
        await this.notificationRepository.create({
          tenant_id: tenantId,
          title,
          content,
          severity_level: 'WARNING',
        });
      }
    }
  }

  // Helper to generate warnings for low stock inventory items
  private async generateInventoryNotifications(tenantId: number) {
    const shops = await this.prisma.shop.findMany({
      where: { tenant_id: tenantId, is_active: true },
    });

    for (const shop of shops) {
      const inventory = await this.prisma.inventory.findUnique({
        where: { shop_id: shop.id },
      });

      if (!inventory) {
        continue;
      }

      const allItems = await this.prisma.inventoryItem.findMany({
        where: { inventory_id: inventory.id },
        include: { ingredient: true },
      });

      const lowStockItems = allItems.filter(
        (item) => item.minimum_threshold !== null && item.theorical_quantity <= item.minimum_threshold
      );

      for (const item of lowStockItems) {
        if (!item.ingredient.is_active) continue;

        const title = `Nguyên liệu cạn kho: ${item.ingredient.name} tại ${shop.shop_name}`;
        const content = `Nguyên liệu "${item.ingredient.name}" sắp hết (Hiện tại: ${item.theorical_quantity ?? 0} ${item.ingredient.unit || ''}, Ngưỡng tối thiểu: ${item.minimum_threshold}).`;

        const existing = await this.notificationRepository.findExistingUnread(tenantId, title);
        if (!existing) {
          await this.notificationRepository.create({
            tenant_id: tenantId,
            title,
            content,
            severity_level: 'WARNING',
          });
        }
      }
    }
  }
}
