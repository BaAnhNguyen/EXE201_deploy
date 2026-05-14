import { Module } from '@nestjs/common';
import { EmailService } from './services/email.service';
import { FeatureValidationService } from './services/feature-validation.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [EmailService, FeatureValidationService],
  exports: [EmailService, FeatureValidationService],
})
export class CommonModule {}