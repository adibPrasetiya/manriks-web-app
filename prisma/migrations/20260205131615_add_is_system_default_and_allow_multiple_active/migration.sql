-- AlterTable
ALTER TABLE `konteks` ADD COLUMN `isSystemDefault` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `konteks_isSystemDefault_idx` ON `konteks`(`isSystemDefault`);
