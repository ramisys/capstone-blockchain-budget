-- CreateTable
CREATE TABLE `managed_documents` (
    `id` VARCHAR(191) NOT NULL,
    `documentCode` VARCHAR(191) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `description` VARCHAR(1000) NULL,
    `documentType` ENUM('PurchaseRequest', 'PurchaseOrder', 'Quotation', 'Receipt', 'Invoice', 'DisbursementVoucher', 'LiquidationReport', 'BudgetProposal', 'Contract', 'Other') NOT NULL,
    `fiscalYearId` VARCHAR(191) NULL,
    `departmentId` VARCHAR(191) NULL,
    `allocationId` VARCHAR(191) NULL,
    `status` ENUM('Active', 'Archived') NOT NULL DEFAULT 'Active',
    `currentVersionId` VARCHAR(191) NULL,
    `uploadedBy` VARCHAR(191) NOT NULL,
    `archivedBy` VARCHAR(191) NULL,
    `archivedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `managed_documents_documentCode_key`(`documentCode`),
    UNIQUE INDEX `managed_documents_currentVersionId_key`(`currentVersionId`),
    INDEX `managed_documents_allocationId_idx`(`allocationId`),
    INDEX `managed_documents_fiscalYearId_idx`(`fiscalYearId`),
    INDEX `managed_documents_departmentId_idx`(`departmentId`),
    INDEX `managed_documents_documentType_idx`(`documentType`),
    INDEX `managed_documents_status_idx`(`status`),
    INDEX `managed_documents_uploadedBy_idx`(`uploadedBy`),
    INDEX `managed_documents_createdAt_idx`(`createdAt`),
    INDEX `managed_documents_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `document_versions` (
    `id` VARCHAR(191) NOT NULL,
    `documentId` VARCHAR(191) NOT NULL,
    `versionNumber` INT NOT NULL,
    `originalFileName` VARCHAR(255) NOT NULL,
    `storageKey` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(100) NOT NULL,
    `fileSizeBytes` BIGINT NOT NULL,
    `fileExtension` VARCHAR(10) NOT NULL,
    `sha256Hash` VARCHAR(191) NOT NULL,
    `blockchainStatus` ENUM('Pending', 'Confirmed', 'Failed') NOT NULL DEFAULT 'Pending',
    `txHash` VARCHAR(191) NULL,
    `blockNumber` BIGINT NULL,
    `network` VARCHAR(191) NULL,
    `confirmedAt` DATETIME(3) NULL,
    `replaceReason` VARCHAR(500) NULL,
    `uploadedBy` VARCHAR(191) NOT NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `document_versions_storageKey_key`(`storageKey`),
    UNIQUE INDEX `document_versions_sha256Hash_key`(`sha256Hash`),
    UNIQUE INDEX `document_versions_txHash_key`(`txHash`),
    UNIQUE INDEX `document_versions_documentId_versionNumber_key`(`documentId`, `versionNumber`),
    INDEX `document_versions_documentId_idx`(`documentId`),
    INDEX `document_versions_blockchainStatus_idx`(`blockchainStatus`),
    INDEX `document_versions_uploadedAt_idx`(`uploadedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `document_activities` (
    `id` VARCHAR(191) NOT NULL,
    `documentId` VARCHAR(191) NOT NULL,
    `versionId` VARCHAR(191) NULL,
    `actorId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(50) NOT NULL,
    `details` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `document_activities_documentId_createdAt_idx`(`documentId`, `createdAt`),
    INDEX `document_activities_actorId_idx`(`actorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `managed_documents` ADD CONSTRAINT `managed_documents_fiscalYearId_fkey` FOREIGN KEY (`fiscalYearId`) REFERENCES `fiscal_years`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `managed_documents` ADD CONSTRAINT `managed_documents_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `managed_documents` ADD CONSTRAINT `managed_documents_allocationId_fkey` FOREIGN KEY (`allocationId`) REFERENCES `budget_allocations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `managed_documents` ADD CONSTRAINT `managed_documents_currentVersionId_fkey` FOREIGN KEY (`currentVersionId`) REFERENCES `document_versions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `managed_documents` ADD CONSTRAINT `managed_documents_uploadedBy_fkey` FOREIGN KEY (`uploadedBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `managed_documents` ADD CONSTRAINT `managed_documents_archivedBy_fkey` FOREIGN KEY (`archivedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document_versions` ADD CONSTRAINT `document_versions_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `managed_documents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document_versions` ADD CONSTRAINT `document_versions_uploadedBy_fkey` FOREIGN KEY (`uploadedBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document_activities` ADD CONSTRAINT `document_activities_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `managed_documents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document_activities` ADD CONSTRAINT `document_activities_versionId_fkey` FOREIGN KEY (`versionId`) REFERENCES `document_versions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document_activities` ADD CONSTRAINT `document_activities_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
