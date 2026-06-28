import { registerAs } from '@nestjs/config';

export default registerAs('payos', () => ({
  clientId: process.env.PAYOS_CLIENT_ID,
  apiKey: process.env.PAYOS_API_KEY,
  checksumKey: process.env.PAYOS_CHECKSUM_KEY,
  /** URL công khai Nest nhận webhook PayOS (không có prefix /api) */
  webhookUrl:
    process.env.PAYOS_WEBHOOK_URL ||
    `${process.env.BACKEND_PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`}/subscriptions/purchase/webhook`,
}));
