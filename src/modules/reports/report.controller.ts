import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ReportService } from './report.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('sales')
  @Roles('SHOPOWNER')
  async getSalesReport(
    @Query('range') range?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('shopId') shopIdStr?: string,
    @Req() req?: any,
  ) {
    const tenantId = req.user.tenant_id;
    const shopId = shopIdStr ? parseInt(shopIdStr, 10) : undefined;
    return this.reportService.getSalesReport(tenantId, range, startDate, endDate, shopId);
  }
}
