import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { InventoryRepository } from './inventory.repository';
import { ConfigureInventoryDto } from './dto/configure-inventory.dto';
import { AddStockDto } from './dto/add-stock.dto';
import { ReduceStockDto } from './dto/reduce-stock.dto';
import { UpdateQuantitiesDto } from './dto/update-quantities.dto';

@Injectable()
export class InventoryService {
  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly prisma: PrismaService,
  ) {}

  // ── Helpers ──────────────────────────────────────────────────────

  private async resolveShop(shopId: number, tenantId: number) {
    const shop = await this.prisma.shop.findFirst({
      where: { id: shopId, tenant_id: tenantId },
    });
    if (!shop) throw new NotFoundException(`Shop #${shopId} not found`);
    return shop;
  }

  private async getOrCreateInventory(shopId: number) {
    const existing = await this.inventoryRepository.findByShopId(shopId);
    if (existing) return existing;
    // createForShop now returns the full record with includes
    const created = await this.inventoryRepository.createForShop(shopId);
    return created!;
  }

  private async getOrCreateItem(inventoryId: number, ingredientId: number) {
    const existing = await this.inventoryRepository.findItem(inventoryId, ingredientId);
    if (existing) return existing;
    return this.prisma.inventoryItem.create({
      data: { inventory_id: inventoryId, ingredient_id: ingredientId },
    });
  }

  // ── Public methods ───────────────────────────────────────────────

  async getInventory(shopId: number, tenantId: number) {
    await this.resolveShop(shopId, tenantId);
    return this.getOrCreateInventory(shopId);
  }

  async configure(shopId: number, dto: ConfigureInventoryDto, tenantId: number) {
    await this.resolveShop(shopId, tenantId);
    const inventory = await this.getOrCreateInventory(shopId);
    return this.inventoryRepository.configure(inventory.id, dto);
  }

  async addStock(shopId: number, dto: AddStockDto, tenantId: number) {
    await this.resolveShop(shopId, tenantId);
    const inventory = await this.getOrCreateInventory(shopId);

    const ingredient = await this.prisma.ingredient.findFirst({
      where: { id: dto.ingredient_id, tenant_id: tenantId },
    });
    if (!ingredient) {
      throw new NotFoundException(`Ingredient #${dto.ingredient_id} not found`);
    }

    const item = await this.getOrCreateItem(inventory.id, dto.ingredient_id);
    return this.inventoryRepository.addStock(item.id, dto.quantity);
  }

  async reduceStock(shopId: number, dto: ReduceStockDto, tenantId: number) {
    await this.resolveShop(shopId, tenantId);
    const inventory = await this.getOrCreateInventory(shopId);

    const item = await this.inventoryRepository.findItem(inventory.id, dto.ingredient_id);
    if (!item) {
      throw new NotFoundException(`No inventory item for ingredient #${dto.ingredient_id}`);
    }

    const currentQty = item.actual_quantity ?? 0;
    if (currentQty < dto.quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${currentQty}, Requested: ${dto.quantity}`,
      );
    }

    return this.inventoryRepository.reduceStock(item.id, dto.quantity);
  }

  async updateQuantities(shopId: number, dto: UpdateQuantitiesDto, tenantId: number) {
    await this.resolveShop(shopId, tenantId);
    const inventory = await this.getOrCreateInventory(shopId);
    const item = await this.getOrCreateItem(inventory.id, dto.ingredient_id);

    return this.inventoryRepository.updateQuantities(item.id, {
      theorical_quantity: dto.theorical_quantity,
      adjusted_quantity: dto.adjusted_quantity,
      actual_quantity: dto.actual_quantity,
      minimum_threshold: dto.minimum_threshold,
    });
  }

  async getStockAlerts(shopId: number, tenantId: number) {
    await this.resolveShop(shopId, tenantId);
    return this.inventoryRepository.findLowStockItems(shopId);
  }
}