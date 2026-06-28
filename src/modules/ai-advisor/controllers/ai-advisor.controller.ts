import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Res,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';
import { AiAdvisorService }  from '../services/ai-advisor.service';
import { AnalyticsService }  from '../services/analytics.service';
import { ContextBuilderService } from '../services/context-builder.service';
import { GeminiService }     from '../services/gemini.service';
import { ChatRequestDto }    from '../dto';

@ApiTags('AI Advisor')
@Controller('ai-advisor')
export class AiAdvisorController {
  constructor(
    private readonly advisor:        AiAdvisorService,
    private readonly analytics:      AnalyticsService,
    private readonly contextBuilder: ContextBuilderService,
    private readonly gemini:         GeminiService,
  ) {}

  /** POST /ai-advisor/chat — full response */
  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Chat với AI Advisor (Gemini, non-streaming)' })
  @ApiResponse({ status: 200, description: 'Gemini response' })
  async chat(@Body() dto: ChatRequestDto) {
    const response = await this.advisor.chat(dto);
    return { success: true, data: response };
  }

  /** POST /ai-advisor/chat/stream — SSE streaming */
  @Post('chat/stream')
  @ApiOperation({ summary: 'Chat với AI Advisor (Gemini, streaming SSE)' })
  async chatStream(@Body() dto: ChatRequestDto, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const { tenant_id, shop_id, message, history = [], period_days = 30 } = dto;

    const businessContext = await this.analytics.buildBusinessContext(
      tenant_id,
      shop_id,
      period_days,
    );
    const systemPrompt = this.contextBuilder.buildSystemPrompt(businessContext);

    try {
      for await (const chunk of this.gemini.chatStream(systemPrompt, history, message)) {
        res.write(`data: ${JSON.stringify({ token: chunk })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    } catch {
      res.write(`data: ${JSON.stringify({ error: 'Lỗi AI, vui lòng thử lại' })}\n\n`);
    } finally {
      res.end();
    }
  }

  /** GET /ai-advisor/snapshot — raw analytics data */
  @Get('snapshot')
  @ApiOperation({ summary: 'Lấy snapshot dữ liệu kinh doanh' })
  @ApiQuery({ name: 'tenant_id',   required: true,  type: Number })
  @ApiQuery({ name: 'shop_id',     required: false, type: Number })
  @ApiQuery({ name: 'period_days', required: false, type: Number })
  async snapshot(
    @Query('tenant_id', ParseIntPipe) tenant_id: number,
    @Query('shop_id',   new DefaultValuePipe(undefined)) shop_id?: number,
    @Query('period_days', new DefaultValuePipe(30), ParseIntPipe) period_days?: number,
  ) {
    const data = await this.advisor.getSnapshot(
      tenant_id,
      shop_id ? Number(shop_id) : undefined,
      period_days,
    );
    return { success: true, data };
  }
}
