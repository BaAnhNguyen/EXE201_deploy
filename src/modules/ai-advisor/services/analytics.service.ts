import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service'; 
import {
  BusinessContext,
  RevenueStats,
  TopProduct,
  CategoryBreakdown,
  ShiftPerformance,
  InventoryAlert,
  PaymentMethodBreakdown,
  WeeklyTrend,
  MonthlyTrend,
} from '../types';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async buildBusinessContext(
    tenant_id: number,
    shop_id?: number,
    period_days = 30,
  ): Promise<BusinessContext> {
    const since = new Date();
    since.setDate(since.getDate() - period_days);

    const [
      revenue_stats,
      top_products,
      category_breakdown,
      shift_performance,
      inventory_alerts,
      payment_methods,
      weekly_trends,
      monthly_trends,
      customer_stats,
    ] = await Promise.all([
      this.getRevenueStats(tenant_id, shop_id, since, period_days),
      this.getTopProducts(tenant_id, shop_id, since),
      this.getCategoryBreakdown(tenant_id, shop_id, since),
      this.getShiftPerformance(tenant_id, shop_id, since),
      this.getInventoryAlerts(tenant_id, shop_id),
      this.getPaymentMethods(tenant_id, shop_id, since),
      this.getWeeklyTrends(tenant_id, shop_id),
      this.getMonthlyTrends(tenant_id, shop_id),
      this.getCustomerStats(tenant_id),
    ]);

    return {
      tenant_id,
      shop_id,
      revenue_stats,
      top_products,
      category_breakdown,
      shift_performance,
      inventory_alerts,
      payment_methods,
      weekly_trends,
      monthly_trends,
      customer_stats,
    };
  }

  // ─── TỔNG QUAN DOANH THU (TỪ ORDERS) ─────────────────────────────────────────

  private async getRevenueStats(
    tenant_id: number,
    shop_id: number | undefined,
    since: Date,
    period_days: number,
  ): Promise<RevenueStats> {
    const shopFilter = shop_id ? `AND s.id = ${shop_id}` : '';

    const result = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT
        COALESCE(SUM(o.grand_total), 0)::float           AS total_revenue,
        COUNT(o.id)::int                                  AS total_orders,
        COALESCE(AVG(o.grand_total), 0)::float           AS avg_order_value,
        COUNT(CASE WHEN o.order_status = 'COMPLETED' THEN 1 END)::int AS completed_orders,
        COUNT(CASE WHEN o.order_status = 'CANCELLED' THEN 1 END)::int AS cancelled_orders
      FROM orders o
      LEFT JOIN shifts sh ON sh.id = o.shift_id
      LEFT JOIN shops s   ON s.id = sh.shop_id
      WHERE (s.tenant_id = ${tenant_id} OR s.tenant_id IS NULL)
        ${shopFilter}
        AND o.created_at >= '${since.toISOString()}'::timestamp  -- Ép kiểu chuỗi ISO sang Timestamp an toàn
        AND o.order_status = 'COMPLETED'
    `);

    const row = result[0] ?? {};
    return {
      total_revenue: Number(row.total_revenue ?? 0),
      total_orders: Number(row.total_orders ?? 0),
      avg_order_value: Number(row.avg_order_value ?? 0),
      completed_orders: Number(row.completed_orders ?? 0),
      cancelled_orders: Number(row.cancelled_orders ?? 0),
      period: `${period_days} ngày gần nhất`,
    };
  }

  // ─── TOP SẢN PHẨM BÁN CHẠY ─────────────────────────────────────────────────

  private async getTopProducts(
  tenant_id: number,
  shop_id: number | undefined,
  since: Date,
): Promise<TopProduct[]> {
  const shopFilter = shop_id ? `AND s.id = ${shop_id}` : '';

  const rows = await this.prisma.$queryRawUnsafe<any[]>(`
    SELECT
      p.id AS product_id,
      p.product_name AS product_name,
      c.category_name AS category_name,
      SUM(oi.quantity)::int AS total_quantity,
      SUM(oi.quantity * oi.unit_price)::float AS total_revenue, -- Thay thế oi.sub_total bằng công thức nhân nhân số lượng với đơn giá
      ROW_NUMBER() OVER (ORDER BY SUM(oi.quantity) DESC)::int AS rank
    FROM order_items oi
    JOIN orders o               ON o.id = oi.order_id
    JOIN products p             ON p.id = oi.product_id
    LEFT JOIN product_categories c ON c.id = p.category_id
    LEFT JOIN shifts sh         ON sh.id = o.shift_id
    LEFT JOIN shops s           ON s.id = sh.shop_id
    WHERE (s.tenant_id = ${tenant_id} OR s.tenant_id IS NULL)
      ${shopFilter}
      AND o.created_at >= '${since.toISOString()}'::timestamp
    GROUP BY p.id, p.product_name, c.category_name
    ORDER BY total_quantity DESC
    LIMIT 5
  `);

  return rows;
}

  // ─── PHÂN TÍCH DOANH THU THEO DANH MỤC ──────────────────────────────────────

  private async getCategoryBreakdown(
    tenant_id: number,
    shop_id: number | undefined,
    since: Date,
  ): Promise<CategoryBreakdown[]> {
    const shopFilter = shop_id ? `AND s.id = ${shop_id}` : '';

    const rows = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT
        COALESCE(c.category_name, 'Chưa phân loại') AS category_name,
        SUM(oi.quantity * oi.unit_price)::float           AS total_revenue, -- Thay thế oi.sub_total tại đây nữa nhé
        SUM(oi.quantity)::int              AS total_quantity,
        COUNT(DISTINCT o.id)::int          AS order_count
      FROM order_items oi
      JOIN orders o               ON o.id = oi.order_id
      JOIN products p             ON p.id = oi.product_id
      LEFT JOIN product_categories c ON c.id = p.category_id
      LEFT JOIN shifts sh         ON sh.id = o.shift_id
      LEFT JOIN shops s           ON s.id = sh.shop_id
      WHERE (s.tenant_id = ${tenant_id} OR s.tenant_id IS NULL)
        ${shopFilter}
        AND o.created_at >= '${since.toISOString()}'::timestamp
      GROUP BY c.category_name
    `);

    const grandTotal = rows.reduce((sum, r) => sum + r.total_revenue, 0);

    return rows.map((r) => ({
      category_name: r.category_name,
      total_revenue: r.total_revenue,
      total_quantity: r.total_quantity,
      order_count: r.order_count,
      revenue_share_percent: grandTotal > 0 ? Number(((r.total_revenue / grandTotal) * 100).toFixed(2)) : 0,
    }));
  }

  // ─── HIỆU SUẤT THEO CA ───────────────────────────────────────────────────

  private async getShiftPerformance(
    tenant_id: number,
    shop_id: number | undefined,
    since: Date,
  ): Promise<ShiftPerformance[]> {
    const shopFilter = shop_id ? `AND s.id = ${shop_id}` : '';

    const rows = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT
        st.name                              AS shift_name,
        st.start_time,
        st.end_time,
        COUNT(o.id)::int                     AS total_orders,
        COALESCE(SUM(o.grand_total), 0)::float AS total_revenue,
        COALESCE(AVG(o.grand_total), 0)::float AS avg_order_value
      FROM orders o
      JOIN shifts sh         ON sh.id = o.shift_id
      JOIN shift_templates st ON st.id = sh.template_id
      JOIN shops s           ON s.id = sh.shop_id
      WHERE s.tenant_id = ${tenant_id}
        ${shopFilter}
        AND o.created_at >= '${since.toISOString()}'
        AND o.order_status = 'COMPLETED'
      GROUP BY st.name, st.start_time, st.end_time
      ORDER BY total_revenue DESC
    `);

    return rows.map((r) => ({
      shift_name: r.shift_name,
      start_time: r.start_time,
      end_time: r.end_time,
      total_orders: Number(r.total_orders),
      total_revenue: Number(r.total_revenue),
      avg_order_value: Number(r.avg_order_value),
    }));
  }

  // ─── CẢNH BÁO KHO KHÔNG ĐỔI ────────────────────────────────────────────────

  private async getInventoryAlerts(
    tenant_id: number,
    shop_id: number | undefined,
  ): Promise<InventoryAlert[]> {
    const shopFilter = shop_id ? `AND s.id = ${shop_id}` : '';

    const rows = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT
        ing.name                           AS ingredient_name,
        ing.unit,
        ii.actual_quantity,
        ii.minimum_threshold,
        s.shop_name,
        CASE
          WHEN ii.actual_quantity = 0 THEN 'CRITICAL'
          WHEN ii.actual_quantity <= ii.minimum_threshold THEN 'LOW'
          ELSE 'OK'
        END                                AS status
      FROM inventory_items ii
      JOIN inventories inv ON inv.id = ii.inventory_id
      JOIN shops s         ON s.id = inv.shop_id
      JOIN ingredients ing ON ing.id = ii.ingredient_id
      WHERE s.tenant_id = ${tenant_id}
        ${shopFilter}
        AND ii.actual_quantity <= ii.minimum_threshold * 1.2
      ORDER BY
        CASE WHEN ii.actual_quantity = 0 THEN 0
             WHEN ii.actual_quantity <= ii.minimum_threshold THEN 1
             ELSE 2 END,
        ii.actual_quantity ASC
    `);

    return rows.map((r) => ({
      ingredient_name: r.ingredient_name,
      unit: r.unit ?? '',
      actual_quantity: Number(r.actual_quantity),
      minimum_threshold: Number(r.minimum_threshold),
      shop_name: r.shop_name,
      status: r.status as 'CRITICAL' | 'LOW' | 'OK',
    }));
  }

  // ─── PHƯƠNG THỨC THANH TOÁN ────────────────────────────────────────────────

  private async getPaymentMethods(
    tenant_id: number,
    shop_id: number | undefined,
    since: Date,
  ): Promise<PaymentMethodBreakdown[]> {
    const shopFilter = shop_id ? `AND s.id = ${shop_id}` : '';

    const rows = await this.prisma.$queryRawUnsafe<any[]>(`
      WITH totals AS (
        SELECT SUM(o.grand_total)::float AS grand_total
        FROM orders o
        JOIN shifts sh ON sh.id = o.shift_id
        JOIN shops s   ON s.id = sh.shop_id
        WHERE s.tenant_id = ${tenant_id}
          ${shopFilter}
          AND o.created_at >= '${since.toISOString()}'
          AND o.order_status = 'COMPLETED'
      )
      SELECT
        p.payment_method,
        SUM(o.grand_total)::float AS total_amount,
        COUNT(DISTINCT o.id)::int AS transaction_count,
        ROUND(
            (
                SUM(o.grand_total)
                / NULLIF((SELECT grand_total FROM totals), 0)
                * 100
            )::numeric,
            2
        )::float AS share_percent
      FROM payments p
      JOIN orders o  ON o.id = p.order_id
      JOIN shifts sh ON sh.id = o.shift_id
      JOIN shops s   ON s.id = sh.shop_id
      WHERE s.tenant_id = ${tenant_id}
        ${shopFilter}
        AND o.created_at >= '${since.toISOString()}'
        AND o.order_status = 'COMPLETED'
        AND p.payment_status = 'PAID'
      GROUP BY p.payment_method
      ORDER BY total_amount DESC
    `);

    return rows.map((r) => ({
      payment_method: r.payment_method || 'CASH', 
      total_amount: Number(r.total_amount),
      transaction_count: Number(r.transaction_count),
      share_percent: Number(r.share_percent),
    }));
  }

  // ─── XU HƯỚNG DOANH THU HÀNG TUẦN (TỪ ORDERS) ───────────────────────────────

  // ─── XU HƯỚNG DOANH THU HÀNG TUẦN (TỪ ORDERS) ───────────────────────────────

  private async getWeeklyTrends(
    tenant_id: number,
    shop_id: number | undefined,
  ): Promise<WeeklyTrend[]> {
    const shopFilter = shop_id ? `AND s.id = ${shop_id}` : '';
    const since = new Date();
    since.setDate(since.getDate() - 28); // Giảm xuống 4 tuần gần nhất để bớt nặng prompt

    const rows = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT
        DATE_TRUNC('week', o.created_at)::date::text         AS week_start,
        (DATE_TRUNC('week', o.created_at) + INTERVAL '6 days')::date::text AS week_end,
        COALESCE(SUM(o.grand_total), 0)::float               AS total_revenue,
        COUNT(o.id)::int                                      AS total_orders,
        COALESCE(AVG(o.grand_total), 0)::float               AS avg_order_value
      FROM orders o
      LEFT JOIN shifts sh ON sh.id = o.shift_id
      LEFT JOIN shops s   ON s.id = sh.shop_id
      WHERE (s.tenant_id = ${tenant_id} OR s.tenant_id IS NULL)
        ${shopFilter}
        AND o.created_at >= '${since.toISOString()}'::timestamp  -- Ép kiểu tường minh tránh treo DB
        AND o.order_status = 'COMPLETED'
      GROUP BY DATE_TRUNC('week', o.created_at)
      ORDER BY week_start ASC
    `);

    return rows.map((r) => ({
      week_start: r.week_start,
      week_end: r.week_end,
      total_revenue: Number(r.total_revenue),
      total_orders: Number(r.total_orders),
      avg_order_value: Number(r.avg_order_value),
    }));
  }

  // ─── XU HƯỚNG DOANH THU HÀNG THÁNG (TỪ ORDERS) ──────────────────────────────

  private async getMonthlyTrends(
    tenant_id: number,
    shop_id: number | undefined,
  ): Promise<MonthlyTrend[]> {
    const shopFilter = shop_id ? `AND s.id = ${shop_id}` : '';
    const since = new Date();
    since.setMonth(since.getMonth() - 3); // Giảm xuống 3 tháng gần nhất để tối ưu hóa token

    const rows = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT
        TO_CHAR(o.created_at, 'Mon')   AS month,
        EXTRACT(YEAR FROM o.created_at)::int AS year,
        COALESCE(SUM(o.grand_total), 0)::float  AS total_revenue,
        COUNT(o.id)::int                        AS total_orders,
        COALESCE(AVG(o.grand_total), 0)::float  AS avg_order_value
      FROM orders o
      LEFT JOIN shifts sh ON sh.id = o.shift_id
      LEFT JOIN shops s   ON s.id = sh.shop_id
      WHERE (s.tenant_id = ${tenant_id} OR s.tenant_id IS NULL)
        ${shopFilter}
        AND o.created_at >= '${since.toISOString()}'::timestamp  -- Ép kiểu tường minh tránh treo DB
        AND o.order_status = 'COMPLETED'
      GROUP BY TO_CHAR(o.created_at, 'Mon'), EXTRACT(YEAR FROM o.created_at), DATE_TRUNC('month', o.created_at)
      ORDER BY DATE_TRUNC('month', o.created_at) ASC
    `);

    return rows.map((r) => ({
      month: r.month,
      year: Number(r.year),
      total_revenue: Number(r.total_revenue),
      total_orders: Number(r.total_orders),
      avg_order_value: Number(r.avg_order_value),
    }));
  }

  // ─── THỐNG KÊ KHÁCH HÀNG ───────────────────────────────────────────────────

  private async getCustomerStats(tenant_id: number) {
    const rows = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT
        COUNT(*)::int                          AS total_customers,
        COUNT(CASE WHEN loyalty_point > 0 THEN 1 END)::int AS returning_customers,
        COALESCE(AVG(loyalty_point), 0)::float AS avg_loyalty_points
      FROM customers
      WHERE tenant_id = ${tenant_id}
    `);

    const r = rows[0] ?? {};
    return {
      total_customers: Number(r.total_customers ?? 0),
      returning_customers: Number(r.returning_customers ?? 0),
      avg_loyalty_points: Number(r.avg_loyalty_points ?? 0),
    };
  }
}