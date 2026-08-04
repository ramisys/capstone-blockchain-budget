-- AlterTable
ALTER TABLE `blockchain_records` ADD COLUMN `supersededAt` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `blockchain_records_allocationId_supersededAt_idx` ON `blockchain_records`(`allocationId`, `supersededAt`);
