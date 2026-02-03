-- AlterTable
ALTER TABLE `risk_mitigations` ADD COLUMN `validationStatus` ENUM('PENDING', 'VALIDATED', 'REJECTED') NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX `risk_mitigations_validationStatus_idx` ON `risk_mitigations`(`validationStatus`);

-- CreateIndex
CREATE INDEX `risk_mitigations_validatedBy_idx` ON `risk_mitigations`(`validatedBy`);

-- AddForeignKey
ALTER TABLE `risk_mitigations` ADD CONSTRAINT `risk_mitigations_validatedBy_fkey` FOREIGN KEY (`validatedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
