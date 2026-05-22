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
import { ShiftTemplateService } from './shift-template.service';
import { CreateShiftTemplateDto } from './dto/create-shift-template.dto';
import { UpdateShiftTemplateDto } from './dto/update-shift-template.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminOnlyGuard } from 'src/common/guards/admin-only.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, AdminOnlyGuard)
@Controller('shift-templates')
export class ShiftTemplateController {
  constructor(private readonly service: ShiftTemplateService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  create(@Body() dto: CreateShiftTemplateDto, @Req() req: any) {
    return this.service.create(dto, req.user?.tenant_id);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.service.findAll(req.user?.tenant_id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.service.findOne(id, req.user?.tenant_id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateShiftTemplateDto,
    @Req() req: any,
  ) {
    return this.service.update(id, dto, req.user?.tenant_id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.service.remove(id, req.user?.tenant_id);
  }
}
