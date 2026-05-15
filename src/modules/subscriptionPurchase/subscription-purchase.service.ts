import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { InitiateSubscriptionDto } from './dto/initiate-subscription.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PayOS } from '@payos/node';

@Injectable()
export class SubscriptionPurchaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async initiatePayment(dto: InitiateSubscriptionDto) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: dto.subscription_id },
    });

    if (!subscription || !subscription.is_active) {
      throw new NotFoundException('Subscription package not found or inactive');
    }

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: dto.username }, { email: dto.email }],
      },
    });

    if (existingUser) {
      throw new ConflictException('Username or email already exists');
    }

    const existingPending = await this.prisma.pendingSubscription.findFirst({
      where: {
        OR: [{ username: dto.username }, { email: dto.email }],
        status: 'PENDING',
        expires_at: { gt: new Date() },
      },
    });

    if (existingPending) {
      throw new ConflictException('A pending payment already exists for this account. Please complete or wait for it to expire.');
    }

    const hashed_password = await bcrypt.hash(dto.password, 10);
    const payos_order_code = Date.now();
    const expires_at = new Date(Date.now() + 2 * 60 * 1000);

    const PAYOS_CLIENT_ID = this.configService.get<string>('payos.clientId');
    const PAYOS_API_KEY = this.configService.get<string>('payos.apiKey');
    const PAYOS_CHECKSUM_KEY = this.configService.get<string>('payos.checksumKey');
    
    if (!PAYOS_CLIENT_ID || !PAYOS_API_KEY || !PAYOS_CHECKSUM_KEY) {
      throw new BadRequestException('Missing PayOS configurations');
    }

    const payos = new PayOS({
      clientId: PAYOS_CLIENT_ID,
      apiKey: PAYOS_API_KEY,
      checksumKey: PAYOS_CHECKSUM_KEY
    });
    const APP_URL = this.configService.get<string>('app.url') || this.configService.get<string>('APP_URL') || process.env.APP_URL || 'http://localhost:5000';

    const amount = Math.round(Number(subscription.price));
    if (amount <= 0) {
      throw new BadRequestException('Subscription price must be greater than 0');
    }

    const paymentData = {
      orderCode: Number(payos_order_code),
      amount: amount,
      description: `Mua ${subscription.package_code}`.substring(0, 25),
      cancelUrl: `${APP_URL}/subscription/cancel`,
      returnUrl: `${APP_URL}/subscription/success`,
    };

    console.log("PAYOS REQUEST DATA:", paymentData);

    try {
      // Use transaction to ensure pending subscription is rolled back if PayOS fails
      return await this.prisma.$transaction(async (tx) => {
        await tx.pendingSubscription.create({
          data: {
            subscription_id: dto.subscription_id,
            username: dto.username,
            email: dto.email,
            password: hashed_password,
            tenant_name: dto.tenant_name,
            payos_order_code: payos_order_code.toString(),
            expires_at,
            status: 'PENDING',
          },
        });

        // Use official PayOS SDK to generate payment link
        const checkoutResponse = await payos.paymentRequests.create(paymentData);
        return { checkoutUrl: checkoutResponse.checkoutUrl, orderCode: payos_order_code.toString() };
      });
    } catch (error: any) {
      console.error('PayOS error:', error);
      throw new BadRequestException(error.message || 'Failed to create payment link');
    }
  }

  async handlePayOSWebhook(body: any) {
     console.log("=== PAYOS WEBHOOK RECEIVED ===");
     
     const PAYOS_CLIENT_ID = this.configService.get<string>('payos.clientId');
     const PAYOS_API_KEY = this.configService.get<string>('payos.apiKey');
     const PAYOS_CHECKSUM_KEY = this.configService.get<string>('payos.checksumKey');

     if (!PAYOS_CLIENT_ID || !PAYOS_API_KEY || !PAYOS_CHECKSUM_KEY) {
       return { success: false, reason: 'Missing PayOS configurations' };
     }

     const payos = new PayOS({
       clientId: PAYOS_CLIENT_ID,
       apiKey: PAYOS_API_KEY,
       checksumKey: PAYOS_CHECKSUM_KEY
     });

     let webhookData;
     try {
       // 1. Verify webhook signature USING OFFICIAL SDK
       webhookData = await payos.webhooks.verify(body);
     } catch (error) {
       console.error("Signature verification failed:", error);
       return { success: false, reason: 'Invalid signature' };
     }

    const { orderCode, code } = webhookData;
    console.log(`Processing OrderCode: ${orderCode}, Code: ${code}`);
    
    const pending = await this.prisma.pendingSubscription.findUnique({
      where: { payos_order_code: orderCode.toString() },
      include: { subscription: true }
    });

    if (!pending) {
      return { success: false };
    }

    if (pending.status !== 'PENDING') {
      return { success: true };
    }

    if (pending.expires_at < new Date()) {
      await this.prisma.pendingSubscription.update({
        where: { id: pending.id },
        data: { status: 'EXPIRED' },
      });
      return { success: false, reason: 'expired' };
    }

    if (code !== '00') {
      await this.prisma.pendingSubscription.update({
        where: { id: pending.id },
        data: { status: 'CANCELLED' },
      });
      return { success: false };
    }

    try {
        await this.prisma.$transaction(async (tx) => {
          const tenant = await tx.tenant.create({
            data: {
              tenant_name: pending.tenant_name,
            },
          });
          
          let role = await tx.role.findFirst({where: { role_code: 'SHOPOWNER'}});
          if(!role) {
            role = await tx.role.create({
                data: {
                    role_code: 'SHOPOWNER',
                    description: 'Owner of the tenant'
                }
            })
          }

          const user = await tx.user.create({
            data: {
              username: pending.username,
              email: pending.email,
              password: pending.password,
              tenant_id: tenant.id,
              role_id: role.id,
            },
          });

          const current_period_end = this.calculateEndDate(pending.subscription.billing_cycle);

          const tenantSubscription = await tx.tenantSubscription.create({
            data: {
              tenant_id: tenant.id,
              subscription_id: pending.subscription_id,
              start_date: new Date(),
              end_date: current_period_end,
              is_expired: false
            },
          });

          await tx.subscriptionPayment.create({
            data: {
              sub_tenant_id: tenantSubscription.id,
              method: 'PAYOS',
              amount: pending.subscription.price,
              payment_status: 'PAID'
            }
          });

          await tx.pendingSubscription.update({
            where: { id: pending.id },
            data: { status: 'PAID' },
          });
        });
        
        return { success: true };
    } catch (error) {
        console.error('Transaction failed:', error);
         await this.prisma.pendingSubscription.update({
            where: { id: pending.id },
            data: { status: 'FAILED' },
          });
        return { success: false, reason: 'internal error' };
    }
  }

  calculateEndDate(billing_cycle: string): Date {
    const end = new Date();
    if (billing_cycle === 'MONTHLY') {
      end.setDate(end.getDate() + 30);
    } else if (billing_cycle === 'YEARLY') {
      end.setDate(end.getDate() + 365);
    } else {
      end.setDate(end.getDate() + 30);
    }
    return end;
  }

  async cleanupExpiredPending() {
    // 1. Chuyển các giao dịch PENDING đã hết hạn thành EXPIRED
    await this.prisma.pendingSubscription.updateMany({
      where: { status: 'PENDING', expires_at: { lt: new Date() } },
      data: { status: 'EXPIRED' },
    });

    // 2. Xóa các giao dịch EXPIRED đã quá 1 ngày (24 giờ)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await this.prisma.pendingSubscription.deleteMany({
      where: { 
        status: 'EXPIRED',
        expires_at: { lt: oneDayAgo }
      },
    });
  }

  async cleanupExpiredTenants() {
    const expiredTenants = await this.prisma.tenant.findMany({
      where: {
        tenant_subscriptions: {
          some: { is_expired: true }, 
          every: {
            is_expired: true
          },
        },
      },
      select: { id: true },
    });

    if (expiredTenants.length > 0) {
      const tenantIds = expiredTenants.map(t => t.id);

      await this.prisma.tenant.deleteMany({
        where: { id: { in: tenantIds } },
      });

      console.log(`Cleaned up ${expiredTenants.length} expired tenants and their information.`);
    }
  }

  async checkStatus(orderCode: string) {
    const pending = await this.prisma.pendingSubscription.findUnique({
      where: { payos_order_code: orderCode },
      select: { status: true },
    });
    if (!pending) throw new NotFoundException();
    return { status: pending.status };
  }

  async updateExpiredSubscriptions() {
    const result = await this.prisma.tenantSubscription.updateMany({
      where: {
        end_date: { lt: new Date() },
        is_expired: false,
      },
      data: {
        is_expired: true,
      },
    });
    console.log(`Updated ${result.count} expired subscriptions.`);
    return result;
  }

  // Thêm vào subscription-purchase.service.ts
async confirmWebhook() {
  const PAYOS_CLIENT_ID = this.configService.get<string>('payos.clientId');
  const PAYOS_API_KEY = this.configService.get<string>('payos.apiKey');
  const PAYOS_CHECKSUM_KEY = this.configService.get<string>('payos.checksumKey');

  const payos = new PayOS({
    clientId: PAYOS_CLIENT_ID,
    apiKey: PAYOS_API_KEY,
    checksumKey: PAYOS_CHECKSUM_KEY,
  });

  const APP_URL = this.configService.get<string>('app.url') || process.env.APP_URL;
  const result = await payos.webhooks.confirm(`${APP_URL}/api/subscriptions/purchase/webhook`);
  console.log('Webhook confirmed:', result);
  return result;
}

}
