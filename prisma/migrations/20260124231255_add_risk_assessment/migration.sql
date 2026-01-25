-- CreateTable
CREATE TABLE `risk_assessments` (
    `id` VARCHAR(191) NOT NULL,
    `worksheetId` VARCHAR(191) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `assessmentDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(191) NOT NULL,
    `updatedBy` VARCHAR(191) NULL,
    `submittedAt` DATETIME(3) NULL,
    `submittedBy` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `reviewedBy` VARCHAR(191) NULL,
    `reviewNotes` TEXT NULL,
    `metadata` JSON NULL,

    INDEX `risk_assessments_worksheetId_idx`(`worksheetId`),
    INDEX `risk_assessments_status_idx`(`status`),
    INDEX `risk_assessments_createdBy_idx`(`createdBy`),
    INDEX `risk_assessments_createdAt_idx`(`createdAt`),
    UNIQUE INDEX `risk_assessments_worksheetId_code_key`(`worksheetId`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `risk_assessment_items` (
    `id` VARCHAR(191) NOT NULL,
    `assessmentId` VARCHAR(191) NOT NULL,
    `riskCode` VARCHAR(50) NOT NULL,
    `riskName` VARCHAR(255) NOT NULL,
    `riskDescription` TEXT NULL,
    `assetId` VARCHAR(191) NULL,
    `riskCategoryId` VARCHAR(191) NOT NULL,
    `inherentLikelihood` INTEGER NOT NULL,
    `inherentImpact` INTEGER NOT NULL,
    `inherentRiskLevel` VARCHAR(50) NOT NULL,
    `existingControls` TEXT NULL,
    `controlEffectiveness` VARCHAR(50) NULL,
    `residualLikelihood` INTEGER NOT NULL,
    `residualImpact` INTEGER NOT NULL,
    `residualRiskLevel` VARCHAR(50) NOT NULL,
    `treatmentOption` VARCHAR(50) NULL,
    `treatmentRationale` TEXT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `metadata` JSON NULL,

    INDEX `risk_assessment_items_assessmentId_idx`(`assessmentId`),
    INDEX `risk_assessment_items_riskCategoryId_idx`(`riskCategoryId`),
    INDEX `risk_assessment_items_assetId_idx`(`assetId`),
    INDEX `risk_assessment_items_inherentRiskLevel_idx`(`inherentRiskLevel`),
    INDEX `risk_assessment_items_residualRiskLevel_idx`(`residualRiskLevel`),
    UNIQUE INDEX `risk_assessment_items_assessmentId_riskCode_key`(`assessmentId`, `riskCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `risk_mitigations` (
    `id` VARCHAR(191) NOT NULL,
    `itemId` VARCHAR(191) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
    `plannedStartDate` DATETIME(3) NULL,
    `plannedEndDate` DATETIME(3) NULL,
    `actualStartDate` DATETIME(3) NULL,
    `actualEndDate` DATETIME(3) NULL,
    `responsiblePerson` VARCHAR(255) NULL,
    `responsibleUnit` VARCHAR(255) NULL,
    `status` ENUM('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PLANNED',
    `progressPercentage` INTEGER NOT NULL DEFAULT 0,
    `progressNotes` TEXT NULL,
    `validatedAt` DATETIME(3) NULL,
    `validatedBy` VARCHAR(191) NULL,
    `validationNotes` TEXT NULL,
    `isValidated` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(191) NOT NULL,
    `updatedBy` VARCHAR(191) NULL,
    `metadata` JSON NULL,

    INDEX `risk_mitigations_itemId_idx`(`itemId`),
    INDEX `risk_mitigations_status_idx`(`status`),
    INDEX `risk_mitigations_priority_idx`(`priority`),
    INDEX `risk_mitigations_isValidated_idx`(`isValidated`),
    UNIQUE INDEX `risk_mitigations_itemId_code_key`(`itemId`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `risk_assessments` ADD CONSTRAINT `risk_assessments_worksheetId_fkey` FOREIGN KEY (`worksheetId`) REFERENCES `risk_worksheets`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `risk_assessment_items` ADD CONSTRAINT `risk_assessment_items_assessmentId_fkey` FOREIGN KEY (`assessmentId`) REFERENCES `risk_assessments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `risk_mitigations` ADD CONSTRAINT `risk_mitigations_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `risk_assessment_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
