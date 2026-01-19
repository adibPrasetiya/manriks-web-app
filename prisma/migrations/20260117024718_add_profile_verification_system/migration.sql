-- AlterTable
ALTER TABLE `profiles` ADD COLUMN `isVerified` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `verifiedAt` DATETIME(3) NULL,
    ADD COLUMN `verifiedBy` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `profile_change_requests` (
    `id` VARCHAR(191) NOT NULL,
    `profileId` VARCHAR(191) NOT NULL,
    `requestType` ENUM('INITIAL_VERIFICATION', 'CHANGE') NOT NULL DEFAULT 'CHANGE',
    `jabatan` VARCHAR(255) NULL,
    `unitKerjaId` VARCHAR(191) NULL,
    `nomorHP` VARCHAR(20) NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `rejectionReason` TEXT NULL,
    `requestedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processedAt` DATETIME(3) NULL,
    `processedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `profile_change_requests_profileId_idx`(`profileId`),
    INDEX `profile_change_requests_status_idx`(`status`),
    INDEX `profile_change_requests_requestType_idx`(`requestType`),
    INDEX `profile_change_requests_requestedAt_idx`(`requestedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `profiles_isVerified_idx` ON `profiles`(`isVerified`);

-- AddForeignKey
ALTER TABLE `profile_change_requests` ADD CONSTRAINT `profile_change_requests_profileId_fkey` FOREIGN KEY (`profileId`) REFERENCES `profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profile_change_requests` ADD CONSTRAINT `profile_change_requests_unitKerjaId_fkey` FOREIGN KEY (`unitKerjaId`) REFERENCES `unit_kerja`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
