-- Refactor Impact Scale & Likelihood Scale from Konteks-based to RiskCategory-based
-- WARNING: This migration will DELETE all existing scale data (clean slate approach)
-- Make sure to backup your database before running this migration

-- Step 1: Delete all existing scale data (clean slate approach)
DELETE FROM `likelihood_scales`;
DELETE FROM `impact_scales`;

-- Step 2: Drop existing foreign key constraints
ALTER TABLE `likelihood_scales` DROP FOREIGN KEY `likelihood_scales_konteksId_fkey`;
ALTER TABLE `impact_scales` DROP FOREIGN KEY `impact_scales_konteksId_fkey`;

-- Step 3: Drop existing unique constraints
ALTER TABLE `likelihood_scales` DROP INDEX `likelihood_scales_konteksId_level_key`;
ALTER TABLE `impact_scales` DROP INDEX `impact_scales_konteksId_level_key`;

-- Step 4: Drop existing indexes
ALTER TABLE `likelihood_scales` DROP INDEX `likelihood_scales_konteksId_idx`;
ALTER TABLE `impact_scales` DROP INDEX `impact_scales_konteksId_idx`;

-- Step 5: Add new column riskCategoryId
ALTER TABLE `likelihood_scales` ADD COLUMN `riskCategoryId` VARCHAR(191) NOT NULL;
ALTER TABLE `impact_scales` ADD COLUMN `riskCategoryId` VARCHAR(191) NOT NULL;

-- Step 6: Drop old konteksId column
ALTER TABLE `likelihood_scales` DROP COLUMN `konteksId`;
ALTER TABLE `impact_scales` DROP COLUMN `konteksId`;

-- Step 7: Create new indexes
CREATE INDEX `likelihood_scales_riskCategoryId_idx` ON `likelihood_scales`(`riskCategoryId`);
CREATE INDEX `impact_scales_riskCategoryId_idx` ON `impact_scales`(`riskCategoryId`);

-- Step 8: Create new unique constraints
CREATE UNIQUE INDEX `likelihood_scales_riskCategoryId_level_key` ON `likelihood_scales`(`riskCategoryId`, `level`);
CREATE UNIQUE INDEX `impact_scales_riskCategoryId_level_key` ON `impact_scales`(`riskCategoryId`, `level`);

-- Step 9: Add new foreign key constraints with CASCADE delete
ALTER TABLE `likelihood_scales` ADD CONSTRAINT `likelihood_scales_riskCategoryId_fkey`
  FOREIGN KEY (`riskCategoryId`) REFERENCES `risk_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `impact_scales` ADD CONSTRAINT `impact_scales_riskCategoryId_fkey`
  FOREIGN KEY (`riskCategoryId`) REFERENCES `risk_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
