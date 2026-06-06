import {
  Controller, Get, Post, Patch, Body,
  Param, ParseIntPipe, UseGuards, Req,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('shops/:shopId/orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // POST /shops/:shopId/orders
  @Post()
  @Roles('CASHIER', 'SHOPOWNER')
  create(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Body() dto: CreateOrderDto,
    @Req() req: any,
  ) {
    return this.orderService.create(dto, req.user.sub, shopId, req.user.tenant_id);
  }

  // GET /shops/:shopId/orders
  @Get()
  @Roles('CASHIER', 'SHOPOWNER')
  findAll(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Req() req: any,
  ) {
    return this.orderService.findAll(shopId, req.user.tenant_id);
  }

  // GET /shops/:shopId/orders/:id
  @Get(':id')
  @Roles('CASHIER', 'SHOPOWNER')
  findOne(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    return this.orderService.findOne(id, shopId, req.user.tenant_id);
  }

  // PATCH /shops/:shopId/orders/:id
  @Patch(':id')
  @Roles('CASHIER', 'SHOPOWNER')
  update(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderDto,
    @Req() req: any,
  ) {
    return this.orderService.update(id, dto, shopId, req.user.tenant_id);
  }

  // POST /shops/:shopId/orders/:id/checkout
  @Post(':id/checkout')
  @Roles('CASHIER', 'SHOPOWNER')
  checkout(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    return this.orderService.checkout(id, shopId, req.user.tenant_id);
  }
}
