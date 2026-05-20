import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

const ORDER_INCLUDE = {
  shift: true,
  cashier: { select: { id: true, full_name: true, email: true } },
  customer: true,
  order_items: { include: { product: true } },
  payments: true,
} satisfies Prisma.OrdersInclude;

@Injectable()
export class OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.OrdersUncheckedCreateInput) {
    return this.prisma.orders.create({
      data,
      include: ORDER_INCLUDE,
    });
  }

  async findAll(shopId: number) {
    return this.prisma.orders.findMany({
      where: { shift: { shop_id: shopId } },
      include: ORDER_INCLUDE,
      orderBy: { created_at: 'desc' },
    });
  }

  async findById(id: number) {
    return this.prisma.orders.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });
  }

  async findByShopAndId(id: number, shopId: number) {
    return this.prisma.orders.findFirst({
      where: { id, shift: { shop_id: shopId } },
      include: ORDER_INCLUDE,
    });
  }

  async update(id: number, data: Prisma.OrdersUpdateInput) {
    return this.prisma.orders.update({
      where: { id },
      data,
      include: ORDER_INCLUDE,
    });
  }

  async createOrderItem(data: Prisma.OrderItemUncheckedCreateInput) {
    return this.prisma.orderItem.create({
      data,
      include: { product: true },
    });
  }
}
