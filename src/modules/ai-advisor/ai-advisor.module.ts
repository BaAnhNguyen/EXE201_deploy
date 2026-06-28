import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Services
import { AiAdvisorService }     from './services/ai-advisor.service';
import { AnalyticsService }     from './services/analytics.service';
import { ContextBuilderService } from './services/context-builder.service';
import { GeminiService }        from './services/gemini.service';

// Controller
import { AiAdvisorController }  from './controllers/ai-advisor.controller';
import { PrismaService } from 'src/database/prisma.service';

// ⚠️  PrismaModule must be a global module in your app (or import it here).
// If your PrismaModule is NOT global, uncomment the line below:
// import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    ConfigModule,
    // PrismaModule,
  ],
  controllers: [AiAdvisorController],
  providers: [
    AiAdvisorService,
    AnalyticsService,
    ContextBuilderService,
    GeminiService,
    PrismaService
  ],
  exports: [AiAdvisorService],
})
export class AiAdvisorModule {}
