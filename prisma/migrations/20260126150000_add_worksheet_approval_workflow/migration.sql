-- Add worksheet approval workflow
-- Changes:
-- 1. Update RiskWorksheetStatus enum (ACTIVE/INACTIVE/ARCHIVED → DRAFT/SUBMITTED/APPROVED/ARCHIVED)
-- 2. Add submission and approval tracking fields

-- Step 1: Update existing status values before modifying enum
-- Convert ACTIVE to DRAFT, INACTIVE to DRAFT
UPDATE `risk_worksheets` SET `status` = 'DRAFT' WHERE `status` = 'ACTIVE';
UPDATE `risk_worksheets` SET `status` = 'DRAFT' WHERE `status` = 'INACTIVE';

-- Step 2: Modify enum - MySQL requires recreating the column
ALTER TABLE `risk_worksheets` MODIFY COLUMN `status` ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT';

-- Step 3: Add submission tracking fields
ALTER TABLE `risk_worksheets` ADD COLUMN `submittedAt` DATETIME(3) NULL;
ALTER TABLE `risk_worksheets` ADD COLUMN `submittedBy` VARCHAR(191) NULL;

-- Step 4: Add approval tracking fields
ALTER TABLE `risk_worksheets` ADD COLUMN `approvedAt` DATETIME(3) NULL;
ALTER TABLE `risk_worksheets` ADD COLUMN `approvedBy` VARCHAR(191) NULL;
ALTER TABLE `risk_worksheets` ADD COLUMN `approvalNotes` TEXT NULL;

-- Step 5: Add indexes for the new foreign key columns
CREATE INDEX `risk_worksheets_submittedBy_idx` ON `risk_worksheets`(`submittedBy`);
CREATE INDEX `risk_worksheets_approvedBy_idx` ON `risk_worksheets`(`approvedBy`);

-- Step 6: Add foreign key constraints to users table
ALTER TABLE `risk_worksheets` ADD CONSTRAINT `risk_worksheets_submittedBy_fkey`
FOREIGN KEY (`submittedBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `risk_worksheets` ADD CONSTRAINT `risk_worksheets_approvedBy_fkey`
FOREIGN KEY (`approvedBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
