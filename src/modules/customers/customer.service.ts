import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CustomerRepository } from './customer.repository';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomerService {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async create(createCustomerDto: CreateCustomerDto, tenantId: number) {
    const tenant_id = createCustomerDto.tenant_id || tenantId;
    try {
      return await this.customerRepository.create({
        ...createCustomerDto,
        tenant_id,
      });
    } catch (error: any) {
      if (error.code === 'P2003' && error.meta?.constraint === 'customers_tenant_id_fkey') {
        throw new BadRequestException(`Tenant with ID ${tenant_id} does not exist. Please create a tenant first.`);
      }
      throw error;
    }
  }

  async findAll(tenantId: number) {
    return this.customerRepository.findAll({
      where: { tenant_id: tenantId },
    });
  }

  async findOne(id: number, tenantId: number) {
    const customer = await this.customerRepository.findOne({ id });
    if (!customer || customer.tenant_id !== tenantId) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }
    return customer;
  }

  async update(id: number, updateCustomerDto: UpdateCustomerDto, tenantId: number) {
    await this.findOne(id, tenantId);
    return this.customerRepository.update({
      where: { id },
      data: updateCustomerDto,
    });
  }

  async remove(id: number, tenantId: number) {
    await this.findOne(id, tenantId);
    return this.customerRepository.delete({ id });
  }
}