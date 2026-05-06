import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SubscriptionRepository } from './subscription.repository';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@Injectable()
export class SubscriptionService {
  constructor(private readonly subscriptionRepository: SubscriptionRepository) {}

  async create(createSubscriptionDto: CreateSubscriptionDto) {
    try {
      return await this.subscriptionRepository.create(createSubscriptionDto as any);
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
