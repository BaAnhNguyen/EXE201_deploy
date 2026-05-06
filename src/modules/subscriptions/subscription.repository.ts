import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, Subscription } from '@prisma/client';

@Injectable()
export class SubscriptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.SubscriptionCreateInput): Promise<Subscription> {
    return this.prisma.subscription.create({ data });
  }

  async findAll(): Promise<Subscription[]> {
    return this.prisma.subscription.findMany({
      where: { deleted_at: null },
    });
  }

  async findById(id: number): Promise<Subscription | null> {
    return this.prisma.subscription.findFirst({
      where: { id, deleted_at: null },
    });
  }

  async update(id: number, data: Prisma.SubscriptionUpdateInput): Promise<Subscription> {
    return this.prisma.subscription.update({
      where: { id },
      data,
    });
  }

  async updateStatus(id: number, is_active: boolean): Promise<Subscription> {
    return this.prisma.subscription.update({
      where: { id },
      data: { is_active },
    });
  }
}
