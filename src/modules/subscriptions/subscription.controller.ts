import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminOnlyGuard } from '../../common/guards/admin-only.guard';

@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  @UseGuards(JwtAuthGuard, AdminOnlyGuard)
  create(@Body() createSubscriptionDto: CreateSubscriptionDto) {
    return this.subscriptionService.create(createSubscriptionDto);
  }

  @Get()
  findAll() {
    return this.subscriptionService.findAll();
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, AdminOnlyGuard)
  getSubscriptionStats() {
    return this.subscriptionService.getSubscriptionStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subscriptionService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminOnlyGuard)
  update(@Param('id') id: string, @Body() updateSubscriptionDto: UpdateSubscriptionDto) {
    return this.subscriptionService.update(+id, updateSubscriptionDto);
  }

  @Patch(':id/activate')
  @UseGuards(JwtAuthGuard, AdminOnlyGuard)
  activate(@Param('id') id: string) {
    return this.subscriptionService.activate(+id);
  }

  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard, AdminOnlyGuard)
  deactivate(@Param('id') id: string) {
    return this.subscriptionService.deactivate(+id);
  }
}
