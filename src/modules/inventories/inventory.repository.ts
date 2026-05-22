import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class InventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Inventory (per shop) ─────────────────────────────────────────

  async findByShopId(shopId: number) {
    return this.prisma.inventory.findUnique({
      where: { shop_id: shopId },
      include: {
        inventory_items: {
          include: { ingredient: true },
        },
      },
    });
  }

  async createForShop(shopId: number) {
    await this.prisma.inventory.create({
      data: { shop_id: shopId },
    });
    // Always return with full includes to keep type consistent
    return this.prisma.inventory.findUnique({
      where: { shop_id: shopId },
      include: {
        inventory_items: {
          include: { ingredient: true },
        },
      },
    });
  }

  async configure(inventoryId: number, data: Prisma.InventoryUpdateInput) {
    return this.prisma.inventory.update({
      where: { id: inventoryId },
      data,
    });
  }

  // ── InventoryItem ────────────────────────────────────────────────

  async findItem(inventoryId: number, ingredientId: number) {
    return this.prisma.inventoryItem.findFirst({
      where: { inventory_id: inventoryId, ingredient_id: ingredientId },
    });
  }

  async addStock(itemId: number, quantity: number) {
    return this.prisma.inventoryItem.update({
      where: { id: itemId },
      data: {
        theorical_quantity: { increment: quantity },
        actual_quantity: { increment: quantity },
      },
      include: { ingredient: true },
    });
  }

  async reduceStock(itemId: number, quantity: number) {
    return this.prisma.inventoryItem.update({
      where: { id: itemId },
      data: {
        theorical_quantity: { decrement: quantity },
        actual_quantity: { decrement: quantity },
      },
      include: { ingredient: true },
    });
  }

  async updateQuantities(
    itemId: number,
    data: {
      theorical_quantity?: number;
      adjusted_quantity?: number;
      actual_quantity?: number;
    },
  ) {
    return this.prisma.inventoryItem.update({
      where: { id: itemId },
      data,
      include: { ingredient: true },
    });
  }

  // ── Stock alerts ─────────────────────────────────────────────────

  async findLowStockItems(shopId: number) {
    const inventory = await this.prisma.inventory.findUnique({
      where: { shop_id: shopId },
    });
    if (!inventory || inventory.minimum_threshold === null) return [];

    return this.prisma.inventoryItem.findMany({
      where: {
        inventory_id: inventory.id,
        actual_quantity: { lte: inventory.minimum_threshold },
      },
      include: { ingredient: true },
    });
  }
}