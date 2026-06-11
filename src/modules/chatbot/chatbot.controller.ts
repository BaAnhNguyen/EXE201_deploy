import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ChatbotService } from './chatbot.service';

@UseGuards(JwtAuthGuard)
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('ask')
  async ask(
    @Body('question') question: string,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    const tenantId = req.user.tenant_id;
    return {
      reply: await this.chatbotService.handleAsk(userId, tenantId, question),
    };
  }
}
