import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from './common/common.module';
import { appConfigurations } from './config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admins/admin.module';
import { RoleModule } from './modules/roles/role.module';
import { SubscriptionModule } from './modules/subscriptions/subscription.module';

@Module({
  imports: [
    // Load .env
    ConfigModule.forRoot({
      isGlobal: true,
      load: appConfigurations,
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
    }),
    CommonModule,
    DatabaseModule,
    AuthModule,
    AdminModule,
    RoleModule,
    SubscriptionModule,
  ],
  controllers: [], // Để trống vì đã xóa AppController
  providers: [], // Để trống vì đã xóa AppService
})
export class AppModule {}
