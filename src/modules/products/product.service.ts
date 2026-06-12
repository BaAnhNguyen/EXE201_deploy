import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ProductRepository } from './product.repository';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateProductDto, tenantId: number) {
    // Verify category belongs to tenant
    const category = await this.prisma.productCategory.findFirst({
      where: { id: dto.category_id, tenant_id: tenantId },
    });
    if (!category) {
      throw new NotFoundException('Category not found or does not belong to tenant');
    }

    // Check sku unique
    const existing = await this.prisma.product.findUnique({ where: { sku: dto.sku } });
    if (existing) {
      throw new ConflictException(`SKU "${dto.sku}" already exists`);
    }

    return this.productRepository.create({
      ...dto,
      is_active: dto.is_active ?? true,
    });
  }

  async findAll(tenantId: number, shopId?: number) {
    return this.productRepository.findAll(tenantId, shopId);
  }

  async findOne(id: number, tenantId: number, shopId?: number) {
    const product = await this.productRepository.findByTenantAndId(id, tenantId, shopId);
    if (!product) {
      throw new NotFoundException(`Product #${id} not found`);
    }
    return product;
  }

  async update(id: number, dto: UpdateProductDto, tenantId: number) {
    await this.findOne(id, tenantId);

    // If sku is being updated, check uniqueness
    if (dto.sku) {
      const existing = await this.prisma.product.findUnique({ where: { sku: dto.sku } });
      if (existing && existing.id !== id) {
        throw new ConflictException(`SKU "${dto.sku}" already exists`);
      }
    }

    return this.productRepository.update(id, dto);
  }

  async activate(id: number, tenantId: number) {
    await this.findOne(id, tenantId);
    return this.productRepository.activate(id);
  }

  async deactivate(id: number, tenantId: number) {
    await this.findOne(id, tenantId);
    return this.productRepository.deactivate(id);
  }
}