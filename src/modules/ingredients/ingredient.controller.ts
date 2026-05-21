import {
  Controller, Get, Post, Body, Patch, Delete,
  Param, ParseIntPipe, UseGuards, Req,
} from '@nestjs/common';
import { IngredientService } from './ingredient.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { UpsertIngredientProductDto } from './dto/upsert-ingredient-product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SHOPOWNER')
@Controller('ingredients')
export class IngredientController {
  constructor(private readonly ingredientService: IngredientService) {}

  // ── Ingredient CRUD ──────────────────────────────────────────────

  @Post()
  create(@Body() dto: CreateIngredientDto, @Req() req: any) {
    return this.ingredientService.create(dto, req.user.tenant_id);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.ingredientService.findAll(req.user.tenant_id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.ingredientService.findOne(id, req.user.tenant_id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateIngredientDto,
    @Req() req: any,
  ) {
    return this.ingredientService.update(id, dto, req.user.tenant_id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.ingredientService.remove(id, req.user.tenant_id);
  }

  // ── IngredientProduct: recipe/BOM per product ────────────────────
  // POST   /ingredients/product/:productId     → thêm/cập nhật ingredient vào product
  // DELETE /ingredients/product/:productId/:ingredientId → xóa ingredient khỏi product
  // GET    /ingredients/product/:productId     → xem danh sách ingredients của product

  @Post('product/:productId')
  upsertIngredientProduct(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: UpsertIngredientProductDto,
    @Req() req: any,
  ) {
    return this.ingredientService.upsertIngredientProduct(productId, dto, req.user.tenant_id);
  }

  @Delete('product/:productId/:ingredientId')
  removeIngredientProduct(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('ingredientId', ParseIntPipe) ingredientId: number,
    @Req() req: any,
  ) {
    return this.ingredientService.removeIngredientProduct(productId, ingredientId, req.user.tenant_id);
  }

  @Get('product/:productId')
  findIngredientsByProduct(
    @Param('productId', ParseIntPipe) productId: number,
    @Req() req: any,
  ) {
    return this.ingredientService.findIngredientsByProduct(productId, req.user.tenant_id);
  }
}
