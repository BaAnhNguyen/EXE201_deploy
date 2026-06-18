import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ReportService } from '../reports/report.service';

@Injectable()
export class ChatbotService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reportService: ReportService,
  ) {}

  async handleAsk(userId: number, tenantId: number, question: string) {
    const qLower = question.toLowerCase();

    // 1. Check if question asks about financial/reports info
    const isReportRelated = [
      'doanh thu',
      'doanh số',
      'lợi nhuận',
      'bán chạy',
      'bán chậm',
      'revenue',
      'sales',
      'profit',
      'kpi',
      'aov',
      'đơn hàng',
    ].some((keyword) => qLower.includes(keyword));

    if (isReportRelated) {
      // Load user with role to check permissions
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });

      if (!user || !user.role) {
        throw new ForbiddenException('User has no role assigned');
      }

      const permissions = (user.role.permissions as Record<string, any>) || {};
      const canViewReports = !!permissions.can_view_reports;

      if (!canViewReports) {
        return `🔒 Xin lỗi, tài khoản của bạn (vai trò: ${user.role.role_code}) không có quyền truy cập báo cáo tài chính (\`can_view_reports\`). Tôi không thể cung cấp thông tin này.`;
      }

      // User has permissions, fetch report data (last 30 days default)
      const report = (await this.reportService.getSalesReport(tenantId, 'month')) as any;

      const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
      };

      if (qLower.includes('doanh thu') || qLower.includes('doanh số') || qLower.includes('sales') || qLower.includes('revenue')) {
        return `📊 Báo cáo doanh số 30 ngày qua:\n- Tổng doanh thu: **${formatCurrency(report.summary.totalRevenue)}**\n- Số đơn hàng hoàn thành: **${report.summary.totalOrders} đơn**\n- Giá trị đơn hàng trung bình (AOV): **${formatCurrency(report.summary.averageOrderValue)}**`;
      }

      if (qLower.includes('lợi nhuận') || qLower.includes('profit')) {
        return `📈 Lợi nhuận ước tính 30 ngày qua (Doanh thu - Giá vốn):\n- Lợi nhuận: **${formatCurrency(report.summary.estimatedProfit)}**\n- Tỷ lệ hủy đơn: **${(report.summary.cancelRatio * 100).toFixed(1)}%**`;
      }

      if (qLower.includes('bán chạy') || qLower.includes('top') || qLower.includes('món')) {
        const topProductsStr = report.topProducts
          .map((p, i) => `${i + 1}. **${p.name}** (${p.quantity} cốc/phần - ${formatCurrency(p.revenue)})`)
          .join('\n');
        return `🔥 Top 5 món bán chạy nhất trong tháng:\n${topProductsStr || 'Chưa ghi nhận dữ liệu bán hàng.'}`;
      }

      if (qLower.includes('bán chậm')) {
        const bottomProductsStr = report.bottomProducts
          .map((p, i) => `${i + 1}. **${p.name}** (${p.quantity} cốc/phần - ${formatCurrency(p.revenue)})`)
          .join('\n');
        return `❄️ Top các món bán chậm nhất tháng này:\n${bottomProductsStr || 'Chưa ghi nhận dữ liệu bán hàng.'}`;
      }

      return `📊 Tôi có thể trả lời các câu hỏi về: doanh thu, lợi nhuận, món bán chạy, món bán chậm. Ví dụ: "Món nào bán chạy nhất?"`;
    }

    // 2. Fallback for general questions
    if (qLower.includes('trả hàng') || qLower.includes('hoàn tiền') || qLower.includes('return')) {
      return `🔄 Quy trình trả hàng: Vào mục Thanh toán/Hóa đơn → Tìm hóa đơn muốn hoàn → Bấm 'Hoàn tiền', chọn lý do và xác nhận.`;
    }

    if (qLower.includes('giảm giá') || qLower.includes('discount')) {
      return `💸 Cách áp dụng giảm giá: Trong màn hình POS, bấm biểu tượng (%) ở góc tóm tắt đơn hàng để nhập phần trăm hoặc số tiền giảm trực tiếp.`;
    }

    return `👋 Xin chào! Tôi là trợ lý AI thông minh Lumio. Tôi có thể hỗ trợ bạn kiểm tra doanh thu, lợi nhuận, tồn kho, món bán chạy, quy trình POS. Hãy đặt câu hỏi nhé!`;
  }
}
