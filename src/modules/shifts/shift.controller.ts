import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ShiftService } from './shift.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SHOPOWNER')
@Controller('shifts')
export class ShiftController {
  constructor(private readonly service: ShiftService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  create(@Body() dto: CreateShiftDto, @Req() req: any) {
    return this.service.create(dto, req.user?.tenant_id);
  }

  @Get('shop/:shopId')
  findAllByShop(@Param('shopId', ParseIntPipe) shopId: number, @Req() req: any) {
    return this.service.findAllByShop(shopId, req.user?.tenant_id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateShiftDto,
    @Req() req: any,
  ) {
    return this.service.update(id, dto, req.user?.tenant_id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.service.remove(id, req.user?.tenant_id);
  }
}
