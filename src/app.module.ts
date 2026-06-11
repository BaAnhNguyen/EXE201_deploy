import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from './common/common.module';
import { appConfigurations } from './config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admins/admin.module';
import { RoleModule } from './modules/roles/role.module';
import { SubscriptionModule } from './modules/subscriptions/subscription.module';
import { CustomerModule } from './modules/customers/customer.module';
import { TenantModule } from './modules/tenants/tenant.module';
import { SubscriptionPurchaseModule } from './modules/subscriptionPurchase/subscription-purchase.module';
import { SubscriptionExtensionModule } from './modules/subscription-extension/subscription-extension.module';
import { FeatureModule } from './modules/features/feature.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ShopModule } from './modules/shops/shop.module';
import { ProductModule } from './modules/products/product.module';
import { IngredientModule } from './modules/ingredients/ingredient.module';
import { InventoryModule } from './modules/inventories/inventory.module';
import { ShiftTemplateModule } from './modules/shift-templates/shift-template.module';
import { ShiftModule } from './modules/shifts/shift.module';
import { ProductCategoryModule } from './modules/product-categories/product-category.module';
import { OrderModule } from './modules/orders/order.module';
import { UserModule } from './modules/users/user.module';
import { ReportModule } from './modules/reports/report.module';
import { NotificationModule } from './modules/notifications/notification.module';
import { ChatbotModule } from './modules/chatbot/chatbot.module';

@Module({
  imports: [
    // Load .env
    ConfigModule.forRoot({
      isGlobal: true,
      load: appConfigurations,
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
    }),
    ScheduleModule.forRoot(),
    CommonModule,
    DatabaseModule,
    AuthModule,
    AdminModule,
    RoleModule,
    SubscriptionModule,
    FeatureModule,
    CustomerModule,
    TenantModule,
    SubscriptionPurchaseModule,
    SubscriptionExtensionModule,
    ShopModule,
    ProductModule,
    ProductCategoryModule,
    IngredientModule,
    InventoryModule,
    ShiftTemplateModule,
    ShiftModule,
    OrderModule,
    UserModule,
    ReportModule,
    NotificationModule,
    ChatbotModule,
  ],
  controllers: [], // Để trống vì đã xóa AppController
  providers: [], // Để trống vì đã xóa AppService
})
export class AppModule {}
