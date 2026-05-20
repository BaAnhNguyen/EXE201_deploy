import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { OrderRepository } from './order.repository';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly prisma: PrismaService,
  ) {}

  // ── Helpers ──────────────────────────────────────────────────────

  private async resolveShift(shiftId: number, shopId: number) {
    const shift = await this.prisma.shift.findFirst({
      where: { id: shiftId, shop_id: shopId },
    });
    if (!shift) throw new NotFoundException(`Shift #${shiftId} not found in this shop`);
    if (shift.shift_status === 'CLOSED') {
      throw new BadRequestException('Cannot create order in a closed shift');
    }
    return shift;
  }

  private async resolveShopFromUser(tenantId: number, shopId: number) {
    const shop = await this.prisma.shop.findFirst({
      where: { id: shopId, tenant_id: tenantId },
    });
    if (!shop) throw new NotFoundException(`Shop #${shopId} not found`);
    return shop;
  }

  // ── Create order with items ──────────────────────────────────────

  async create(dto: CreateOrderDto, cashierId: number, shopId: number, tenantId: number) {
    await this.resolveShopFromUser(tenantId, shopId);
    await this.resolveShift(dto.shift_id, shopId);

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must have at least one item');
    }

    // Fetch all products and validate they belong to tenant
    const productIds = dto.items.map((i) => i.product_id);
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        category: { tenant_id: tenantId },
        is_active: true,
      },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more products not found or inactive');
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Calculate totals
    let subtotal = 0;
    const itemsData = dto.items.map((item) => {
      const product = productMap.get(item.product_id)!;
      const unitPrice = Number(product.unit_price);
      subtotal += unitPrice * item.quantity;
      return {
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: unitPrice,
      };
    });

    // Get tax percentage from tenant
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    const taxPct = Number(tenant?.tax_percentage ?? 0);
    const grandTotal = subtotal + (subtotal * taxPct) / 100;

    // Create order + items in transaction
    return this.prisma.withTransaction(async (tx) => {
      const order = await tx.orders.create({
        data: {
          shift_id: dto.shift_id,
          cashier_id: cashierId,
          customer_id: dto.customer_id,
          subtotal_amount: subtotal,
          grand_total: grandTotal,
          order_status: 'PENDING',
          notes: dto.notes,
          order_items: {
            create: itemsData,
          },
        },
        include: {
          shift: true,
          cashier: { select: { id: true, full_name: true, email: true } },
          customer: true,
          order_items: { include: { product: true } },
          payments: true,
        },
      });
      return order;
    });
  }

  // ── Read ─────────────────────────────────────────────────────────

  async findAll(shopId: number, tenantId: number) {
    await this.resolveShopFromUser(tenantId, shopId);
    return this.orderRepository.findAll(shopId);
  }

  async findOne(id: number, shopId: number, tenantId: number) {
    await this.resolveShopFromUser(tenantId, shopId);
    const order = await this.orderRepository.findByShopAndId(id, shopId);
    if (!order) throw new NotFoundException(`Order #${id} not found`);
    return order;
  }

  // ── Update status ────────────────────────────────────────────────

  async update(id: number, dto: UpdateOrderDto, shopId: number, tenantId: number) {
    await this.findOne(id, shopId, tenantId);

    const data: any = {};
    if (dto.order_status) data.order_status = dto.order_status;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.order_status === 'COMPLETED') data.completed_at = new Date();
    if (dto.order_status === 'CANCELLED') data.cancelled_at = new Date();

    return this.orderRepository.update(id, data);
  }
}
