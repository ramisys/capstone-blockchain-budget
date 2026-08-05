import fs from 'node:fs';
import { documentRepository } from '../repositories/documentRepository.js';
import { fiscalYearRepository } from '../repositories/fiscalYearRepository.js';
import { departmentRepository } from '../repositories/departmentRepository.js';
import { allocationRepository } from '../repositories/allocationRepository.js';
import { documentStorage } from './documentStorageService.js';
import { documentBlockchainService } from './documentBlockchainService.js';
import { blockchainProvider } from '../config/blockchain.js';
import { config } from '../config/env.js';
import { AppError } from '../errors/appError.js';
import { ForbiddenError, ValidationError } from '../errors/apiError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { DOCUMENT_STATUS, DOCUMENT_CODE_PREFIX } from '../constants/documentStatus.js';
import { DOCUMENT_ACTIVITY_ACTIONS } from '../constants/documentActivityActions.js';
import { FISCAL_YEAR_STATUS } from '../constants/fiscalYearStatus.js';
import { USER_STATUS } from '../constants/status.js';
import { ROLES } from '../constants/roles.js';
import { toNumber } from '../utils/amountUtils.js';
import { logger } from '../utils/logger.js';
import { auditLogger } from '../utils/auditLogger.js';
import { AUDIT_ACTIONS } from '../constants/auditActions.js';

/**
 * MIME types that are safe to render inline in the browser (images and PDFs).
 * Anything else is forced to an attachment download.
 */
const PREVIEWABLE_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/tiff',
  'image/webp',
]);

class DocumentService {
  /**
   * Maximum number of versions a single document may accumulate before
   * replacement is rejected. Configured via MAX_DOCUMENT_VERSIONS.
   */
  get maxVersions() {
    return config.storage.maxVersions;
  }

  /**
   * Upload a new document: validate references, stream the inbound temp file
   * into the storage driver (hashing in the same pass), then persist the
   * document + initial version atomically and record the UPLOAD activity.
   *
   * Fail-soft storage-to-DB ordering: if the metadata write fails after the
   * bytes were stored, the orphaned blob is removed before rethrowing.
   *
   * @param {Object} file - Parsed upload file (from uploadMiddleware)
   * @param {Object} metadata - Validated metadata fields
   * @param {string} userId - ID of the authenticated user uploading
   * @returns {Promise<Object>} Created document
   */
  async uploadDocument(file, metadata, userId) {
    if (!file || !file.storageKey || !file.path) {
      throw new ValidationError('A valid file is required');
    }

    const resolved = await this.validateReferences(metadata);

    let blobStored = false;
    let documentCreated = false;
    let stored;

    try {
      stored = await documentStorage.storeStream(fs.createReadStream(file.path), file.storageKey);
      blobStored = true;

      const duplicate = await documentRepository.findVersionByHash(stored.sha256Hash);
      if (duplicate) {
        throw new AppError(
          'A document with the same content already exists',
          HTTP_STATUS.CONFLICT
        );
      }

      const prefix = this.buildCodePrefix(resolved.fiscalYear);
      const document = await documentRepository.createDocumentWithVersion(
        prefix,
        {
          title: metadata.title,
          description: metadata.description ?? null,
          documentType: metadata.documentType,
          fiscalYearId: metadata.fiscalYearId ?? null,
          departmentId: metadata.departmentId ?? null,
          allocationId: metadata.allocationId ?? null,
          uploadedBy: userId,
        },
        {
          originalFileName: file.safeName,
          storageKey: file.storageKey,
          mimeType: file.detectedMime,
          fileSizeBytes: stored.sizeBytes,
          fileExtension: file.extension,
          sha256Hash: stored.sha256Hash,
          uploadedBy: userId,
        }
      );
      documentCreated = true;

      await documentRepository.createActivity({
        documentId: document.id,
        versionId: document.currentVersionId,
        actorId: userId,
        action: DOCUMENT_ACTIVITY_ACTIONS.UPLOAD,
        details: {
          documentCode: document.documentCode,
          versionNumber: 1,
          fileSizeBytes: stored.sizeBytes,
          sha256Hash: stored.sha256Hash,
          documentType: metadata.documentType,
        },
      });

      logger.logEvent(`Document ${document.documentCode} uploaded by user ${userId}`);
      auditLogger.logSuccess({
        action: AUDIT_ACTIONS.DOCUMENT_UPLOAD,
        actor: userId,
        resource: { type: 'Document', id: document.id, code: document.documentCode },
        details: {
          documentType: metadata.documentType,
          fileSizeBytes: stored.sizeBytes,
          versionNumber: 1,
        },
      });

      // Fail-soft anchor: an unreachable/unconfigured ledger never fails the
      // upload; the version stays Pending/Failed and is retried later.
      const anchoredVersion = await documentBlockchainService
        .anchorVersion(document.currentVersion, userId)
        .catch(() => document.currentVersion);

      return this.serialize({ ...document, currentVersion: anchoredVersion });
    } catch (error) {
      if (blobStored && !documentCreated) {
        await documentStorage.removeBlob(file.storageKey).catch(() => {});
      }
      throw error;
    }
  }

