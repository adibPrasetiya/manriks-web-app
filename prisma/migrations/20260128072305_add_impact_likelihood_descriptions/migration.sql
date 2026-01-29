-- AlterTable
ALTER TABLE `risk_assessment_items` ADD COLUMN `inherentImpactDescription` TEXT NULL,
    ADD COLUMN `inherentLikelihoodDescription` TEXT NULL,
    ADD COLUMN `residualImpactDescription` TEXT NULL,
    ADD COLUMN `residualLikelihoodDescription` TEXT NULL;
