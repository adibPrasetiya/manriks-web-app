-- AlterTable: Make residual fields nullable in risk_assessment_items
ALTER TABLE `risk_assessment_items` MODIFY `residualLikelihood` INTEGER NULL,
    MODIFY `residualImpact` INTEGER NULL,
    MODIFY `residualRiskLevel` VARCHAR(50) NULL;

-- AlterTable: Add proposed residual fields to risk_mitigations
-- Step 1: Add columns as nullable first
ALTER TABLE `risk_mitigations`
    ADD COLUMN `proposedResidualLikelihood` INTEGER NULL,
    ADD COLUMN `proposedResidualImpact` INTEGER NULL,
    ADD COLUMN `proposedResidualLikelihoodDescription` TEXT NULL,
    ADD COLUMN `proposedResidualImpactDescription` TEXT NULL,
    ADD COLUMN `proposedResidualRiskLevel` VARCHAR(50) NULL;

-- Step 2: Set default values for existing rows (use reasonable defaults based on item's residual if available)
UPDATE `risk_mitigations` rm
JOIN `risk_assessment_items` rai ON rm.itemId = rai.id
SET
    rm.proposedResidualLikelihood = COALESCE(rai.residualLikelihood, rai.inherentLikelihood, 1),
    rm.proposedResidualImpact = COALESCE(rai.residualImpact, rai.inherentImpact, 1),
    rm.proposedResidualRiskLevel = COALESCE(rai.residualRiskLevel, rai.inherentRiskLevel, 'LOW')
WHERE rm.proposedResidualLikelihood IS NULL;

-- Step 3: Make required columns NOT NULL
ALTER TABLE `risk_mitigations`
    MODIFY `proposedResidualLikelihood` INTEGER NOT NULL,
    MODIFY `proposedResidualImpact` INTEGER NOT NULL,
    MODIFY `proposedResidualRiskLevel` VARCHAR(50) NOT NULL;
