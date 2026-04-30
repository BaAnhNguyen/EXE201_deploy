import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    // Load .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        `.env.${process.env.NODE_ENV}`,
        '.env',
      ],
    }),
    CommonModule
    // Sau này bạn sẽ import các module tính năng vào đây
    // Ví dụ: AuthModule, TenantModule, DatabaseModule...
  ],
  controllers: [], // Để trống vì đã xóa AppController
  providers: [], // Để trống vì đã xóa AppService
})
export class AppModule {}
