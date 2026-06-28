import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { ReportRepository } from './report.repository';
import { DatabaseModule } from '../../database/database.module';
import { CommonModule } from '../../common/common.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    CacheModule.register({
      ttl: 30000, // 30 seconds default TTL
    }),
    DatabaseModule,
    CommonModule,
    JwtModule,
  ],
  controllers: [ReportController],
  providers: [ReportService, ReportRepository],
  exports: [ReportService],
})
export class ReportModule {}
