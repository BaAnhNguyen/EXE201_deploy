import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ShiftTemplateController } from './shift-template.controller';
import { ShiftTemplateService } from './shift-template.service';
import { ShiftTemplateRepository } from './shift-template.repository';
import { DatabaseModule } from '../../database/database.module';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [DatabaseModule, CommonModule, JwtModule],
  controllers: [ShiftTemplateController],
  providers: [ShiftTemplateService, ShiftTemplateRepository],
  exports: [ShiftTemplateService, ShiftTemplateRepository],
})
export class ShiftTemplateModule {}
