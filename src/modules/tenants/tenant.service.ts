import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantRepository } from './tenant.repository';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { PrismaService } from '../../database/prisma.service';
import { TenantSubscriptionInfoDto } from './dto/tenant-subscription-info.dto';

@Injectable()
export class TenantService {
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(createTenantDto: CreateTenantDto) {
    return this.tenantRepository.create({
      ...createTenantDto,
      // Default behavior or linking could be handled here if admin_id is passed, etc.
    });
  }

  async findAll() {
    return this.tenantRepository.findAll();
  }

  async findOne(id: number) {
    const tenant = await this.tenantRepository.findById(id);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ${id} not found`);
    }
    return tenant;
  }

  async update(id: number, updateTenantDto: UpdateTenantDto) {
    await this.findOne(id);
    return this.tenantRepository.update(id, updateTenantDto);
  }

  async activate(id: number) {
    await this.findOne(id);
    return this.tenantRepository.activate(id);
  }

  async deactivate(id: number) {
    await this.findOne(id);
    return this.tenantRepository.deactivate(id);
  }

  /** Gói subscription mới nhất của tenant (shop owner — JWT.tenant_id) */
  async getMySubscription(tenantId: number): Promise<TenantSubscriptionInfoDto> {
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new NotFoundException('Không tìm thấy tenant');
    }

    const sub = await this.prisma.tenantSubscription.findFirst({
      where: { tenant_id: tenantId },
      orderBy: [{ end_date: 'desc' }, { id: 'desc' }],
      include: { subscription: true },
    });

    const priceRaw = sub?.subscription.price;
    const price =
      priceRaw != null && Number.isFinite(Number(priceRaw))
        ? Number(priceRaw)
        : null;

    return {
      tenant_id: tenant.id,
      tenant_name: tenant.tenant_name,
      tenant_is_active: tenant.is_active,
      subscription_id: sub?.subscription_id ?? null,
      package_code: sub?.subscription.package_code ?? null,
      description: sub?.subscription.description ?? null,
      price,
      billing_cycle: sub?.subscription.billing_cycle ?? null,
      start_date: sub?.start_date ? sub.start_date.toISOString() : null,
      end_date: sub?.end_date ? sub.end_date.toISOString() : null,
      is_expired: sub ? sub.is_expired : true,
      number_of_renewals: sub?.number_of_renewals ?? null,
    };
  }
}
