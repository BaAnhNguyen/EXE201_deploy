import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { ChatMessage, AdvisorResponse } from '../types';

@Injectable()
export class ClaudeService {
  private readonly logger = new Logger(ClaudeService.name);
  private readonly client: Anthropic;
  private readonly defaultModel = 'claude-3-5-sonnet-20241022'; // Hoặc model mặc định bạn muốn dùng

  constructor(private readonly config: ConfigService) {
    this.client = new Anthropic({
      apiKey: this.config.get<string>('ANTHROPIC_API_KEY'),
    });
  }

  async chat(
    systemPrompt: string,
    history: ChatMessage[],
    userMessage: string,
    fallbackModel?: string, // Model dự phòng truyền vào khi thử lại
  ): Promise<AdvisorResponse> {
    const currentModel = fallbackModel || this.defaultModel;

    try {
      const messages: Anthropic.MessageParam[] = [
        ...history.map((h) => ({
          role: h.role as 'user' | 'assistant',
          content: h.content,
        })),
        { role: 'user', content: userMessage },
      ];

      // Gọi Claude API
      const response = await this.client.messages.create({
        model: currentModel,
        max_tokens: 2048,
        system: systemPrompt,
        messages,
      });

      // Lấy text kết quả trả về
      const textBlock = response.content.find((block) => block.type === 'text');
      const replyMessage = textBlock && 'text' in textBlock ? textBlock.text : '';

      return {
        message: replyMessage,
        data_used: this.detectDataSources(replyMessage),
      };
    } catch (e: any) {
      this.logger.warn(`Lỗi khi gọi Claude model ${currentModel}: ${e.message || e}`);

      // Nếu lỗi quá tải (503), lỗi gateway (502) hoặc hết hạn mức (429) từ Anthropic
      if ((e.status === 503 || e.status === 429 || e.status === 502) && !fallbackModel) {
        // Hạ cấp xuống dòng model Claude 3.5 Haiku nhanh và rẻ hơn, ít nghẽn hơn
        const alternativeModel = 'claude-3-5-haiku-20241022';
        
        this.logger.log(`🔄 Đang thử lại với model Claude dự phòng: ${alternativeModel}...`);
        return this.chat(systemPrompt, history, userMessage, alternativeModel);
      }

      this.logger.error('Lỗi nghiêm trọng không thể phục hồi từ Claude API:', e);
      throw new InternalServerErrorException(
        'Hệ thống AI Advisor (Claude) hiện đang quá tải. Vui lòng thử lại sau ít phút.',
      );
    }
  }

  /**
   * Returns a streaming response for real-time chat UI (Tùy chọn nếu bạn dùng stream)
   */
  async *chatStream(
    systemPrompt: string,
    history: ChatMessage[],
    userMessage: string,
  ): AsyncGenerator<string> {
    const messages: Anthropic.MessageParam[] = [
      ...history.map((h) => ({
        role: h.role as 'user' | 'assistant',
        content: h.content,
      })),
      { role: 'user', content: userMessage },
    ];

    try {
      const stream = await this.client.messages.create({
        model: this.defaultModel,
        max_tokens: 2048,
        system: systemPrompt,
        messages,
        stream: true, // Bật chế độ streaming của SDK mới nhất
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && 'text' in event.delta) {
          yield event.delta.text;
        }
      }
    } catch (e) {
      this.logger.error('Lỗi Stream Claude:', e);
      yield 'Lỗi kết nối AI, vui lòng thử lại';
    }
  }

  // ─── Helper ────────────────────────────────────────────────────────────────

  private detectDataSources(message: string): string[] {
    const sources: string[] = [];
    if (message.includes('📊') || message.includes('dữ liệu thực tế')) {
      sources.push('internal_db');
    }
    return sources.length > 0 ? sources : ['internal_db'];
  }
}