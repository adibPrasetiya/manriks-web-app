-- Add new risk description fields and relations
-- This migration adds the missing columns and foreign keys

-- Step 1: Drop old riskDescription column
ALTER TABLE `risk_assessment_items` DROP COLUMN `riskDescription`;

-- Step 2: Add new description columns
ALTER TABLE `risk_assessment_items`
    ADD COLUMN `weaknessDescription` TEXT NULL,
    ADD COLUMN `threatDescription` TEXT NULL,
    ADD COLUMN `impactDescription` TEXT NULL,
    ADD COLUMN `riskPriorityRank` INTEGER NULL;

-- Step 3: Make assetId NOT NULL (required)
ALTER TABLE `risk_assessment_items` MODIFY COLUMN `assetId` VARCHAR(191) NOT NULL;

-- Step 4: Add foreign key for assetId (required, Restrict on delete)
ALTER TABLE `risk_assessment_items`
    ADD CONSTRAINT `risk_assessment_items_assetId_fkey`
    FOREIGN KEY (`assetId`) REFERENCES `assets`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 5: Add foreign key for riskCategoryId (required, Restrict on delete)
ALTER TABLE `risk_assessment_items`
    ADD CONSTRAINT `risk_assessment_items_riskCategoryId_fkey`
    FOREIGN KEY (`riskCategoryId`) REFERENCES `risk_categories`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;
