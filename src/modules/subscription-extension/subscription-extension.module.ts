import { Module } from '@nestjs/common';
import { SubscriptionExtensionController } from './subscription-extension.controller';
import { SubscriptionExtensionService } from './subscription-extension.service';
import { DatabaseModule } from '../../database/database.module';
import { JwtModule } from '@nestjs/jwt';
@Module({
  imports: [DatabaseModule, JwtModule],
  controllers: [SubscriptionExtensionController],
  providers: [SubscriptionExtensionService],
})
export class SubscriptionExtensionModule {}
