import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { RoleController } from './role.controller';
import { RoleRepository } from './role.repository';
import { RoleService } from './role.service';

@Module({
	imports: [DatabaseModule, AuthModule],
	controllers: [RoleController],
	providers: [RoleService, RoleRepository],
	exports: [RoleService],
})
export class RoleModule {}
