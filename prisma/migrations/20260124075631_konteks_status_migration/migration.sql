/*
  Warnings:

  - You are about to drop the column `isActive` on the `konteks` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `konteks_isActive_idx` ON `konteks`;

-- AlterTable
ALTER TABLE `konteks` DROP COLUMN `isActive`,
    ADD COLUMN `status` ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'INACTIVE';

-- CreateIndex
CREATE INDEX `konteks_status_idx` ON `konteks`(`status`);
