/*
  Warnings:

  - A unique constraint covering the columns `[konteksId,order]` on the table `risk_categories` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `risk_categories_konteksId_order_idx` ON `risk_categories`;

-- AlterTable
ALTER TABLE `konteks` ADD COLUMN `matrixSize` INTEGER NOT NULL DEFAULT 5;

-- CreateIndex
CREATE UNIQUE INDEX `risk_categories_konteksId_order_key` ON `risk_categories`(`konteksId`, `order`);
