import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CustomerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.CustomerUncheckedCreateInput) {
    return this.prisma.customer.create({ data });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.CustomerWhereInput;
    orderBy?: Prisma.CustomerOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;
    return this.prisma.customer.findMany({
      skip,
      take,
      where,
      orderBy,
    });
  }

  async findOne(where: Prisma.CustomerWhereUniqueInput) {
    return this.prisma.customer.findUnique({
      where,
    });
  }

  async update(params: {
    where: Prisma.CustomerWhereUniqueInput;
    data: Prisma.CustomerUpdateInput;
  }) {
    const { where, data } = params;
    return this.prisma.customer.update({
      data,
      where,
    });
  }

  async delete(where: Prisma.CustomerWhereUniqueInput) {
    return this.prisma.customer.delete({
      where,
    });
  }
}