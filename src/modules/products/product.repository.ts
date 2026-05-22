import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.ProductUncheckedCreateInput) {
    return this.prisma.product.create({
      data,
      include: { category: true },
    });
  }

  async findAll(tenantId: number) {
    return this.prisma.product.findMany({
      where: { category: { tenant_id: tenantId } },
      include: { category: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async findById(id: number) {
    return this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        ingredient_products: { include: { ingredient: true } },
      },
    });
  }

  async findByTenantAndId(id: number, tenantId: number) {
    return this.prisma.product.findFirst({
      where: { id, category: { tenant_id: tenantId } },
      include: {
        category: true,
        ingredient_products: { include: { ingredient: true } },
      },
    });
  }

  async update(id: number, data: Prisma.ProductUpdateInput) {
    return this.prisma.product.update({
      where: { id },
      data,
      include: { category: true },
    });
  }

  async activate(id: number) {
    return this.prisma.product.update({
      where: { id },
      data: { is_active: true },
    });
  }

  async deactivate(id: number) {
    return this.prisma.product.update({
      where: { id },
      data: { is_active: false },
    });
  }
}