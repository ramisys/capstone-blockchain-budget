-- AlterTable
ALTER TABLE `budget_allocations` ADD COLUMN `rejectionReason` VARCHAR(500) NULL,
    ADD COLUMN `reviewedAt` DATETIME(3) NULL,
    ADD COLUMN `reviewedBy` VARCHAR(191) NULL,
    ADD COLUMN `submittedAt` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `allocation_approvals` (
    `id` VARCHAR(191) NOT NULL,
    `allocationId` VARCHAR(191) NOT NULL,
    `action` ENUM('Submitted', 'Approved', 'Rejected', 'Returned') NOT NULL,
    `comment` VARCHAR(500) NULL,
    `actorId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `allocation_approvals_allocationId_idx`(`allocationId`),
    INDEX `allocation_approvals_actorId_idx`(`actorId`),
    INDEX `allocation_approvals_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `budget_allocations_reviewedBy_idx` ON `budget_allocations`(`reviewedBy`);

-- AddForeignKey
ALTER TABLE `budget_allocations` ADD CONSTRAINT `budget_allocations_reviewedBy_fkey` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `allocation_approvals` ADD CONSTRAINT `allocation_approvals_allocationId_fkey` FOREIGN KEY (`allocationId`) REFERENCES `budget_allocations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `allocation_approvals` ADD CONSTRAINT `allocation_approvals_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
