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

  async update(id: number, tenantId: number, data: Prisma.ProductCategoryUpdateInput) {
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.productCategory.updateMany({
        where: { id, tenant_id: tenantId },
        data,
      });

      if (result.count === 0) {
        return null;
      }

      return tx.productCategory.findFirst({
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
    });
  }

  async softDelete(id: number, tenantId: number) {
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.productCategory.updateMany({
        where: { id, tenant_id: tenantId },
        data: { is_active: false },
      });

      if (result.count === 0) {
        return null;
      }

      return tx.productCategory.findFirst({
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
    });
  }
}
