import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SubscriptionRepository } from './subscription.repository';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly prisma: PrismaService
  ) {}

  async create(createSubscriptionDto: CreateSubscriptionDto) {
    try {
      const { max_shops, ...subscriptionData } = createSubscriptionDto;

      // 1. Create the subscription within a transaction if we need to link features
      return await this.prisma.$transaction(async (tx) => {
        const subscription = await tx.subscription.create({
          data: subscriptionData as any,
        });

        // 2. If max_shops is provided, automatically link it to MAX_SHOPS feature
        if (max_shops !== undefined) {
          // Ensure MAX_SHOPS feature exists
          const feature = await tx.feature.upsert({
            where: { feature_code: 'MAX_SHOPS' },
            create: { feature_code: 'MAX_SHOPS', description: 'Maximum number of shops a tenant can create', is_active: true },
            update: {},
          });

          // Create the linkage
          await tx.subscriptionFeature.create({
            data: {
              subscription_id: subscription.id,
              feature_id: feature.id,
              limit_value: max_shops,
            },
          });
        }

        return subscription;
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Package code already exists');
      }
      throw error;
    }
  }

  async findAll() {
    return this.subscriptionRepository.findAll();
  }

  async findOne(id: number) {
    const subscription = await this.subscriptionRepository.findById(id);
    if (!subscription) {
      throw new NotFoundException(`Subscription with ID #${id} not found`);
    }
    return subscription;
  }

  async update(id: number, updateSubscriptionDto: UpdateSubscriptionDto) {
    await this.findOne(id); // Check existence
    try {
      return await this.subscriptionRepository.update(id, updateSubscriptionDto as any);
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Package code already exists');
      }
      throw error;
    }
  }

  async activate(id: number) {
    await this.findOne(id); // Check existence
    return this.subscriptionRepository.updateStatus(id, true);
  }

  async deactivate(id: number) {
    await this.findOne(id); // Check existence
    return this.subscriptionRepository.updateStatus(id, false);
  }

  async getSubscriptionStats() {
    // ── 1. Per-package: tenant count + payments + renewals ──────────────
    const packages = await this.prisma.subscription.findMany({
      select: {
        id: true,
        package_code: true,
        description: true,
        price: true,
        _count: {
          select: { tenant_subscriptions: true },
        },
        tenant_subscriptions: {
          select: {
            number_of_renewals: true,
            subscription_payments: {
              where: { payment_status: 'PAID' },
              select: { amount: true },
            },
          },
        },
      },
    });

    // ── 2. Tổng doanh thu + tổng lượt thanh toán ──────────────────────
    const revenueAggr = await this.prisma.subscriptionPayment.aggregate({
      _sum: { amount: true },
      _count: true,
      where: { payment_status: 'PAID' },
    });

    // ── 3. Tổng lượt gia hạn ──────────────────────────────────────────
    const renewalAggr = await this.prisma.tenantSubscription.aggregate({
      _sum: { number_of_renewals: true },
    });

    // ── 4. Map per-package ─────────────────────────────────────────────
    const packageStats = packages.map(pkg => {
      const renewals = pkg.tenant_subscriptions.reduce(
        (sum, ts) => sum + (ts.number_of_renewals ?? 0),
        0,
      );
      const revenue = pkg.tenant_subscriptions.reduce(
        (sum, ts) =>
          sum +
          ts.subscription_payments.reduce(
            (pSum, p) => pSum + Number(p.amount),
            0,
          ),
        0,
      );
      const paymentCount = pkg.tenant_subscriptions.reduce(
        (sum, ts) => sum + ts.subscription_payments.length,
        0,
      );

      return {
        id: pkg.id,
        package_code: pkg.package_code,
        description: pkg.description,
        price: pkg.price,
        total_purchased: pkg._count.tenant_subscriptions,
        total_renewals: renewals,
        total_payments: paymentCount,
        revenue,
      };
    });

    return {
      totalRevenue: revenueAggr._sum.amount || 0,
      totalPayments: revenueAggr._count || 0,
      totalRenewals: renewalAggr._sum.number_of_renewals || 0,
      packageStats,
    };
  }
}
