import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { IngredientRepository } from './ingredient.repository';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { UpsertIngredientProductDto } from './dto/upsert-ingredient-product.dto';

@Injectable()
export class IngredientService {
  constructor(
    private readonly ingredientRepository: IngredientRepository,
    private readonly prisma: PrismaService,
  ) {}

  // ── Ingredient CRUD ──────────────────────────────────────────────

  async create(dto: CreateIngredientDto, tenantId: number) {
    return this.ingredientRepository.create({
      ...dto,
      tenant_id: tenantId,
      is_active: dto.is_active ?? true,
    });
  }

  async findAll(tenantId: number) {
    return this.ingredientRepository.findAll(tenantId);
  }

  async findOne(id: number, tenantId: number) {
    const ingredient = await this.ingredientRepository.findByTenantAndId(id, tenantId);
    if (!ingredient) {
      throw new NotFoundException(`Ingredient #${id} not found`);
    }
    return ingredient;
  }

  async update(id: number, dto: UpdateIngredientDto, tenantId: number) {
    await this.findOne(id, tenantId);
    return this.ingredientRepository.update(id, dto);
  }

  async remove(id: number, tenantId: number) {
    await this.findOne(id, tenantId);
    return this.ingredientRepository.delete(id);
  }

  // ── IngredientProduct (recipe/BOM per product) ───────────────────

  async upsertIngredientProduct(
    productId: number,
    dto: UpsertIngredientProductDto,
    tenantId: number,
  ) {
    // Verify product belongs to tenant
    const product = await this.prisma.product.findFirst({
      where: { id: productId, category: { tenant_id: tenantId } },
    });
    if (!product) {
      throw new NotFoundException(`Product #${productId} not found`);
    }

    // Verify ingredient belongs to tenant
    const ingredient = await this.ingredientRepository.findByTenantAndId(dto.ingredient_id, tenantId);
    if (!ingredient) {
      throw new NotFoundException(`Ingredient #${dto.ingredient_id} not found`);
    }

    return this.ingredientRepository.upsertIngredientProduct(
      productId,
      dto.ingredient_id,
      dto.quantity_required,
      dto.unit,
    );
  }

  async removeIngredientProduct(productId: number, ingredientId: number, tenantId: number) {
    // Verify product belongs to tenant
    const product = await this.prisma.product.findFirst({
      where: { id: productId, category: { tenant_id: tenantId } },
    });
    if (!product) {
      throw new NotFoundException(`Product #${productId} not found`);
    }

    return this.ingredientRepository.deleteIngredientProduct(productId, ingredientId);
  }

  async findIngredientsByProduct(productId: number, tenantId: number) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, category: { tenant_id: tenantId } },
    });
    if (!product) {
      throw new NotFoundException(`Product #${productId} not found`);
    }

    return this.ingredientRepository.findIngredientsByProduct(productId);
  }
}
