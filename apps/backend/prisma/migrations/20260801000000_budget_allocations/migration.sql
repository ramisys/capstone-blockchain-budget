-- AlterTable
ALTER TABLE `fiscal_years` ADD COLUMN `budgetAmount` DECIMAL(14, 2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `budget_allocations` (
    `id` VARCHAR(191) NOT NULL,
    `allocationCode` VARCHAR(191) NOT NULL,
    `fiscalYearId` VARCHAR(191) NOT NULL,
    `departmentId` VARCHAR(191) NOT NULL,
    `fundSourceId` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `programId` VARCHAR(191) NOT NULL,
    `allocatedAmount` DECIMAL(14, 2) NOT NULL,
    `description` VARCHAR(500) NULL,
    `status` ENUM('Draft', 'PendingApproval', 'Approved', 'Rejected', 'Archived') NOT NULL DEFAULT 'Draft',
    `createdBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `budget_allocations_allocationCode_key`(`allocationCode`),
    INDEX `budget_allocations_allocationCode_idx`(`allocationCode`),
    INDEX `budget_allocations_fiscalYearId_idx`(`fiscalYearId`),
    INDEX `budget_allocations_departmentId_idx`(`departmentId`),
    INDEX `budget_allocations_fundSourceId_idx`(`fundSourceId`),
    INDEX `budget_allocations_categoryId_idx`(`categoryId`),
    INDEX `budget_allocations_programId_idx`(`programId`),
    INDEX `budget_allocations_createdBy_idx`(`createdBy`),
    INDEX `budget_allocations_status_idx`(`status`),
    INDEX `budget_allocations_createdAt_idx`(`createdAt`),
    INDEX `budget_allocations_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `budget_allocations` ADD CONSTRAINT `budget_allocations_fiscalYearId_fkey` FOREIGN KEY (`fiscalYearId`) REFERENCES `fiscal_years`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `budget_allocations` ADD CONSTRAINT `budget_allocations_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `budget_allocations` ADD CONSTRAINT `budget_allocations_fundSourceId_fkey` FOREIGN KEY (`fundSourceId`) REFERENCES `fund_sources`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `budget_allocations` ADD CONSTRAINT `budget_allocations_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `budget_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `budget_allocations` ADD CONSTRAINT `budget_allocations_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `budget_programs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `budget_allocations` ADD CONSTRAINT `budget_allocations_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
