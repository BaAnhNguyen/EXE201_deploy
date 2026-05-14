import { Module } from '@nestjs/common';
import { ShopService } from './shop.service';
import { ShopController } from './shop.controller';
import { CommonModule } from '../../common/common.module';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [CommonModule, DatabaseModule],
  controllers: [ShopController],
  providers: [ShopService],
  exports: [ShopService]
})
export class ShopModule {}
