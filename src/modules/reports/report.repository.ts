import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getOrdersForReport(tenantId: number, startDate?: Date, endDate?: Date, shopId?: number) {
    const whereClause: any = {
      shift: {
        shop: {
          tenant_id: tenantId,
        },
      },
    };

    if (shopId) {
      whereClause.shift.shop_id = shopId;
    }

    if (startDate || endDate) {
      whereClause.created_at = {};
      if (startDate) {
        whereClause.created_at.gte = startDate;
      }
      if (endDate) {
        whereClause.created_at.lte = endDate;
      }
    }

    return this.prisma.orders.findMany({
      where: whereClause,
      include: {
        order_items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async getAllActiveProducts(tenantId: number) {
    return this.prisma.product.findMany({
      where: {
        category: { tenant_id: tenantId },
        is_active: true,
      },
      select: {
        id: true,
        product_name: true,
      },
    });
  }
}
