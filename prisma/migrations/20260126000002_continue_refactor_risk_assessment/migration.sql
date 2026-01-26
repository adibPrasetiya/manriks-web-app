-- Continue refactor risk assessment - completing the partial migration
-- The previous migration added worksheetId, copied data, and removed assessmentId
-- This migration fixes riskCode uniqueness and drops the risk_assessments table

-- Step 1: Make riskCode unique by using only the record id as the code
-- This ensures absolute uniqueness since IDs are unique
UPDATE `risk_assessment_items`
SET riskCode = id;

-- Step 2: Add new unique constraint and index
CREATE UNIQUE INDEX `risk_assessment_items_worksheetId_riskCode_key` ON `risk_assessment_items`(`worksheetId`, `riskCode`);
CREATE INDEX `risk_assessment_items_worksheetId_idx` ON `risk_assessment_items`(`worksheetId`);

-- Step 3: Drop the risk_assessments table if it exists
DROP TABLE IF EXISTS `risk_assessments`;
