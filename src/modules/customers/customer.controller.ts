import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

import { Req } from '@nestjs/common';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SHOPOWNER', 'CASHIER', 'INVENTORY_STAFF')
@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  create(@Body() createCustomerDto: CreateCustomerDto, @Req() req: any) {
    return this.customerService.create(createCustomerDto, req.user?.tenant_id);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.customerService.findAll(req.user?.tenant_id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.customerService.findOne(id, req.user?.tenant_id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateCustomerDto: UpdateCustomerDto, @Req() req: any) {
    return this.customerService.update(id, updateCustomerDto, req.user?.tenant_id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.customerService.remove(id, req.user?.tenant_id);
  }
}