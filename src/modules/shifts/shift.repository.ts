import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ShiftRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.ShiftUncheckedCreateInput) {
    return this.prisma.shift.create({ data });
  }

  async findAllByShop(shopId: number) {
    return this.prisma.shift.findMany({ 
      where: { shop_id: shopId }, 
      orderBy: { shift_date: 'desc' },
      include: { template: true },
    });
  }

  async findById(id: number) {
    return this.prisma.shift.findUnique({ 
      where: { id },
      include: { template: true },
    });
  }

  async update(id: number, data: Prisma.ShiftUpdateInput) {
    return this.prisma.shift.update({ where: { id }, data });
  }

  async delete(id: number) {
    return this.prisma.shift.delete({ where: { id } });
  }
}
