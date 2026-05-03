import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { AdminController } from './admin.controller';
import { AdminRepository } from './admin.repository';
import { AdminService } from './admin.service';

@Module({
	imports: [DatabaseModule, AuthModule],
	controllers: [AdminController],
	providers: [AdminService, AdminRepository],
	exports: [AdminService],
})
export class AdminModule {}