  /**
   * Get a single document by ID (excluding soft-deleted documents).
   *
   * @param {string} id - Document ID
   * @returns {Promise<Object>} Document
   */
  async getDocumentById(id) {
    const document = await documentRepository.findById(id);
    if (!document || document.deletedAt) {
      throw new AppError('Document not found', HTTP_STATUS.NOT_FOUND);
    }
    return this.serialize(document);
  }

  /**
   * Get documents with filtering, pagination, and sorting.
   *
   * @param {Object} filters - Filter criteria
   * @param {Object} pagination - Pagination options
   * @param {Object} ordering - Ordering options
   * @returns {Promise<Object>} Documents list and pagination info
   */
  async getDocuments(filters = {}, pagination = {}, ordering = {}) {
    const [documents, totalCount] = await Promise.all([
      documentRepository.findMany(filters, pagination, ordering),
      documentRepository.count(filters),
    ]);

    const page = parseInt(pagination.page) || 1;
    const limit = parseInt(pagination.limit) || 10;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      documents: this.serializeMany(documents),
      pagination: { total: totalCount, page, limit, totalPages },
    };
  }

  /**
   * Update document metadata. Only Active documents are editable; Budget
   * Officers may only edit their own uploads.
   *
   * @param {string} id - Document ID
   * @param {Object} updateData - Data to update (validated by Zod)
   * @param {Object} actor - Authenticated user performing the update
   * @returns {Promise<Object>} Updated document
   */
  async updateDocument(id, updateData, actor) {
    const existing = await this.getExistingDocument(id);
    this.assertCanModify(existing, actor);

    if (existing.status !== DOCUMENT_STATUS.ACTIVE) {
      throw new AppError('Only active documents can be edited', HTTP_STATUS.CONFLICT);
    }

    const dataToUpdate = {};

    if (updateData.title !== undefined) {
      dataToUpdate.title = updateData.title;
    }
    if (updateData.description !== undefined) {
      dataToUpdate.description = updateData.description ?? null;
    }
    if (updateData.documentType !== undefined) {
      dataToUpdate.documentType = updateData.documentType;
    }

    const referenceFields = ['fiscalYearId', 'departmentId', 'allocationId'];
    const referencesChanged = referenceFields.some(
      (field) => updateData[field] !== undefined && updateData[field] !== existing[field]
    );

    if (referencesChanged) {
      await this.validateReferences({
        fiscalYearId:
          updateData.fiscalYearId !== undefined ? updateData.fiscalYearId : existing.fiscalYearId,
        departmentId:
          updateData.departmentId !== undefined ? updateData.departmentId : existing.departmentId,
        allocationId:
          updateData.allocationId !== undefined ? updateData.allocationId : existing.allocationId,
      });

      for (const field of referenceFields) {
        if (updateData[field] !== undefined) {
          dataToUpdate[field] = updateData[field];
        }
      }
    }

    const updated = await documentRepository.update(id, dataToUpdate);

    await documentRepository.createActivity({
      documentId: id,
      versionId: existing.currentVersionId,
      actorId: actor.id,
      action: DOCUMENT_ACTIVITY_ACTIONS.METADATA_UPDATE,
      details: { updatedFields: Object.keys(dataToUpdate) },
    });

    logger.logEvent(`Document ${existing.documentCode} metadata updated by user ${actor.id}`);
    auditLogger.logSuccess({
      action: AUDIT_ACTIONS.DOCUMENT_UPDATE,
      actor,
      resource: { type: 'Document', id, code: existing.documentCode },
      details: { updatedFields: Object.keys(dataToUpdate) },
    });

    return this.serialize(updated);
  }

  /**
   * Archive + soft-delete a document. Versions and blobs are kept for the chain
   * of evidence; only the logical row is hidden from normal queries.
   *
   * @param {string} id - Document ID
   * @param {Object} actor - Authenticated user performing the archive
   * @returns {Promise<Object>} Deletion confirmation
   */
  async deleteDocument(id, actor) {
    const existing = await this.getExistingDocument(id);
    this.assertCanModify(existing, actor);

    if (existing.status === DOCUMENT_STATUS.ARCHIVED) {
      throw new AppError('Document is already archived', HTTP_STATUS.CONFLICT);
    }

    await documentRepository.softDelete(id, actor.id);

    await documentRepository.createActivity({
      documentId: id,
      versionId: existing.currentVersionId,
      actorId: actor.id,
      action: DOCUMENT_ACTIVITY_ACTIONS.ARCHIVE,
      details: { documentCode: existing.documentCode },
    });

    logger.logEvent(`Document ${existing.documentCode} archived by user ${actor.id}`);
    auditLogger.logSuccess({
      action: AUDIT_ACTIONS.DOCUMENT_ARCHIVE,
      actor,
      resource: { type: 'Document', id, code: existing.documentCode },
    });

    return { message: 'Document archived successfully' };
  }

  /**
   * Replace a document's current version with a new file. The previous version
   * stays fully stored, immutable, and downloadable; the document code and
   * metadata are unchanged. Only Active documents may be replaced, and Budget
   * Officers are limited to documents they uploaded. Uploads beyond the
   * configured version limit are rejected, as are byte-identical files
   * (dedupe by SHA-256).
   *
   * @param {string} id - Document ID
   * @param {Object} file - Parsed upload file (from uploadMiddleware)
   * @param {Object} metadata - Validated replace fields (replaceReason)
   * @param {Object} actor - Authenticated user performing the replacement
   * @returns {Promise<Object>} { document, version } with the new version
   */
  async replaceDocument(id, file, metadata, actor) {
    if (!file || !file.storageKey || !file.path) {
      throw new ValidationError('A valid file is required');
    }

    const existing = await this.getExistingDocument(id);
    this.assertCanModify(existing, actor);

    if (existing.status !== DOCUMENT_STATUS.ACTIVE) {
      throw new AppError('Only active documents can be replaced', HTTP_STATUS.CONFLICT);
    }

    const versionCount = existing._count?.versions ?? 0;
    if (versionCount >= this.maxVersions) {
      throw new AppError(
        `A document cannot have more than ${this.maxVersions} versions`,
        HTTP_STATUS.CONFLICT
      );
    }

    let blobStored = false;
    let versionCreated = false;
    let stored;

    try {
      stored = await documentStorage.storeStream(fs.createReadStream(file.path), file.storageKey);
      blobStored = true;

      const duplicate = await documentRepository.findVersionByHash(stored.sha256Hash);
      if (duplicate) {
        throw new AppError(
          'A version with the same content already exists',
          HTTP_STATUS.CONFLICT
        );
      }

      const replaceReason = metadata.replaceReason ?? null;
      const { document, version } = await documentRepository.replaceCurrentVersion(
        id,
        {
          originalFileName: file.safeName,
          storageKey: file.storageKey,
          mimeType: file.detectedMime,
          fileSizeBytes: stored.sizeBytes,
          fileExtension: file.extension,
          sha256Hash: stored.sha256Hash,
          uploadedBy: actor.id,
        },
        replaceReason
      );
      versionCreated = true;

      await documentRepository.createActivity({
        documentId: id,
        versionId: version.id,
        actorId: actor.id,
        action: DOCUMENT_ACTIVITY_ACTIONS.REPLACE,
        details: {
          fromVersionNumber: existing.currentVersion?.versionNumber ?? 0,
          toVersionNumber: version.versionNumber,
          replaceReason,
          fileSizeBytes: stored.sizeBytes,
          sha256Hash: stored.sha256Hash,
        },
      });

      logger.logEvent(
        `Document ${existing.documentCode} replaced (v${version.versionNumber}) by user ${actor.id}`
      );
      auditLogger.logSuccess({
        action: AUDIT_ACTIONS.DOCUMENT_REPLACE,
        actor,
        resource: { type: 'Document', id, code: existing.documentCode },
        details: {
          fromVersionNumber: existing.currentVersion?.versionNumber ?? 0,
          toVersionNumber: version.versionNumber,
        },
      });

      // Fail-soft anchor: an unreachable/unconfigured ledger never fails the
      // replacement; the new version stays Pending/Failed and is retried later.
      const anchoredVersion = await documentBlockchainService
        .anchorVersion(version, actor.id)
        .catch(() => version);

      return {
        document: this.serialize({ ...document, currentVersion: anchoredVersion }),
        version: this.serializeVersion(anchoredVersion),
      };
    } catch (error) {
      if (blobStored && !versionCreated) {
        await documentStorage.removeBlob(file.storageKey).catch(() => {});
      }
      throw error;
    }
  }

  /**
   * List all versions of a document (newest first).
   *
   * @param {string} id - Document ID
   * @returns {Promise<Array>} Serialized versions
   */
  async getDocumentVersions(id) {
    const document = await this.getExistingDocument(id);
    const versions = await documentRepository.findVersionsByDocumentId(document.id);
    return versions.map((version) => this.serializeVersion(version));
  }

  /**
   * List the persisted activity timeline of a document (newest first).
   *
   * @param {string} id - Document ID
   * @returns {Promise<Array>} Activity entries
   */
  async getDocumentActivities(id) {
    const document = await this.getExistingDocument(id);
    return documentRepository.findActivities(document.id);
  }

  /**
   * Resolve a document version for download and open a read stream over its
   * stored bytes.
   *
   * @param {string} id - Document ID
   * @param {number} [versionNumber] - Optional 1-based version number (defaults to current)
   * @returns {Promise<Object>} { version, stream, originalFileName, mimeType, fileSizeBytes }
   */
  async getDownloadFile(id, versionNumber) {
    const document = await this.getExistingDocument(id);
    const version = await this.resolveVersion(document, versionNumber);
    return {
      version,
      stream: documentStorage.openReadStream(version.storageKey),
      originalFileName: version.originalFileName,
      mimeType: version.mimeType,
      fileSizeBytes: toNumber(version.fileSizeBytes),
    };
  }

  /**
   * Resolve a document version for inline preview. Only PDFs and images are
   * previewable; everything else is rejected with 415.
   *
   * @param {string} id - Document ID
   * @returns {Promise<Object>} { version, stream, mimeType }
   */
  async getPreviewFile(id) {
    const document = await this.getExistingDocument(id);
    const version = await this.resolveVersion(document);
    if (!PREVIEWABLE_MIME_TYPES.has(version.mimeType)) {
      throw new AppError(
        'This document type cannot be previewed',
        HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE
      );
    }
    return {
      version,
      stream: documentStorage.openReadStream(version.storageKey),
      mimeType: version.mimeType,
    };
  }

  /**
   * Fetch a live (non-deleted) document or throw a 404.
   *
   * @private
   * @param {string} id - Document ID
   * @returns {Promise<Object>} Document
   */
  async getExistingDocument(id) {
    const existing = await documentRepository.findById(id);
    if (!existing || existing.deletedAt) {
      throw new AppError('Document not found', HTTP_STATUS.NOT_FOUND);
    }
    return existing;
  }

  /**
   * Resolve the version to serve for a document.
   *
   * @private
   * @param {Object} document - Live document (with currentVersion included)
   * @param {number} [versionNumber] - Optional 1-based version number
   * @returns {Promise<Object>} Resolved version
   */
  async resolveVersion(document, versionNumber) {
    if (!versionNumber) {
      if (!document.currentVersion) {
        throw new AppError('Document has no current version', HTTP_STATUS.NOT_FOUND);
      }
      return document.currentVersion;
    }

    const version = await documentRepository.findVersionByDocumentAndNumber(
      document.id,
      versionNumber
    );
    if (!version) {
      throw new AppError('Document version not found', HTTP_STATUS.NOT_FOUND);
    }
    return version;
  }

  /**
   * Enforce service-layer ownership: Administrators may act on any document;
   * every other role is limited to documents they uploaded themselves.
   *
   * @private
   * @param {Object} existing - Existing document
   * @param {Object} actor - Authenticated user performing the action
   */
  assertCanModify(existing, actor) {
    if (actor.role === ROLES.ADMINISTRATOR) {
      return;
    }
    if (existing.uploadedBy !== actor.id) {
      throw new ForbiddenError('You can only modify documents you uploaded');
    }
  }

  /**
   * Validate that referenced master-data entities exist and are usable. Only
   * the reference IDs supplied (non-null) are checked, so the method is
   * reusable by both create and update flows.
   *
   * @private
   * @param {Object} referenceIds - { fiscalYearId, departmentId, allocationId }
   * @returns {Promise<Object>} Resolved entities keyed by role
   */
  async validateReferences(referenceIds = {}) {
    const [fiscalYear, department, allocation] = await Promise.all([
      referenceIds.fiscalYearId
        ? fiscalYearRepository.findById(referenceIds.fiscalYearId)
        : Promise.resolve(null),
      referenceIds.departmentId
        ? departmentRepository.findById(referenceIds.departmentId)
        : Promise.resolve(null),
      referenceIds.allocationId
        ? allocationRepository.findById(referenceIds.allocationId)
        : Promise.resolve(null),
    ]);

    const resolved = {};

    if (referenceIds.fiscalYearId) {
      if (!fiscalYear) {
        throw new AppError('Fiscal year not found', HTTP_STATUS.NOT_FOUND);
      }
      if (fiscalYear.status === FISCAL_YEAR_STATUS.ARCHIVED) {
        throw new AppError(
          'Documents cannot reference an archived fiscal year',
          HTTP_STATUS.CONFLICT
        );
      }
      resolved.fiscalYear = fiscalYear;
    }

    if (referenceIds.departmentId) {
      if (!department) {
        throw new AppError('Department not found', HTTP_STATUS.NOT_FOUND);
      }
      if (department.status !== USER_STATUS.ACTIVE) {
        throw new AppError('Department is inactive and cannot be referenced', HTTP_STATUS.CONFLICT);
      }
      resolved.department = department;
    }

    if (referenceIds.allocationId) {
      if (!allocation || allocation.deletedAt) {
        throw new AppError('Allocation not found', HTTP_STATUS.NOT_FOUND);
      }
      resolved.allocation = allocation;
    }

    return resolved;
  }

  /**
   * Build the document code prefix, e.g. "DOC-2026" for a fiscal year starting
   * in 2026, or the bare "DOC" prefix when no fiscal year is linked.
   *
   * @private
   * @param {Object|null} fiscalYear - Resolved fiscal year
   * @returns {string} Code prefix
   */
  buildCodePrefix(fiscalYear) {
    if (!fiscalYear) {
      return DOCUMENT_CODE_PREFIX;
    }
    const year = new Date(fiscalYear.startDate).getFullYear();
    return `${DOCUMENT_CODE_PREFIX}-${year}`;
  }

  /**
   * Normalize a document for API responses (BigInt -> number).
   *
   * @private
   * @param {Object|null} document - Document from Prisma
   * @returns {Object|null} Serialized document
   */
  serialize(document) {
    if (!document) return document;
    return {
      ...document,
      currentVersion: this.serializeVersion(document.currentVersion),
    };
  }

  /**
   * Normalize a list of documents for API responses.
   *
   * @private
   * @param {Array<Object>} documents - Documents from Prisma
   * @returns {Array<Object>} Serialized documents
   */
  serializeMany(documents) {
    return documents.map((document) => this.serialize(document));
  }

  /**
   * Normalize a document version for API responses (BigInt -> number, plus a
   * block explorer link when a transaction hash is present).
   *
   * @private
   * @param {Object|null} version - Version from Prisma
   * @returns {Object|null} Serialized version
   */
  serializeVersion(version) {
    if (!version) return version;
    return {
      ...version,
      fileSizeBytes: toNumber(version.fileSizeBytes),
      blockNumber: version.blockNumber != null ? Number(version.blockNumber) : null,
      txExplorerUrl: blockchainProvider.getExplorerTxUrl(version.txHash),
    };
  }
}

export const documentService = new DocumentService();
