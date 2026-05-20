import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class IngredientRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Ingredient CRUD ──────────────────────────────────────────────

  async create(data: Prisma.IngredientUncheckedCreateInput) {
    return this.prisma.ingredient.create({ data });
  }

  async findAll(tenantId: number) {
    return this.prisma.ingredient.findMany({
      where: { tenant_id: tenantId },
      orderBy: { created_at: 'desc' },
    });
  }

  async findByTenantAndId(id: number, tenantId: number) {
    return this.prisma.ingredient.findFirst({
      where: { id, tenant_id: tenantId },
      include: { ingredient_products: { include: { product: true } } },
    });
  }

  async update(id: number, data: Prisma.IngredientUpdateInput) {
    return this.prisma.ingredient.update({ where: { id }, data });
  }

  async delete(id: number) {
    return this.prisma.ingredient.delete({ where: { id } });
  }

  // ── IngredientProduct (junction) ─────────────────────────────────

  async upsertIngredientProduct(
    productId: number,
    ingredientId: number,
    quantityRequired: number,
    unit?: string,
  ) {
    return this.prisma.ingredientProduct.upsert({
      where: {
        product_id_ingredient_id: {
          product_id: productId,
          ingredient_id: ingredientId,
        },
      },
      create: {
        product_id: productId,
        ingredient_id: ingredientId,
        quantity_required: quantityRequired,
        unit,
      },
      update: { quantity_required: quantityRequired, unit },
      include: { ingredient: true },
    });
  }

  async deleteIngredientProduct(productId: number, ingredientId: number) {
    return this.prisma.ingredientProduct.delete({
      where: {
        product_id_ingredient_id: {
          product_id: productId,
          ingredient_id: ingredientId,
        },
      },
    });
  }

  async findIngredientsByProduct(productId: number) {
    return this.prisma.ingredientProduct.findMany({
      where: { product_id: productId },
      include: { ingredient: true },
    });
  }
}
