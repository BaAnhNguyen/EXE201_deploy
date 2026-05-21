import { Injectable, NotFoundException } from '@nestjs/common';
import { ShiftRepository } from './shift.repository';
import { PrismaService } from '../../database/prisma.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ShiftService {
  constructor(private readonly repo: ShiftRepository, private readonly prisma: PrismaService) {}

  private async resolveShopFromUser(tenantId: number, shopId: number) {
    const shop = await this.prisma.shop.findFirst({ where: { id: shopId, tenant_id: tenantId } });
    if (!shop) throw new NotFoundException(`Shop #${shopId} not found`);
    return shop;
  }

  async create(dto: CreateShiftDto, tenantId: number) {
    await this.resolveShopFromUser(tenantId, dto.shop_id);
    // Verify template exists
    const template = await this.prisma.shiftTemplate.findUnique({ where: { id: dto.template_id } });
    if (!template) throw new NotFoundException(`ShiftTemplate #${dto.template_id} not found`);

    const startTime = dto.start_time ?? template.start_time;
    const endTime = dto.end_time ?? template.end_time;

    const data: Prisma.ShiftUncheckedCreateInput = {
      shop_id: dto.shop_id,
      template_id: dto.template_id,
      start_time: startTime,
      end_time: endTime,
      shift_status: dto.shift_status,
    };

    return this.repo.create(data);
  }

  async findAllByShop(shopId: number, tenantId: number) {
    await this.resolveShopFromUser(tenantId, shopId);
    return this.repo.findAllByShop(shopId);
  }

  async findOne(id: number, tenantId: number) {
    const shift = await this.repo.findById(id);
    if (!shift) throw new NotFoundException(`Shift #${id} not found`);
    // ensure shop belongs to tenant
    const shop = await this.prisma.shop.findFirst({ where: { id: shift.shop_id, tenant_id: tenantId } });
    if (!shop) throw new NotFoundException(`Shift #${id} not found`);
    return shift;
  }

  async update(id: number, dto: UpdateShiftDto, tenantId: number) {
    const shift = await this.findOne(id, tenantId);
    return this.repo.update(id, dto as any);
  }

  async remove(id: number, tenantId: number) {
    await this.findOne(id, tenantId);
    return this.repo.delete(id);
  }
}
