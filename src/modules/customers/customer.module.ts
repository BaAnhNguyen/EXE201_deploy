import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { CustomerRepository } from './customer.repository';
import { PrismaService } from '../../database/prisma.service';
import { DatabaseModule } from 'src/database/database.module';
import { AuthModule } from '../auth/auth.module';
@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [CustomerController],
  providers: [CustomerService, CustomerRepository, PrismaService],
  exports: [CustomerService],
})
export class CustomerModule {}