import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: number) {
    return this.prisma.notification.findMany({
      where: { tenant_id: tenantId },
      orderBy: { created_at: 'desc' },
    });
  }

  async markAsRead(id: number, tenantId: number) {
    return this.prisma.notification.updateMany({
      where: { id, tenant_id: tenantId },
      data: { is_read: true },
    });
  }

  async create(data: Prisma.NotificationUncheckedCreateInput) {
    return this.prisma.notification.create({ data });
  }

  async findExistingUnread(tenantId: number, title: string) {
    return this.prisma.notification.findFirst({
      where: {
        tenant_id: tenantId,
        title,
        is_read: false,
      },
    });
  }
}
