import { Injectable, BadRequestException } from '@nestjs/common';
import { FeatureValidationService } from '../../common/services/feature-validation.service';
import { PrismaService } from '../../database/prisma.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { ShopResponseDto } from './dto/shop-response.dto';

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

  /** Shops của tenant đang đăng nhập (JWT.tenant_id). Nếu JWT có shop_id thì trả đúng shop đó. */
  async findMine(tenantId: number, shopId?: number | null): Promise<ShopResponseDto[]> {
    const shops = shopId
      ? await this.prisma.shop.findMany({
          where: {
            tenant_id: tenantId,
            id: shopId,
            is_active: true,
          },
          take: 1,
        })
      : await this.prisma.shop.findMany({
          where: {
            tenant_id: tenantId,
            is_active: true,
          },
          orderBy: { id: 'asc' },
        });

    return shops.map((shop) => this.toShopResponse(shop));
  }

  async getQuota(tenantId: number) {
    return this.featureValidationService.getShopQuota(tenantId);
  }

  private toShopResponse(shop: {
    id: number;
    tenant_id: number;
    shop_name: string;
    address: string | null;
    phone: string | null;
    is_active: boolean;
    created_at: Date;
    update_at: Date;
  }): ShopResponseDto {
    return {
      id: shop.id,
      tenant_id: shop.tenant_id,
      shop_name: shop.shop_name,
      address: shop.address,
      phone: shop.phone,
      is_active: shop.is_active,
      created_at: shop.created_at.toISOString(),
      update_at: shop.update_at.toISOString(),
    };
  }
}
