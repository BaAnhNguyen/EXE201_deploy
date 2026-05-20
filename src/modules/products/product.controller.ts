import {
  Controller, Get, Post, Body, Patch,
  Param, ParseIntPipe, UseGuards, Req,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @Roles('SHOP_OWNER')
  create(@Body() dto: CreateProductDto, @Req() req: any) {
    return this.productService.create(dto, req.user.tenant_id);
  }

  @Get()
  @Roles('SHOP_OWNER', 'CASHIER')
  findAll(@Req() req: any) {
    return this.productService.findAll(req.user.tenant_id);
  }

  @Get(':id')
  @Roles('SHOP_OWNER', 'CASHIER')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.productService.findOne(id, req.user.tenant_id);
  }

  @Patch(':id')
  @Roles('SHOP_OWNER')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
    @Req() req: any,
  ) {
    return this.productService.update(id, dto, req.user.tenant_id);
  }

  @Patch(':id/activate')
  @Roles('SHOP_OWNER')
  activate(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.productService.activate(id, req.user.tenant_id);
  }

  @Patch(':id/deactivate')
  @Roles('SHOP_OWNER')
  deactivate(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.productService.deactivate(id, req.user.tenant_id);
  }
}