import { Injectable, BadRequestException } from '@nestjs/common';
import { FeatureValidationService } from '../../common/services/feature-validation.service';
import { PrismaService } from '../../database/prisma.service';
import { CreateShopDto } from './dto/create-shop.dto';

@Injectable()
export class ShopService {
  constructor(
    private readonly featureValidationService: FeatureValidationService,
    private readonly prisma: PrismaService
  ) {}

  async create(tenantId: number, createShopDto: CreateShopDto) {
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required to create a shop');
    }

    // 1. Kiểm tra kĩ: Tenant đã vượt giới hạn MAX_SHOPS từ gói Subscription chưa? 
    // Nếu vượt, hàm này sẽ ném ForbiddenException chặn luôn luồng chạy.
    await this.featureValidationService.validateShopLimit(tenantId);
    
    // 2. Nếu đi được đến đây nghĩa là hợp lệ. Bắt đầu tạo mới Shop.
    try {
      const newShop = await this.prisma.shop.create({
        data: {
          shop_name: createShopDto.shop_name,
          address: createShopDto.address,
          phone: createShopDto.phone,
          is_active: createShopDto.is_active ?? true,
          tenant_id: tenantId,
        }
      });
      return newShop;
    } catch (error) {
      throw new BadRequestException('Error while creating shop. Please check your data again.');
    }
  }
}
