-- CreateTable
CREATE TABLE `risk_worksheets` (
    `id` VARCHAR(191) NOT NULL,
    `unitKerjaId` VARCHAR(191) NOT NULL,
    `konteksId` VARCHAR(191) NOT NULL,
    `ownerId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'INACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `risk_worksheets_unitKerjaId_idx`(`unitKerjaId`),
    INDEX `risk_worksheets_konteksId_idx`(`konteksId`),
    INDEX `risk_worksheets_ownerId_idx`(`ownerId`),
    INDEX `risk_worksheets_status_idx`(`status`),
    UNIQUE INDEX `risk_worksheets_unitKerjaId_konteksId_name_key`(`unitKerjaId`, `konteksId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `risk_worksheets` ADD CONSTRAINT `risk_worksheets_unitKerjaId_fkey` FOREIGN KEY (`unitKerjaId`) REFERENCES `unit_kerja`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `risk_worksheets` ADD CONSTRAINT `risk_worksheets_konteksId_fkey` FOREIGN KEY (`konteksId`) REFERENCES `konteks`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
