import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SubscriptionPurchaseService } from './subscription-purchase.service';
import { SubscriptionPurchaseController } from './subscription-purchase.controller';
import { SubscriptionCleanupTask } from './subscription-cleanup.task';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    HttpModule,
    DatabaseModule,
    AuthModule,
  ],
  controllers: [SubscriptionPurchaseController],
  providers: [SubscriptionPurchaseService, SubscriptionCleanupTask],
  exports: [SubscriptionPurchaseService],
})
export class SubscriptionPurchaseModule {}
