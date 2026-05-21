import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ShiftTemplateRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.ShiftTemplateUncheckedCreateInput) {
    return this.prisma.shiftTemplate.create({ data });
  }

  async findAll() {
    return this.prisma.shiftTemplate.findMany({ orderBy: { id: 'desc' } });
  }

  async findById(id: number) {
    return this.prisma.shiftTemplate.findUnique({ where: { id } });
  }

  async update(id: number, data: Prisma.ShiftTemplateUpdateInput) {
    return this.prisma.shiftTemplate.update({ where: { id }, data });
  }

  async delete(id: number) {
    return this.prisma.shiftTemplate.delete({ where: { id } });
  }
}
