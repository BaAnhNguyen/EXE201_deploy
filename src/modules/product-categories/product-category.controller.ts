// === product-category.controller.ts ===
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseIntPipe,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ProductCategoryService } from './product-category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('product-categories')
export class ProductCategoryController {
  constructor(private readonly productCategoryService: ProductCategoryService) {}

  @Post()
  @Roles('SHOPOWNER')
  create(@Body() dto: CreateCategoryDto, @Req() req: any) {
    return this.productCategoryService.create(dto, req.user.tenant_id);
  }

  @Get()
  @Roles('SHOPOWNER', 'CASHIER')
  findAll(@Req() req: any) {
    return this.productCategoryService.findAll(req.user.tenant_id);
  }

  @Get(':id')
  @Roles('SHOPOWNER', 'CASHIER')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.productCategoryService.findOne(id, req.user.tenant_id);
  }

  @Patch(':id')
  @Roles('SHOPOWNER')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
    @Req() req: any,
  ) {
    return this.productCategoryService.update(id, dto, req.user.tenant_id);
  }

  @Delete(':id')
  @Roles('SHOPOWNER')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.productCategoryService.remove(id, req.user.tenant_id);
  }
}
