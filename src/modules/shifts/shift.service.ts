import { Injectable, NotFoundException } from '@nestjs/common';
import { ShiftRepository } from './shift.repository';
import { PrismaService } from '../../database/prisma.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ShiftService {
  constructor(private readonly repo: ShiftRepository, private readonly prisma: PrismaService) {}

  private formatShiftDate(value: Date | string) {
    const date = new Date(value);
    return date.toISOString().split('T')[0];
  }

  private async resolveShopFromUser(tenantId: number, shopId: number) {
    const shop = await this.prisma.shop.findFirst({ where: { id: shopId, tenant_id: tenantId } });
    if (!shop) throw new NotFoundException(`Shop #${shopId} not found`);
    return shop;
  }

  async create(dto: CreateShiftDto, tenantId: number) {
    await this.resolveShopFromUser(tenantId, dto.shop_id);
    // Verify template exists
    const template = await this.prisma.shiftTemplate.findFirst({
      where: { id: dto.template_id, tenant_id: tenantId },
    });
    if (!template) throw new NotFoundException(`ShiftTemplate #${dto.template_id} not found`);

    const data: Prisma.ShiftUncheckedCreateInput = {
      shop_id: dto.shop_id,
      template_id: dto.template_id,
      shift_date: new Date(dto.shift_date),
      cashiers: dto.cashiers,
      shift_status: dto.shift_status,
    };

    const created = await this.repo.create(data);
    return this.findOne(created.id, tenantId);
  }

  private async populateCashiers(shifts: any | any[]) {
    const isArray = Array.isArray(shifts);
    const items = isArray ? shifts : [shifts];

    // Collect all unique cashier IDs
    const cashierIds = new Set<number>();
    for (const item of items) {
      if (item.cashiers && Array.isArray(item.cashiers)) {
        for (const cid of item.cashiers) {
          cashierIds.add(cid);
        }
      }
    }

    // Fetch users securely
    const users = await this.prisma.user.findMany({
      where: { id: { in: Array.from(cashierIds) } },
      select: {
        id: true,
        full_name: true,
        phone: true,
        avatar: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const result = items.map((item) => {
      const assignedCashiers: any[] = [];
      if (item.cashiers && Array.isArray(item.cashiers)) {
        for (const cid of item.cashiers) {
          if (userMap.has(cid)) {
            assignedCashiers.push(userMap.get(cid));
          }
        }
      }

      return {
        id: item.id,
        shift_date: item.shift_date ? this.formatShiftDate(item.shift_date) : null,
        shift_status: item.shift_status,
        template: item.template ? {
          name: item.template.name,
          start_time: item.template.start_time,
          end_time: item.template.end_time,
        } : null,
        cashiers: assignedCashiers,
      };
    });

    return isArray ? result : result[0];
  }

  async findAllByShop(shopId: number, tenantId: number) {
    await this.resolveShopFromUser(tenantId, shopId);
    const shifts = await this.repo.findAllByShop(shopId);
    return this.populateCashiers(shifts);
  }

  async findOne(id: number, tenantId: number) {
    const shift = await this.repo.findById(id);
    if (!shift) throw new NotFoundException(`Shift #${id} not found`);
    // ensure shop belongs to tenant
    const shop = await this.prisma.shop.findFirst({ where: { id: shift.shop_id, tenant_id: tenantId } });
    if (!shop) throw new NotFoundException(`Shift #${id} not found`);
    return this.populateCashiers(shift);
  }

  async update(id: number, dto: UpdateShiftDto, tenantId: number) {
    await this.findOne(id, tenantId);
    const data: Prisma.ShiftUpdateInput = {
      ...(dto.shift_date ? { shift_date: new Date(dto.shift_date) } : {}),
      ...(dto.template_id ? { template_id: dto.template_id } : {}),
      ...(dto.cashiers ? { cashiers: dto.cashiers } : {}),
      ...(dto.shift_status ? { shift_status: dto.shift_status } : {}),
    };
    const updated = await this.repo.update(id, data);
    return this.findOne(updated.id, tenantId);
  }

  async remove(id: number, tenantId: number) {
    await this.findOne(id, tenantId);
    return this.repo.delete(id);
  }
}
