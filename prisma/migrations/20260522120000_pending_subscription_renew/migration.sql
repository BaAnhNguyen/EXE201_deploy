-- AlterTable
ALTER TABLE "pending_subscriptions" ADD COLUMN "purchase_type" TEXT NOT NULL DEFAULT 'NEW';
ALTER TABLE "pending_subscriptions" ADD COLUMN "tenant_id" INTEGER;

-- AddForeignKey
ALTER TABLE "pending_subscriptions" ADD CONSTRAINT "pending_subscriptions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
