import {
  Controller, Get, Post, Patch, Body,
  Param, ParseIntPipe, UseGuards, Req,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { ConfigureInventoryDto } from './dto/configure-inventory.dto';
import { AddStockDto } from './dto/add-stock.dto';
import { ReduceStockDto } from './dto/reduce-stock.dto';
import { UpdateQuantitiesDto } from './dto/update-quantities.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SHOPOWNER')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // GET /inventory/:shopId → xem toàn bộ inventory của shop
  @Get(':shopId')
  getInventory(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Req() req: any,
  ) {
    return this.inventoryService.getInventory(shopId, req.user.tenant_id);
  }

  // PATCH /inventory/:shopId/configure → set min_threshold, reorder_quantity
  @Patch(':shopId/configure')
  configure(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Body() dto: ConfigureInventoryDto,
    @Req() req: any,
  ) {
    return this.inventoryService.configure(shopId, dto, req.user.tenant_id);
  }

  // POST /inventory/:shopId/add-stock → nhập kho
  @Post(':shopId/add-stock')
  addStock(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Body() dto: AddStockDto,
    @Req() req: any,
  ) {
    return this.inventoryService.addStock(shopId, dto, req.user.tenant_id);
  }

  // POST /inventory/:shopId/reduce-stock → xuất kho
  @Post(':shopId/reduce-stock')
  reduceStock(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Body() dto: ReduceStockDto,
    @Req() req: any,
  ) {
    return this.inventoryService.reduceStock(shopId, dto, req.user.tenant_id);
  }

  // PATCH /inventory/:shopId/quantities → chỉnh số lượng thủ công
  @Patch(':shopId/quantities')
  updateQuantities(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Body() dto: UpdateQuantitiesDto,
    @Req() req: any,
  ) {
    return this.inventoryService.updateQuantities(shopId, dto, req.user.tenant_id);
  }

  // GET /inventory/:shopId/alerts → cảnh báo hàng sắp hết
  @Get(':shopId/alerts')
  getStockAlerts(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Req() req: any,
  ) {
    return this.inventoryService.getStockAlerts(shopId, req.user.tenant_id);
  }
}
