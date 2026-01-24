-- AddForeignKey
ALTER TABLE `risk_worksheets` ADD CONSTRAINT `risk_worksheets_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
