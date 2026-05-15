-- DropForeignKey
ALTER TABLE "customers" DROP CONSTRAINT "customers_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "ingredients" DROP CONSTRAINT "ingredients_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "product_categories" DROP CONSTRAINT "product_categories_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "shops" DROP CONSTRAINT "shops_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "tenant_subscriptions" DROP CONSTRAINT "tenant_subscriptions_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_tenant_id_fkey";

-- AlterTable
ALTER TABLE "tenant_subscriptions" ALTER COLUMN "tenant_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shops" ADD CONSTRAINT "shops_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_subscriptions" ADD CONSTRAINT "tenant_subscriptions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
