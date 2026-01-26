-- Complete refactor: Remove RiskAssessment table, link RiskAssessmentItem directly to RiskWorksheet
-- This migration handles the full transition from the original schema

-- Step 1: Add worksheetId column to risk_assessment_items (nullable initially)
ALTER TABLE `risk_assessment_items` ADD COLUMN `worksheetId` VARCHAR(191) NULL;

-- Step 2: Migrate data - copy worksheetId from risk_assessments
UPDATE `risk_assessment_items` rai
INNER JOIN `risk_assessments` ra ON rai.assessmentId = ra.id
SET rai.worksheetId = ra.worksheetId;

-- Step 3: Make riskCode unique by using the record id (ensures uniqueness when merging)
UPDATE `risk_assessment_items`
SET riskCode = id;

-- Step 4: Make worksheetId NOT NULL
ALTER TABLE `risk_assessment_items` MODIFY `worksheetId` VARCHAR(191) NOT NULL;

-- Step 5: Drop old foreign key constraint
ALTER TABLE `risk_assessment_items` DROP FOREIGN KEY `risk_assessment_items_assessmentId_fkey`;

-- Step 6: Drop old unique constraint and index
DROP INDEX `risk_assessment_items_assessmentId_riskCode_key` ON `risk_assessment_items`;
DROP INDEX `risk_assessment_items_assessmentId_idx` ON `risk_assessment_items`;

-- Step 7: Remove assessmentId column
ALTER TABLE `risk_assessment_items` DROP COLUMN `assessmentId`;

-- Step 8: Add new foreign key constraint
ALTER TABLE `risk_assessment_items` ADD CONSTRAINT `risk_assessment_items_worksheetId_fkey`
FOREIGN KEY (`worksheetId`) REFERENCES `risk_worksheets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 9: Add new unique constraint and index
CREATE UNIQUE INDEX `risk_assessment_items_worksheetId_riskCode_key` ON `risk_assessment_items`(`worksheetId`, `riskCode`);
CREATE INDEX `risk_assessment_items_worksheetId_idx` ON `risk_assessment_items`(`worksheetId`);

-- Step 10: Drop the risk_assessments table
ALTER TABLE `risk_assessments` DROP FOREIGN KEY `risk_assessments_worksheetId_fkey`;
DROP TABLE `risk_assessments`;
