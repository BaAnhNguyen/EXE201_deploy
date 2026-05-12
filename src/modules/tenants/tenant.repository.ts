import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, Tenant } from '@prisma/client';

@Injectable()
export class TenantRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.TenantCreateInput): Promise<Tenant> {
    return this.prisma.tenant.create({ data });
  }

  async findAll(): Promise<Tenant[]> {
    return this.prisma.tenant.findMany();
  }

  async findById(id: number): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({ where: { id } });
  }

  async update(id: number, data: Prisma.TenantUpdateInput): Promise<Tenant> {
    return this.prisma.tenant.update({ where: { id }, data });
  }

  async activate(id: number): Promise<Tenant> {
    return this.prisma.tenant.update({
      where: { id },
      data: { is_active: true },
    });
  }

  async deactivate(id: number): Promise<Tenant> {
    return this.prisma.tenant.update({
      where: { id },
      data: { is_active: false },
    });
  }
}
