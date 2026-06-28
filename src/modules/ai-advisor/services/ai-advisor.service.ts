import { Injectable, Logger } from '@nestjs/common';
import { AnalyticsService }     from './analytics.service';
import { ContextBuilderService } from './context-builder.service';
import { GeminiService }        from './gemini.service';
import { ChatRequestDto }       from '../dto';
import { AdvisorResponse }      from '../types';

@Injectable()
export class AiAdvisorService {
  private readonly logger = new Logger(AiAdvisorService.name);

  constructor(
    private readonly analytics:      AnalyticsService,
    private readonly contextBuilder: ContextBuilderService,
    private readonly gemini:         GeminiService,
  ) {}

  async chat(dto: ChatRequestDto): Promise<AdvisorResponse> {
    const { tenant_id, shop_id, message, history = [], period_days = 30 } = dto;

    this.logger.log(
      `Chat — tenant=${tenant_id} shop=${shop_id ?? 'all'} period=${period_days}d model=gemini`,
    );

    const businessContext = await this.analytics.buildBusinessContext(
      tenant_id,
      shop_id,
      period_days,
    );

    const systemPrompt = this.contextBuilder.buildSystemPrompt(businessContext);

    return this.gemini.chat(systemPrompt, history, message);
  }

  async getSnapshot(tenant_id: number, shop_id?: number, period_days = 30) {
    return this.analytics.buildBusinessContext(tenant_id, shop_id, period_days);
  }
}
