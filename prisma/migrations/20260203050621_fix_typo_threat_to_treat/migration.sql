/*
  Warnings:

  - You are about to drop the column `threatDescription` on the `risk_assessment_items` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `risk_assessment_items` DROP COLUMN `threatDescription`,
    ADD COLUMN `treatDescription` TEXT NULL;
