// === product-category.module.ts ===
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ProductCategoryController } from './product-category.controller';
import { ProductCategoryService } from './product-category.service';
import { ProductCategoryRepository } from './product-category.repository';
import { DatabaseModule } from '../../database/database.module';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [DatabaseModule, CommonModule, JwtModule],
  controllers: [ProductCategoryController],
  providers: [ProductCategoryService, ProductCategoryRepository],
  exports: [ProductCategoryService, ProductCategoryRepository],
})
export class ProductCategoryModule {}
