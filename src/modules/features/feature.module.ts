import { Module } from '@nestjs/common';
import { FeatureService } from './feature.service';
import { FeatureController } from './feature.controller';
import { FeatureRepository } from './feature.repository';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../auth/auth.module'; // for guards

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [FeatureController],
  providers: [FeatureService, FeatureRepository],
  exports: [FeatureService],
})
export class FeatureModule {}
