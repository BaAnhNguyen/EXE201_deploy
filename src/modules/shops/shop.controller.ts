import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  ValidationPipe,
  UsePipes,
  BadRequestException,
} from '@nestjs/common';
import { ShopService } from './shop.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateShopDto } from './dto/create-shop.dto';

@Controller('shops')
@UseGuards(JwtAuthGuard)
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get('mine')
  async findMine(@Req() req: { user?: { tenant_id?: number; shop_id?: number } }) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required');
    }
    return this.shopService.findMine(tenantId, req.user?.shop_id ?? null);
  }

  @Get('quota')
  async getQuota(@Req() req: { user?: { tenant_id?: number } }) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required');
    }
    return this.shopService.getQuota(tenantId);
  }

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(
    @Req() req: { user?: { tenant_id?: number } },
    @Body() createShopDto: CreateShopDto,
  ) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required');
    }
    return this.shopService.create(tenantId, createShopDto);
  }
}
