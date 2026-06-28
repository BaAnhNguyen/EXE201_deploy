import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ShiftController } from './shift.controller';
import { ShiftService } from './shift.service';
import { ShiftRepository } from './shift.repository';
import { DatabaseModule } from '../../database/database.module';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [DatabaseModule, CommonModule, JwtModule],
  controllers: [ShiftController],
  providers: [ShiftService, ShiftRepository],
  exports: [ShiftService, ShiftRepository],
})
export class ShiftModule {}
