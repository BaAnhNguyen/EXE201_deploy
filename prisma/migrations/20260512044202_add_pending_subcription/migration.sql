-- CreateTable
CREATE TABLE "pending_subscriptions" (
    "id" SERIAL NOT NULL,
    "subscription_id" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "tenant_name" TEXT NOT NULL,
    "payos_order_code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pending_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pending_subscriptions_payos_order_code_key" ON "pending_subscriptions"("payos_order_code");

-- AddForeignKey
ALTER TABLE "pending_subscriptions" ADD CONSTRAINT "pending_subscriptions_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
