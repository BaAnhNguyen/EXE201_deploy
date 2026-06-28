import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { InitiateSubscriptionDto } from './dto/initiate-subscription.dto';
import * as bcrypt from 'bcrypt';
import { PayOS } from '@payos/node';

const PURCHASE_TYPE_NEW = 'NEW';
const PURCHASE_TYPE_RENEW = 'RENEW';
/** Thời gian giữ PENDING trước khi cron đánh EXPIRED (dev/test: 2 phút) */
const PENDING_RECORD_TTL_MS = 2 * 60 * 1000;

@Injectable()
export class SubscriptionPurchaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) { }

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

    const existingPendingList = await this.prisma.pendingSubscription.findMany({
      where: {
        OR: [{ username: dto.username }, { email: dto.email }],
        status: 'PENDING',
      },
    });

    if (existingPendingList.length > 0) {
      await this.prisma.pendingSubscription.updateMany({
        where: {
          id: { in: existingPendingList.map((p) => p.id) },
        },
        data: { status: 'CANCELLED' },
      });
    }

    const isTrial = subscription.package_code === 'TRIAL_7_DAYS';
    const paymentMethod = isTrial ? 'TRIAL' : (dto.payment_method === 'CASH' ? 'CASH' : 'PAYOS');
    const hashed_password = await bcrypt.hash(dto.password, 10);
    const payos_order_code = Date.now();
    const expires_at = (paymentMethod === 'CASH' || paymentMethod === 'TRIAL') ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : new Date(Date.now() + PENDING_RECORD_TTL_MS);
    const payos = this.createPayOSClient();
    const APP_URL = this.getAppUrl();

    const amount = Math.round(Number(subscription.price));
    if (!isTrial && amount <= 0) {
      throw new BadRequestException('Subscription price must be greater than 0');
    }

    const paymentData = {
      orderCode: Number(payos_order_code),
      amount: amount,
      description: `Mua ${subscription.package_code}`.substring(0, 25),
      cancelUrl: `${APP_URL}/subscription/cancel`,
      returnUrl: `${APP_URL}/subscription/success`,
    };

    console.log('PAYOS REQUEST DATA:', paymentData);

    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.pendingSubscription.create({
          data: {
            subscription_id: dto.subscription_id,
            purchase_type: PURCHASE_TYPE_NEW,
            username: dto.username,
            email: dto.email,
            password: hashed_password,
            tenant_name: dto.tenant_name,
            payos_order_code: payos_order_code.toString(),
            payment_method: paymentMethod,
            expires_at,
            status: 'PENDING',
          },
        });

        if (paymentMethod === 'CASH' || paymentMethod === 'TRIAL') {
          return { orderCode: payos_order_code.toString(), isCash: paymentMethod === 'CASH', isTrial: paymentMethod === 'TRIAL', status: 'PENDING' };
        }

        const checkoutResponse = await payos.paymentRequests.create(paymentData);
        return {
          ...checkoutResponse,
          checkoutUrl: checkoutResponse.checkoutUrl,
          orderCode: payos_order_code.toString(),
        };
      });
    } catch (error: any) {
      console.error('PayOS error:', error);
      throw new BadRequestException(error.message || 'Failed to create payment link');
    }
  }

  async initiateRenewPayment(
    userId: number,
    tenantId: number | null | undefined,
    subscriptionId: number,
    paymentMethodInput?: string,
  ) {
    const paymentMethod = paymentMethodInput === 'CASH' ? 'CASH' : 'PAYOS';
    if (!tenantId) {
      throw new BadRequestException('Tài khoản chưa gắn tenant, không thể gia hạn');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true },
    });

    if (!user || user.tenant_id !== tenantId) {
      throw new ForbiddenException('Không có quyền gia hạn tenant này');
    }

    const tenant = user.tenant;
    if (!tenant || !tenant.is_active) {
      throw new NotFoundException('Tenant not found or inactive');
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription || !subscription.is_active) {
      throw new NotFoundException('Subscription package not found or inactive');
    }

    const existingPendingList = await this.prisma.pendingSubscription.findMany({
      where: {
        tenant_id: tenantId,
        purchase_type: PURCHASE_TYPE_RENEW,
        status: 'PENDING',
      },
    });

    if (existingPendingList.length > 0) {
      await this.prisma.pendingSubscription.updateMany({
        where: { id: { in: existingPendingList.map(p => p.id) } },
        data: { status: 'CANCELLED' },
      });
    }

    const hashed_password = await bcrypt.hash(`RENEW:${tenantId}:${Date.now()}`, 10);
    const payos_order_code = Date.now();
    const expires_at = paymentMethod === 'CASH' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : new Date(Date.now() + PENDING_RECORD_TTL_MS);
    const payos = this.createPayOSClient();
    const APP_URL = this.getAppUrl();

    const amount = Math.round(Number(subscription.price));
    if (amount <= 0) {
      throw new BadRequestException('Subscription price must be greater than 0');
    }

    const paymentData = {
      orderCode: Number(payos_order_code),
      amount: amount,
      description: `Gia han ${subscription.package_code}`.substring(0, 25),
      cancelUrl: `${APP_URL}/subscription/cancel?renew=1`,
      returnUrl: `${APP_URL}/subscription/success?renew=1`,
    };

    console.log('PAYOS RENEW REQUEST:', paymentData);

    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.pendingSubscription.create({
          data: {
            subscription_id: subscriptionId,
            purchase_type: PURCHASE_TYPE_RENEW,
            tenant_id: tenantId,
            username: user.username,
            email: user.email,
            password: hashed_password,
            tenant_name: tenant.tenant_name,
            payos_order_code: payos_order_code.toString(),
            payment_method: paymentMethod,
            expires_at,
            status: 'PENDING',
          },
        });

        if (paymentMethod === 'CASH') {
          return { orderCode: payos_order_code.toString(), isCash: true, status: 'PENDING' };
        }

        const checkoutResponse = await payos.paymentRequests.create(paymentData);
        return {
          ...checkoutResponse,
          checkoutUrl: checkoutResponse.checkoutUrl,
          orderCode: payos_order_code.toString(),
        };
      });
    } catch (error: any) {
      console.error('PayOS renew error:', error);
      throw new BadRequestException(error.message || 'Failed to create payment link');
    }
  }

  async handlePayOSWebhook(body: any) {
    console.log('=== PAYOS WEBHOOK RECEIVED ===');

    const payos = this.createPayOSClient();

    let webhookData;
    try {
      webhookData = await payos.webhooks.verify(body);
    } catch (error) {
      console.error('Signature verification failed:', error);
      return { success: false, reason: 'Invalid signature' };
    }

    const { orderCode, code } = webhookData;
    console.log(`Processing OrderCode: ${orderCode}, Code: ${code}`);

    if (code !== '00') {
      const pending = await this.prisma.pendingSubscription.findUnique({
        where: { payos_order_code: orderCode.toString() },
      });
      if (pending?.status === 'PENDING') {
        await this.prisma.pendingSubscription.update({
          where: { id: pending.id },
          data: { status: 'CANCELLED' },
        });
      }
      return { success: false };
    }

    return this.fulfillPendingPayment(orderCode.toString());
  }

  /**
   * Đồng bộ khi user quay về returnUrl (status=PAID) — bù webhook khi dev localhost
   * hoặc webhook chậm / sai URL.
   */
  async confirmPaymentFromReturn(orderCode: string) {
    const pending = await this.prisma.pendingSubscription.findUnique({
      where: { payos_order_code: orderCode },
    });

    if (!pending) {
      throw new NotFoundException('Order not found');
    }

    if (pending.status === 'PAID') {
      return { success: true, status: 'PAID', purchase_type: pending.purchase_type };
    }

    const payos = this.createPayOSClient();
    let paymentLink;
    try {
      paymentLink = await payos.paymentRequests.get(Number(orderCode));
    } catch (error) {
      console.error('PayOS get payment failed:', error);
      throw new BadRequestException('Không xác minh được trạng thái thanh toán PayOS');
    }

    if (paymentLink.status !== 'PAID') {
      return {
        success: false,
        status: pending.status,
        payos_status: paymentLink.status,
        message: 'PayOS chưa ghi nhận thanh toán PAID',
      };
    }

    return this.fulfillPendingPayment(orderCode);
  }

  /**
   * Lấy danh sách yêu cầu thanh toán tiền mặt (cho Admin)
   */
  async getPendingCashRequests() {
    return this.prisma.pendingSubscription.findMany({
      where: {
        payment_method: 'CASH',
        status: 'PENDING',
      },
      include: {
        subscription: true,
        tenant: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * API dành cho Admin duyệt các đơn hàng Tiền mặt (CASH)
   */
  async confirmCashPayment(orderCode: string) {
    const pending = await this.prisma.pendingSubscription.findUnique({
      where: { payos_order_code: orderCode },
    });

    if (!pending) {
      throw new NotFoundException('Không tìm thấy giao dịch này');
    }

    if (pending.status !== 'PENDING') {
      throw new BadRequestException(`Giao dịch này đang ở trạng thái ${pending.status}`);
    }

    if (pending.payment_method !== 'CASH') {
      throw new BadRequestException('Chỉ có thể duyệt tay cho đơn hàng thanh toán bằng tiền mặt');
    }

    const result = await this.fulfillPendingPayment(orderCode);
    return { ...result, message: 'Đã duyệt thanh toán tiền mặt thành công' };
  }

  /**
   * Lấy danh sách yêu cầu dùng thử (cho Admin)
   */
  async getPendingTrialRequests() {
    return this.prisma.pendingSubscription.findMany({
      where: {
        payment_method: 'TRIAL',
        status: 'PENDING',
      },
      include: {
        subscription: true,
        tenant: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * API dành cho Admin duyệt các đơn hàng dùng thử (TRIAL)
   */
  async confirmTrialPayment(orderCode: string) {
    const pending = await this.prisma.pendingSubscription.findUnique({
      where: { payos_order_code: orderCode },
    });

    if (!pending) {
      throw new NotFoundException('Không tìm thấy yêu cầu này');
    }

    if (pending.status !== 'PENDING') {
      throw new BadRequestException(`Yêu cầu này đang ở trạng thái ${pending.status}`);
    }

    if (pending.payment_method !== 'TRIAL') {
      throw new BadRequestException('Chỉ có thể duyệt tay cho yêu cầu dùng thử');
    }

    const result = await this.fulfillPendingPayment(orderCode);
    return { ...result, message: 'Đã duyệt yêu cầu dùng thử thành công' };
  }

  private async fulfillPendingPayment(orderCode: string) {
    const pending = await this.prisma.pendingSubscription.findUnique({
      where: { payos_order_code: orderCode },
      include: { subscription: true },
    });

    if (!pending) {
      return { success: false, reason: 'not_found' };
    }

    if (pending.status === 'PAID') {
      return { success: true, status: 'PAID', purchase_type: pending.purchase_type };
    }

    if (pending.status !== 'PENDING' && pending.status !== 'EXPIRED') {
      return { success: false, status: pending.status, reason: 'invalid_status' };
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        if (pending.purchase_type === PURCHASE_TYPE_RENEW) {
          await this.processRenewPayment(tx, pending);
        } else {
          await this.processNewSignupPayment(tx, pending);
        }
      });

      return { success: true, status: 'PAID', purchase_type: pending.purchase_type };
    } catch (error) {
      console.error('Fulfill payment failed:', error);
      await this.prisma.pendingSubscription.update({
        where: { id: pending.id },
        data: { status: 'FAILED' },
      });
      return { success: false, reason: 'internal error' };
    }
  }

  private async processNewSignupPayment(
    tx: Prisma.TransactionClient,
    pending: Prisma.PendingSubscriptionGetPayload<{ include: { subscription: true } }>,
  ) {
    const tenant = await tx.tenant.create({
      data: {
        tenant_name: pending.tenant_name,
      },
    });

    let role = await tx.role.findFirst({ where: { role_code: 'SHOPOWNER' } });
    if (!role) {
      role = await tx.role.create({
        data: {
          role_code: 'SHOPOWNER',
          description: 'Owner of the tenant',
        },
      });
    }

    await tx.user.create({
      data: {
        username: pending.username,
        email: pending.email,
        password: pending.password,
        tenant_id: tenant.id,
        role_id: role.id,
      },
    });

    const current_period_end = this.calculateEndDateFromNow(pending.subscription.billing_cycle);

    const tenantSubscription = await tx.tenantSubscription.create({
      data: {
        tenant_id: tenant.id,
        subscription_id: pending.subscription_id,
        start_date: new Date(),
        end_date: current_period_end,
        is_expired: false,
      },
    });

    await tx.subscriptionPayment.create({
      data: {
        sub_tenant_id: tenantSubscription.id,
        method: 'PAYOS',
        amount: pending.subscription.price,
        payment_status: 'PAID',
      },
    });

    await tx.pendingSubscription.update({
      where: { id: pending.id },
      data: { status: 'PAID' },
    });
  }

  private async processRenewPayment(
    tx: Prisma.TransactionClient,
    pending: Prisma.PendingSubscriptionGetPayload<{ include: { subscription: true } }>,
  ) {
    const tenantId = pending.tenant_id;
    if (!tenantId) {
      throw new BadRequestException('Renew payment missing tenant_id');
    }

    const tenant = await tx.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException('Tenant not found for renewal');
    }

    const billingCycle = this.normalizeBillingCycle(pending.subscription.billing_cycle);

    const current = await tx.tenantSubscription.findFirst({
      where: { tenant_id: tenantId },
      orderBy: { end_date: 'desc' },
    });

    const baseDate = this.getExtensionBaseDate(current?.end_date ?? null);
    const newEndDate = this.addBillingPeriod(baseDate, billingCycle);

    let tenantSubscription;
    if (current) {
      tenantSubscription = await tx.tenantSubscription.update({
        where: { id: current.id },
        data: {
          subscription_id: pending.subscription_id,
          end_date: newEndDate,
          is_expired: false,
          number_of_renewals: { increment: 1 },
        },
      });
    } else {
      tenantSubscription = await tx.tenantSubscription.create({
        data: {
          tenant_id: tenantId,
          subscription_id: pending.subscription_id,
          start_date: new Date(),
          end_date: newEndDate,
          is_expired: false,
          number_of_renewals: 0,
        },
      });
    }

    await tx.subscriptionPayment.create({
      data: {
        sub_tenant_id: tenantSubscription.id,
        method: 'PAYOS',
        amount: pending.subscription.price,
        payment_status: 'PAID',
      },
    });

    await tx.pendingSubscription.update({
      where: { id: pending.id },
      data: { status: 'PAID' },
    });
  }

  private normalizeBillingCycle(cycle: string): 'MONTHLY' | 'YEARLY' | 'TRIAL' {
    const c = cycle.trim().toUpperCase();
    if (c === 'MONTHLY' || c === 'MONTH') return 'MONTHLY';
    if (c === 'YEARLY' || c === 'YEAR' || c === 'ANNUAL') return 'YEARLY';
    if (c === 'TRIAL' || c === '7_DAYS') return 'TRIAL';
    return 'MONTHLY';
  }

  private getExtensionBaseDate(currentEndDate: Date | null): Date {
    const now = new Date();
    if (!currentEndDate) return now;
    return currentEndDate.getTime() > now.getTime() ? currentEndDate : now;
  }

  private addBillingPeriod(baseDate: Date, billingCycle: 'MONTHLY' | 'YEARLY' | 'TRIAL'): Date {
    const end = new Date(baseDate);
    if (billingCycle === 'YEARLY') {
      end.setDate(end.getDate() + 365);
    } else if (billingCycle === 'TRIAL') {
      end.setDate(end.getDate() + 7);
    } else {
      end.setDate(end.getDate() + 30);
    }
    return end;
  }

  calculateEndDateFromNow(billing_cycle: string): Date {
    return this.addBillingPeriod(new Date(), this.normalizeBillingCycle(billing_cycle));
  }

  /** @deprecated use calculateEndDateFromNow */
  calculateEndDate(billing_cycle: string): Date {
    return this.calculateEndDateFromNow(billing_cycle);
  }

  private createPayOSClient(): PayOS {
    const PAYOS_CLIENT_ID = this.configService.get<string>('payos.clientId');
    const PAYOS_API_KEY = this.configService.get<string>('payos.apiKey');
    const PAYOS_CHECKSUM_KEY = this.configService.get<string>('payos.checksumKey');

    if (!PAYOS_CLIENT_ID || !PAYOS_API_KEY || !PAYOS_CHECKSUM_KEY) {
      throw new BadRequestException('Missing PayOS configurations');
    }

    return new PayOS({
      clientId: PAYOS_CLIENT_ID,
      apiKey: PAYOS_API_KEY,
      checksumKey: PAYOS_CHECKSUM_KEY,
    });
  }

  private getAppUrl(): string {
    return (
      this.configService.get<string>('app.url') ||
      this.configService.get<string>('APP_URL') ||
      process.env.APP_URL ||
      'http://localhost:5000'
    );
  }

  async cleanupExpiredPending() {
    await this.prisma.pendingSubscription.updateMany({
      where: { status: 'PENDING', expires_at: { lt: new Date() } },
      data: { status: 'EXPIRED' },
    });

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await this.prisma.pendingSubscription.deleteMany({
      where: {
        status: 'EXPIRED',
        expires_at: { lt: oneDayAgo },
      },
    });
  }

  async cleanupExpiredTenants() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const expiredTenants = await this.prisma.tenant.findMany({
      where: {
        tenant_subscriptions: {
          some: {},
          every: {
            end_date: {
              lt: sevenDaysAgo,
            },
          },
        },
      },
      select: { id: true },
    });

    if (expiredTenants.length > 0) {
      const tenantIds = expiredTenants.map((t) => t.id);

      await this.prisma.tenant.deleteMany({
        where: { id: { in: tenantIds } },
      });

      console.log(`Cleaned up ${expiredTenants.length} expired tenants and their information.`);
    }
  }

  async checkStatus(orderCode: string) {
    const pending = await this.prisma.pendingSubscription.findUnique({
      where: { payos_order_code: orderCode },
      select: { status: true, purchase_type: true },
    });
    if (!pending) throw new NotFoundException();
    return { status: pending.status, purchase_type: pending.purchase_type };
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

  async confirmWebhook() {
    const payos = this.createPayOSClient();
    const webhookUrl = this.getPayOSWebhookUrl();
    const result = await payos.webhooks.confirm(webhookUrl);
    console.log('Webhook confirmed at:', webhookUrl, result);
    return { webhookUrl, result };
  }

  private getPayOSWebhookUrl(): string {
    return (
      this.configService.get<string>('payos.webhookUrl') ||
      `http://localhost:${this.configService.get<number>('app.port') ?? 3000}/subscriptions/purchase/webhook`
    );
  }

  async seedTrialPackage() {
    const maxShopsFeature = await this.prisma.feature.upsert({
      where: { feature_code: 'MAX_SHOPS' },
      update: {
        description: 'Maximum number of shops a tenant can create',
        is_active: true,
      },
      create: {
        feature_code: 'MAX_SHOPS',
        description: 'Maximum number of shops a tenant can create',
        is_active: true,
      },
    });

    const trialPackage = await this.prisma.subscription.upsert({
      where: { package_code: 'TRIAL_7_DAYS' },
      update: { price: 0, billing_cycle: 'TRIAL', is_active: true },
      create: {
        package_code: 'TRIAL_7_DAYS',
        description: 'Gói dùng thử 7 ngày',
        price: 0,
        billing_cycle: 'TRIAL',
        is_active: true,
      },
    });

    await this.prisma.subscriptionFeature.upsert({
      where: {
        subscription_id_feature_id: {
          subscription_id: trialPackage.id,
          feature_id: maxShopsFeature.id,
        },
      },
      update: { limit_value: 1 },
      create: {
        subscription_id: trialPackage.id,
        feature_id: maxShopsFeature.id,
        limit_value: 1,
      },
    });

    return { success: true, message: 'TRIAL_7_DAYS package seeded' };
  }
}
