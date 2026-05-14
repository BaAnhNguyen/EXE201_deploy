import { Controller, Post, Body, Req, UseGuards, ValidationPipe, UsePipes } from '@nestjs/common';
import { ShopService } from './shop.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateShopDto } from './dto/create-shop.dto';

@Controller('shops')
@UseGuards(JwtAuthGuard) // Chỉ những người có token hợp lệ mới được truy cập
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Req() req: any, @Body() createShopDto: CreateShopDto) {
    // Trích xuất ID của tenant (cửa hàng lớn / doanh nghiệp) đang đăng nhập hiện tại từ JWT payload
    const tenantId = req.user?.tenant_id;
    return this.shopService.create(tenantId, createShopDto);
  }
}
