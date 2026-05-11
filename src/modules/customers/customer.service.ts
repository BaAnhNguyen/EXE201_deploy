import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CustomerRepository } from './customer.repository';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomerService {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async create(createCustomerDto: CreateCustomerDto, defaultTenantId: number = 1) {
    const tenant_id = createCustomerDto.tenant_id || defaultTenantId;
    try {
      return await this.customerRepository.create({
        ...createCustomerDto,
        tenant_id,
      });
    } catch (error) {
      if (error.code === 'P2003' && error.meta?.constraint === 'customers_tenant_id_fkey') {
        throw new BadRequestException(`Tenant with ID ${tenant_id} does not exist. Please create a tenant first.`);
      }
      throw error;
    }
  }

  async findAll() {
    return this.customerRepository.findAll({});
  }

  async findOne(id: number) {
    const customer = await this.customerRepository.findOne({ id });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }
    return customer;
  }

  async update(id: number, updateCustomerDto: UpdateCustomerDto) {
    await this.findOne(id);
    return this.customerRepository.update({
      where: { id },
      data: updateCustomerDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.customerRepository.delete({ id });
  }
}