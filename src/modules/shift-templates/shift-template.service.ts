import { Injectable, NotFoundException } from '@nestjs/common';
import { ShiftTemplateRepository } from './shift-template.repository';
import { PrismaService } from '../../database/prisma.service';
import { CreateShiftTemplateDto } from './dto/create-shift-template.dto';
import { UpdateShiftTemplateDto } from './dto/update-shift-template.dto';

@Injectable()
export class ShiftTemplateService {
  constructor(
    private readonly repo: ShiftTemplateRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateShiftTemplateDto, tenantId: number) {
    return this.repo.create({ ...dto, is_active: dto.is_active ?? true });
  }

  async findAll(tenantId: number) {
    return this.repo.findAll();
  }

  async findOne(id: number, tenantId: number) {
    const item = await this.repo.findById(id);
    if (!item) throw new NotFoundException(`ShiftTemplate #${id} not found`);
    return item;
  }

  async update(id: number, dto: UpdateShiftTemplateDto, tenantId: number) {
    await this.findOne(id, tenantId);
    return this.repo.update(id, dto as any);
  }

  async remove(id: number, tenantId: number) {
    await this.findOne(id, tenantId);
    return this.repo.delete(id);
  }
}
