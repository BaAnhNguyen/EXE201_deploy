import { Injectable } from '@nestjs/common';
import { BusinessContext } from '../types';

@Injectable()
export class ContextBuilderService {
  /**
   * Tối ưu hóa hệ thống Prompt - Giảm Token để tránh lỗi 503 Quá tải
   */
  buildSystemPrompt(ctx: BusinessContext): string {
    const shopLabel = ctx.shop_id ? `Shop ID #${ctx.shop_id}` : 'Tất cả chi nhánh';

    // Chỉ lấy Top 5 sản phẩm, rút gọn thuộc tính
    const topProductsText = ctx.top_products?.slice(0, 5).map(p => 
      `  • ${p.product_name}: ${p.total_quantity} món`
    ).join('\n') || '  (Chưa có dữ liệu)';

    // Chỉ lấy 3 tuần gần nhất
    const weeklyTrendsText = ctx.weekly_trends?.slice(-3).map(w =>
      `  • Tuần ${w.week_start}: ${this.formatVND(w.total_revenue)}`
    ).join('\n') || '  (Chưa có dữ liệu)';

    // Phân rã phương thức thanh toán ngắn gọn
    const paymentText = ctx.payment_methods?.map(p =>
      `  • ${p.payment_method}: ${p.share_percent}%`
    ).join('\n') || '  (Chưa có dữ liệu)';

    return `
Bạn là AI cố vấn kinh doanh F&B cho Tenant #${ctx.tenant_id} (${shopLabel}).
Nhiệm vụ: Phân tích nhanh số liệu cốt lõi và phản hồi ngắn gọn (dưới 4 câu nếu hỏi thông thường).

📊 SỐ LIỆU KINH DOANH:
- Tổng doanh thu: ${this.formatVND(ctx.revenue_stats.total_revenue)} (${ctx.revenue_stats.total_orders} đơn)
- Đơn hoàn thành: ${ctx.revenue_stats.completed_orders} | Hủy: ${ctx.revenue_stats.cancelled_orders}
- Giá trị đơn TB: ${this.formatVND(ctx.revenue_stats.avg_order_value)}

🔥 TOP SẢN PHẨM BÁN CHẠY:
${topProductsText}

💳 PHƯƠNG THỨC THANH TOÁN:
${paymentText}

📈 XU HƯỚNG DOANH THU:
${weeklyTrendsText}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Yêu cầu: Không lặp lại toàn bộ số liệu, tập trung đề xuất trực tiếp, thực tế. Trả lời bằng tiếng Việt.
`.trim();
  }

  private formatVND(value: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  }
}