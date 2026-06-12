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

  async findAll(tenantId: number, shopId?: number) {
    const products = await this.prisma.product.findMany({
      where: { category: { tenant_id: tenantId } },
      include: {
        category: true,
        ingredient_products: true,
      },
      orderBy: { created_at: 'desc' },
    });

    if (!shopId) return products.map((p) => ({ ...p, is_out_of_stock: false }));

    const inventory = await this.prisma.inventory.findUnique({
      where: { shop_id: shopId },
      include: { inventory_items: true },
    });

    if (!inventory) return products.map((p) => ({ ...p, is_out_of_stock: false }));

    const inventoryMap = new Map(inventory.inventory_items.map((i) => [i.ingredient_id, i]));

    return products.map((p) => {
      let maxSellable = p.ingredient_products.length > 0 ? Number.MAX_SAFE_INTEGER : 9999;

      for (const ip of p.ingredient_products) {
        const invItem = inventoryMap.get(ip.ingredient_id);
        const qty = invItem?.theorical_quantity || 0;
        const threshold = invItem?.minimum_threshold || 0;
        const available = qty - threshold;
        const reqQty = Number(ip.quantity_required);

        if (reqQty > 0) {
          const maxWithThisIngredient = Math.max(0, Math.floor(available / reqQty));
          if (maxWithThisIngredient < maxSellable) {
            maxSellable = maxWithThisIngredient;
          }
        }
      }

      const isOutOfStock = maxSellable <= 0;
      return { ...p, is_out_of_stock: isOutOfStock, max_sellable_quantity: maxSellable };
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

  async findByTenantAndId(id: number, tenantId: number, shopId?: number) {
    const product = await this.prisma.product.findFirst({
      where: { id, category: { tenant_id: tenantId } },
      include: {
        category: true,
        ingredient_products: { include: { ingredient: true } },
      },
    });

    if (!product || !shopId) return product ? { ...product, is_out_of_stock: false } : null;

    const inventory = await this.prisma.inventory.findUnique({
      where: { shop_id: shopId },
      include: { inventory_items: true },
    });

    let isOutOfStock = false;
    if (inventory) {
      const inventoryMap = new Map(inventory.inventory_items.map((i) => [i.ingredient_id, i]));
      for (const ip of product.ingredient_products) {
        const invItem = inventoryMap.get(ip.ingredient_id);
        const qty = invItem?.theorical_quantity || 0;
        const threshold = invItem?.minimum_threshold || 0;
        if (qty <= threshold) {
          isOutOfStock = true;
          break;
        }
      }
    }
    
    return { ...product, is_out_of_stock: isOutOfStock };
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