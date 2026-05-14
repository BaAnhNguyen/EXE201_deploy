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
}
