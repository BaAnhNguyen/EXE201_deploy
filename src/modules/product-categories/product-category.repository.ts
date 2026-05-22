// === product-category.repository.ts ===
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ProductCategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.ProductCategoryUncheckedCreateInput) {
    return this.prisma.productCategory.create({
      data,
      include: {
        parent: true,
        children: {
          include: {
            children: true,
            parent: true,
          },
        },
      },
    });
  }

  async findAll(tenantId: number) {
    return this.prisma.productCategory.findMany({
      where: {
        tenant_id: tenantId,
        par_category_id: null,
      },
      include: {
        parent: true,
        children: {
          include: {
            children: true,
            parent: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });
  }

  async findById(id: number, tenantId: number) {
    return this.prisma.productCategory.findFirst({
      where: { id, tenant_id: tenantId },
      include: {
        parent: true,
        children: {
          include: {
            children: true,
            parent: true,
          },
        },
      },
    });
  }

  async update(id: number, data: Prisma.ProductCategoryUpdateInput) {
    return this.prisma.productCategory.update({
      where: { id },
      data,
      include: {
        parent: true,
        children: {
          include: {
            children: true,
            parent: true,
          },
        },
      },
    });
  }

  async softDelete(id: number) {
    return this.prisma.productCategory.update({
      where: { id },
      data: { is_active: false },
      include: {
        parent: true,
        children: {
          include: {
            children: true,
            parent: true,
          },
        },
      },
    });
  }
}
