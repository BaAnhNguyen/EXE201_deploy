// === product-category.service.ts ===
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ProductCategoryRepository } from './product-category.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class ProductCategoryService {
  constructor(
    private readonly productCategoryRepository: ProductCategoryRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateCategoryDto, tenantId: number) {
    if (dto.par_category_id != null) {
      const parent = await this.productCategoryRepository.findById(dto.par_category_id, tenantId);
      if (!parent) {
        throw new NotFoundException(`Parent category #${dto.par_category_id} not found`);
      }
    }

    return this.productCategoryRepository.create({
      category_name: dto.category_name,
      par_category_id: dto.par_category_id ?? null,
      tenant_id: tenantId,
      is_active: dto.is_active ?? true,
    });
  }

  async findAll(tenantId: number) {
    return this.productCategoryRepository.findAll(tenantId);
  }

  async findOne(id: number, tenantId: number) {
    const category = await this.productCategoryRepository.findById(id, tenantId);
    if (!category) {
      throw new NotFoundException(`Product category #${id} not found`);
    }
    return category;
  }

  async update(id: number, dto: UpdateCategoryDto, tenantId: number) {
    await this.findOne(id, tenantId);

    if (dto.par_category_id != null) {
      if (dto.par_category_id === id) {
        throw new NotFoundException('Category cannot be its own parent');
      }

      const parent = await this.productCategoryRepository.findById(dto.par_category_id, tenantId);
      if (!parent) {
        throw new NotFoundException(`Parent category #${dto.par_category_id} not found`);
      }
    }

    return this.productCategoryRepository.update(id, dto);
  }

  async remove(id: number, tenantId: number) {
    await this.findOne(id, tenantId);
    return this.productCategoryRepository.softDelete(id);
  }
}
