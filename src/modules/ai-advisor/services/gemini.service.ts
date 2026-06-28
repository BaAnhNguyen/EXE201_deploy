import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GoogleGenAI,
  Content,
  Chat,
} from '@google/genai';

import { AdvisorResponse, ChatMessage } from '../types';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);

  private readonly ai: GoogleGenAI;
  private readonly modelName: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');

    if (!apiKey) {
      throw new Error('Missing GEMINI_API_KEY');
    }

    this.modelName = this.config.get<string>(
      'GEMINI_MODEL',
      'gemini-2.5-flash',
    );

    this.ai = new GoogleGenAI({
      apiKey,
    });

    this.logger.log(`Gemini model: ${this.modelName}`);
  }

  async chat(
    systemPrompt: string,
    history: ChatMessage[],
    userMessage: string,
    retries = 2,
    useFallbackModel = false, // Biến flag để đánh dấu việc chuyển đổi model dự phòng
  ): Promise<AdvisorResponse> {
    // Nếu dùng chế độ dự phòng thì chuyển sang gemini-1.5-flash, ngược lại dùng cấu hình trong .env
    const targetModel = useFallbackModel ? 'gemini-1.5-flash' : this.modelName;

    try {
      const chat: Chat = this.ai.chats.create({
        model: targetModel,
        history: this.toGeminiHistory(history),
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.4,
          maxOutputTokens: 1024,
        },
      });

      const response = await chat.sendMessage({
        message: userMessage,
      });

      return {
        message: response.text ?? '',
        data_used: this.detectDataSources(response),
      };
    } catch (e: any) {
      this.logger.warn(`Lỗi khi gọi model ${targetModel}: ${e.message || e}`);

      // Trường hợp 1: Lỗi 503 nghẽn cục bộ -> Thử lại (Retry) với khoảng nghỉ tăng dần
      if (e.status === 503 && retries > 0) {
        const delayTime = (3 - retries) * 1500; // Thử lần 1 đợi 1.5s, lần 2 đợi 3s
        this.logger.warn(`Gemini đang bận. Đang đợi ${delayTime / 1000}s để thử lại lần nữa...`);
        await new Promise((resolve) => setTimeout(resolve, delayTime));
        return this.chat(systemPrompt, history, userMessage, retries - 1, useFallbackModel);
      }

      // Trường hợp 2: Đã thử lại nhưng vẫn lỗi 503, HOẶC dính lỗi 429 (Hết hạn mức)
      // Tiến hành chuyển đổi ngay sang model dự phòng 'gemini-1.5-flash'
      if (!useFallbackModel) {
        this.logger.log(`🔄 [FALLBACK] Tự động chuyển hướng dòng máy sang model ổn định: gemini-1.5-flash...`);
        return this.chat(systemPrompt, history, userMessage, 2, true); // Reset lại 2 lần retry cho model mới
      }

      // Nếu cả model dự phòng cũng thất bại hoàn toàn
      this.logger.error('Thất bại hoàn toàn ở tất cả các tầng model của Gemini API:', e);
      throw new InternalServerErrorException(
        'Hệ thống AI Advisor hiện đang quá tải. Bạn vui lòng thử lại sau ít giây nhé!',
      );
    }
  }

  async *chatStream(
    systemPrompt: string,
    history: ChatMessage[],
    userMessage: string,
  ): AsyncGenerator<string> {
    const chat: Chat = this.ai.chats.create({
      model: this.modelName,
      history: this.toGeminiHistory(history),
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.4,
        maxOutputTokens: 2048,
      },
    });

    const stream = await chat.sendMessageStream({
      message: userMessage,
    });

    for await (const chunk of stream) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  }

  private toGeminiHistory(history: ChatMessage[]): Content[] {
    return history.map((h) => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.content }],
    }));
  }

  private detectDataSources(response: any): string[] {
    const sources = ['internal_db'];

    const candidates = response?.candidates ?? [];

    const grounded = candidates.some(
      (c: any) =>
        c.groundingMetadata?.webSearchQueries?.length,
    );

    if (grounded) {
      sources.push('web_search');
    }

    return sources;
  }
}