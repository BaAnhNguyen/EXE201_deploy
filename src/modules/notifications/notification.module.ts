import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationRepository } from './notification.repository';
import { DatabaseModule } from '../../database/database.module';
import { CommonModule } from '../../common/common.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [DatabaseModule, CommonModule, JwtModule],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationRepository],
  exports: [NotificationService],
})
export class NotificationModule {}
