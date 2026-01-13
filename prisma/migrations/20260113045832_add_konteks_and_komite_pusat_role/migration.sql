-- AlterTable
ALTER TABLE `roles` MODIFY `name` ENUM('USER', 'ADMINISTRATOR', 'KOMITE_PUSAT') NOT NULL;

-- CreateTable
CREATE TABLE `konteks` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `periodStart` INTEGER NOT NULL,
    `periodEnd` INTEGER NOT NULL,
    `riskAppetiteLevel` VARCHAR(100) NULL,
    `riskAppetiteDescription` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,

    UNIQUE INDEX `konteks_code_key`(`code`),
    INDEX `konteks_code_idx`(`code`),
    INDEX `konteks_isActive_idx`(`isActive`),
    INDEX `konteks_periodStart_periodEnd_idx`(`periodStart`, `periodEnd`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `risk_categories` (
    `id` VARCHAR(191) NOT NULL,
    `konteksId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `risk_categories_konteksId_idx`(`konteksId`),
    INDEX `risk_categories_konteksId_order_idx`(`konteksId`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `likelihood_scales` (
    `id` VARCHAR(191) NOT NULL,
    `konteksId` VARCHAR(191) NOT NULL,
    `level` INTEGER NOT NULL,
    `label` VARCHAR(100) NOT NULL,
    `description` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `likelihood_scales_konteksId_idx`(`konteksId`),
    UNIQUE INDEX `likelihood_scales_konteksId_level_key`(`konteksId`, `level`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `impact_scales` (
    `id` VARCHAR(191) NOT NULL,
    `konteksId` VARCHAR(191) NOT NULL,
    `level` INTEGER NOT NULL,
    `label` VARCHAR(100) NOT NULL,
    `description` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `impact_scales_konteksId_idx`(`konteksId`),
    UNIQUE INDEX `impact_scales_konteksId_level_key`(`konteksId`, `level`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `risk_matrices` (
    `id` VARCHAR(191) NOT NULL,
    `konteksId` VARCHAR(191) NOT NULL,
    `likelihoodLevel` INTEGER NOT NULL,
    `impactLevel` INTEGER NOT NULL,
    `riskLevel` VARCHAR(50) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `risk_matrices_konteksId_idx`(`konteksId`),
    INDEX `risk_matrices_konteksId_riskLevel_idx`(`konteksId`, `riskLevel`),
    UNIQUE INDEX `risk_matrices_konteksId_likelihoodLevel_impactLevel_key`(`konteksId`, `likelihoodLevel`, `impactLevel`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `risk_categories` ADD CONSTRAINT `risk_categories_konteksId_fkey` FOREIGN KEY (`konteksId`) REFERENCES `konteks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `likelihood_scales` ADD CONSTRAINT `likelihood_scales_konteksId_fkey` FOREIGN KEY (`konteksId`) REFERENCES `konteks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `impact_scales` ADD CONSTRAINT `impact_scales_konteksId_fkey` FOREIGN KEY (`konteksId`) REFERENCES `konteks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `risk_matrices` ADD CONSTRAINT `risk_matrices_konteksId_fkey` FOREIGN KEY (`konteksId`) REFERENCES `konteks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
