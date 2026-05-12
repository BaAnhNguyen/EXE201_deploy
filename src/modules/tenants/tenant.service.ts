import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantRepository } from './tenant.repository';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantService {
  constructor(private readonly tenantRepository: TenantRepository) {}

  async create(createTenantDto: CreateTenantDto) {
    return this.tenantRepository.create({
      ...createTenantDto,
      // Default behavior or linking could be handled here if admin_id is passed, etc.
    });
  }

  async findAll() {
    return this.tenantRepository.findAll();
  }

  async findOne(id: number) {
    const tenant = await this.tenantRepository.findById(id);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ${id} not found`);
    }
    return tenant;
  }

  async update(id: number, updateTenantDto: UpdateTenantDto) {
    await this.findOne(id);
    return this.tenantRepository.update(id, updateTenantDto);
  }

  async activate(id: number) {
    await this.findOne(id);
    return this.tenantRepository.activate(id);
  }

  async deactivate(id: number) {
    await this.findOne(id);
    return this.tenantRepository.deactivate(id);
  }
}
