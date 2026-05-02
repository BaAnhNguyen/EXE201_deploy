/*
  Warnings:

  - You are about to drop the column `features` on the `subscriptions` table. All the data in the column will be lost.
  - You are about to drop the `inventory_traits` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[shop_id]` on the table `inventories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `username` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "inventory_traits" DROP CONSTRAINT "inventory_traits_created_by_fkey";

-- DropForeignKey
ALTER TABLE "inventory_traits" DROP CONSTRAINT "inventory_traits_inventory_item_id_fkey";

-- AlterTable
ALTER TABLE "subscriptions" DROP COLUMN "features";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "username" TEXT NOT NULL;

-- DropTable
DROP TABLE "inventory_traits";

-- CreateTable
CREATE TABLE "features" (
    "id" SERIAL NOT NULL,
    "feature_code" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_features" (
    "subscription_id" INTEGER NOT NULL,
    "feature_id" INTEGER NOT NULL,

    CONSTRAINT "subscription_features_pkey" PRIMARY KEY ("subscription_id","feature_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "features_feature_code_key" ON "features"("feature_code");

-- CreateIndex
CREATE UNIQUE INDEX "inventories_shop_id_key" ON "inventories"("shop_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- AddForeignKey
ALTER TABLE "subscription_features" ADD CONSTRAINT "subscription_features_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_features" ADD CONSTRAINT "subscription_features_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
