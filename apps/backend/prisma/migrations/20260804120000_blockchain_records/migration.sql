-- CreateTable
CREATE TABLE `blockchain_records` (
    `id` VARCHAR(191) NOT NULL,
    `allocationId` VARCHAR(191) NOT NULL,
    `allocationCode` VARCHAR(191) NOT NULL,
    `contentHash` VARCHAR(191) NOT NULL,
    `txHash` VARCHAR(191) NULL,
    `blockNumber` BIGINT NULL,
    `network` VARCHAR(191) NOT NULL,
    `status` ENUM('Pending', 'Confirmed', 'Failed') NOT NULL DEFAULT 'Pending',
    `confirmedAt` DATETIME(3) NULL,
    `createdBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `blockchain_records_contentHash_key`(`contentHash`),
    UNIQUE INDEX `blockchain_records_txHash_key`(`txHash`),
    INDEX `blockchain_records_allocationId_idx`(`allocationId`),
    INDEX `blockchain_records_status_idx`(`status`),
    INDEX `blockchain_records_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `blockchain_records` ADD CONSTRAINT `blockchain_records_allocationId_fkey` FOREIGN KEY (`allocationId`) REFERENCES `budget_allocations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
