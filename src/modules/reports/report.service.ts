import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ReportRepository } from './report.repository';

@Injectable()
export class ReportService {
  constructor(
    private readonly reportRepository: ReportRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getSalesReport(tenantId: number, range?: string, startDateStr?: string, endDateStr?: string, shopId?: number) {
    // 1. Generate cache key
    const cacheKey = `reports:sales:${tenantId}:${shopId || 'all'}:${range || 'custom'}:${startDateStr || ''}:${endDateStr || ''}`;

    // 2. Try to get from cache
    const cachedData = await this.cacheManager.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // 3. Parse date range
    const { startDate, endDate } = this.getDateRange(range, startDateStr, endDateStr);

    // 4. Fetch orders
    const orders = await this.reportRepository.getOrdersForReport(tenantId, startDate, endDate, shopId);

    // 5. Calculate metrics
    const completedOrders = orders.filter((o) => o.order_status === 'COMPLETED');
    const cancelledOrders = orders.filter((o) => o.order_status === 'CANCELLED');

    const totalRevenue = completedOrders.reduce((sum, o) => sum + Number(o.grand_total), 0);
    const totalOrdersCount = completedOrders.length;
    const aov = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

    // Refund/Cancel Ratio
    const totalOrdersAll = orders.length;
    const cancelRatio = totalOrdersAll > 0 ? cancelledOrders.length / totalOrdersAll : 0;

    // Estimated Profit & Top-selling Products
    let totalCOGS = 0;
    const productSalesMap = new Map<number, { name: string; quantity: number; revenue: number }>();

    const allProducts = await this.reportRepository.getAllActiveProducts(tenantId);
    for (const p of allProducts) {
      productSalesMap.set(p.id, { name: p.product_name, quantity: 0, revenue: 0 });
    }

    for (const order of completedOrders) {
      for (const item of order.order_items) {
        const qty = item.quantity;
        const basicPrice = Number(item.product.basic_price);
        const unitPrice = Number(item.unit_price);

        totalCOGS += qty * basicPrice;

        // Top-selling logic
        const prodId = item.product_id;
        const currentSales = productSalesMap.get(prodId) || { name: item.product.product_name, quantity: 0, revenue: 0 };
        currentSales.quantity += qty;
        currentSales.revenue += qty * unitPrice;
        productSalesMap.set(prodId, currentSales);
      }
    }

    const estimatedProfit = totalRevenue - totalCOGS;

    // Convert map to sorted array (Top and Bottom)
    const sortedProducts = Array.from(productSalesMap.values()).sort((a, b) => b.quantity - a.quantity);
    const topProducts = sortedProducts.slice(0, 5);
    const bottomProducts = [...sortedProducts].reverse().slice(0, 5);

    // Group daily, monthly & hourly revenue
    const dailyMap = new Map<string, number>();
    const monthlyMap = new Map<string, number>();
    const hourlyMap = new Map<string, { revenue: number; orderCount: number }>();

    for(let i=0; i<24; i++) {
      hourlyMap.set(i.toString().padStart(2, '0'), { revenue: 0, orderCount: 0 });
    }

    // For daily we also want to group all orders to fill dates correctly
    for (const order of completedOrders) {
      if (!order.created_at) continue;
      const d = new Date(order.created_at);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const dateKey = `${yyyy}-${mm}-${dd}`;
      const monthKey = `${yyyy}-${mm}`;

      const total = Number(order.grand_total);
      dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + total);
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + total);
      
      const currentHourly = hourlyMap.get(hh)!;
      currentHourly.revenue += total;
      currentHourly.orderCount += 1;
      hourlyMap.set(hh, currentHourly);
    }

    const hourlyBreakdown = Array.from(hourlyMap.entries()).map(([hour, data]) => ({
      hour: `${hour}:00`,
      revenue: data.revenue,
      orderCount: data.orderCount,
    }));

    const dailyBreakdown: Array<{ date: string; revenue: number }> = [];
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      const diffTime = end.getTime() - start.getTime();
      let totalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      if (totalDays > 60) totalDays = 60;
      
      for (let i = 0; i < totalDays; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const iso = `${yyyy}-${mm}-${dd}`;
        dailyBreakdown.push({
          date: `${dd}/${mm}`,
          revenue: dailyMap.get(iso) || 0,
        });
      }
    } else {
      // Fallback: build daily breakdown for last 7 days if no range given
      const start = new Date();
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const iso = `${yyyy}-${mm}-${dd}`;
        dailyBreakdown.push({
          date: `${dd}/${mm}`,
          revenue: dailyMap.get(iso) || 0,
        });
      }
    }

    const monthlyBreakdown: Array<{ date: string; revenue: number }> = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const key = `${yyyy}-${mm}`;
      monthlyBreakdown.push({
        date: `Th ${mm}/${yyyy.toString().slice(2)}`,
        revenue: monthlyMap.get(key) || 0,
      });
    }

    const reportResult = {
      summary: {
        totalRevenue,
        totalOrders: totalOrdersCount,
        averageOrderValue: aov,
        cancelRatio,
        estimatedProfit,
      },
      topProducts,
      bottomProducts,
      hourlyBreakdown,
      dailyBreakdown,
      monthlyBreakdown,
      metadata: {
        startDate,
        endDate,
        generatedAt: new Date(),
      },
    };

    // 6. Save to cache (TTL = 30 seconds)
    await this.cacheManager.set(cacheKey, reportResult, 30000);

    return reportResult;
  }

  private getDateRange(range?: string, startDateStr?: string, endDateStr?: string) {
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (startDateStr) {
      startDate = new Date(startDateStr);
      startDate.setHours(0, 0, 0, 0);
    }
    if (endDateStr) {
      endDate = new Date(endDateStr);
      endDate.setHours(23, 59, 59, 999);
    }

    if (!startDate && !endDate && range) {
      const now = new Date();
      if (range === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      } else if (range === 'week') {
        startDate = new Date();
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
      } else if (range === 'month') {
        startDate = new Date();
        startDate.setDate(now.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
      }
    }

    return { startDate, endDate };
  }
}
