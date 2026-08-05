import { Prisma } from '@prisma/client';
import prisma from '../models/prismaClient.js';

/**
 * Relations eagerly loaded with every document query so callers never trigger
 * N+1 queries. Users are selected explicitly to avoid exposing password hashes.
 */
const documentInclude = {
  uploader: { select: { id: true, fullName: true, email: true, role: true } },
  archiver: { select: { id: true, fullName: true, email: true, role: true } },
  fiscalYear: { select: { id: true, code: true, startDate: true, endDate: true } },
  department: { select: { id: true, code: true, name: true } },
  allocation: { select: { id: true, allocationCode: true, status: true } },
  currentVersion: {
    include: {
      uploader: { select: { id: true, fullName: true, email: true, role: true } },
    },
  },
  _count: { select: { versions: true } },
};

const versionInclude = {
  uploader: { select: { id: true, fullName: true, email: true, role: true } },
};

class DocumentRepository {
  /**
   * Find a document by ID (including soft-deleted rows; the service layer
   * decides whether a soft-deleted record should be returned).
   *
   * @param {string} id - Document ID
   * @returns {Promise<Object|null>} Document object or null
   */
  async findById(id) {
    return prisma.managedDocument.findUnique({
      where: { id },
      include: documentInclude,
    });
  }

  /**
   * Find many documents with filtering, pagination, and sorting.
   *
   * @param {Object} filters - Filter criteria (search, documentType, status,
   *                           blockchainStatus, fiscalYearId, departmentId,
   *                           allocationId, uploadedBy, dateFrom, dateTo)
   * @param {Object} pagination - Pagination options (page, limit)
   * @param {Object} ordering - Ordering options (sortBy, sortOrder)
   * @returns {Promise<Array>} List of documents
   */
  async findMany(filters = {}, pagination = {}, ordering = {}) {
    const where = this.buildWhere(filters);

    const MAX_LIMIT = 100;
    const page = parseInt(pagination.page) || 1;
    const limit = Math.min(parseInt(pagination.limit) || 10, MAX_LIMIT);
    const skip = (page - 1) * limit;

    return prisma.managedDocument.findMany({
      where,
      skip,
      take: limit,
      orderBy: this.buildOrderBy(ordering),
      include: documentInclude,
    });
  }

  /**
   * Count documents matching the list filters (excludes soft-deleted).
   *
   * @param {Object} filters - Same filter criteria as findMany
   * @returns {Promise<number>} Count
   */
  async count(filters = {}) {
    return prisma.managedDocument.count({
      where: this.buildWhere(filters),
    });
  }

  /**
   * Create a document together with its initial version inside one serializable
   * transaction, so the sequential document code and the circular
   * currentVersionId back-reference are applied atomically.
   *
   * The sequence counts every document sharing the code prefix (including
   * soft-deleted rows) because deleted records keep their unique codes.
   *
   * @param {string} prefix - Code prefix, e.g. "DOC-2026" (or "DOC" without a fiscal year)
   * @param {Object} data - Document data (without documentCode)
   * @param {Object} versionData - Initial DocumentVersion data (without documentId/versionNumber)
   * @returns {Promise<Object>} Created document with related entities
   */
  async createDocumentWithVersion(prefix, data, versionData) {
    return prisma.$transaction(
      async (tx) => {
        const existing = await tx.managedDocument.findMany({
          where: { documentCode: { startsWith: `${prefix}-` } },
          select: { documentCode: true },
        });

        let maxSequence = 0;
        for (const { documentCode } of existing) {
          const sequence = parseInt(documentCode.slice(prefix.length + 1), 10);
          if (Number.isFinite(sequence) && sequence > maxSequence) {
            maxSequence = sequence;
          }
        }

        const documentCode = `${prefix}-${String(maxSequence + 1).padStart(4, '0')}`;

        const document = await tx.managedDocument.create({
          data: { ...data, documentCode },
          select: { id: true },
        });

        const version = await tx.documentVersion.create({
          data: { ...versionData, documentId: document.id, versionNumber: 1 },
          select: { id: true },
        });

        return tx.managedDocument.update({
          where: { id: document.id },
          data: { currentVersionId: version.id },
          include: documentInclude,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  }

  /**
   * Create a new version for an existing document and promote it to the
   * document's current version in one serializable transaction. The new
   * versionNumber is derived from the highest existing version so concurrent
   * replaces can never collide (the composite unique constraint backstops it).
   *
   * @param {string} documentId - Document ID
   * @param {Object} versionData - New DocumentVersion data (without documentId/versionNumber/replaceReason)
   * @param {string|null} replaceReason - Optional reason for the replacement
   * @returns {Promise<{document: Object, version: Object}>} Updated document + created version
   */
  async replaceCurrentVersion(documentId, versionData, replaceReason = null) {
    return prisma.$transaction(
      async (tx) => {
        const latest = await tx.documentVersion.findMany({
          where: { documentId },
          select: { versionNumber: true },
          orderBy: { versionNumber: 'desc' },
          take: 1,
        });

        const versionNumber = (latest[0]?.versionNumber || 0) + 1;

        const version = await tx.documentVersion.create({
          data: { ...versionData, documentId, versionNumber, replaceReason },
          include: versionInclude,
        });

        const document = await tx.managedDocument.update({
          where: { id: documentId },
          data: { currentVersionId: version.id },
          include: documentInclude,
        });

        return { document, version };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  }

  /**
   * List all versions of a document (newest first) with uploader details.
   *
   * @param {string} documentId - Document ID
   * @returns {Promise<Array>} Version list
   */
  async findVersionsByDocumentId(documentId) {
    return prisma.documentVersion.findMany({
      where: { documentId },
      orderBy: { versionNumber: 'desc' },
      include: versionInclude,
    });
  }

  /**
   * List the persisted activity timeline of a document (newest first).
   *
   * @param {string} documentId - Document ID
   * @returns {Promise<Array>} Activity list with actor details
   */
  async findActivities(documentId) {
    return prisma.documentActivity.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
      include: {
        actor: { select: { id: true, fullName: true, email: true, role: true } },
      },
    });
  }

  /**
   * Update a document by ID.
   *
   * @param {string} id - Document ID
   * @param {Object} data - Data to update
   * @returns {Promise<Object>} Updated document with related entities
   */
  async update(id, data) {
    return prisma.managedDocument.update({
      where: { id },
      data,
      include: documentInclude,
    });
  }

  /**
   * Archive + soft-delete a document. Versions are preserved for the chain of
   * evidence; only the logical document row is hidden from normal queries.
   *
   * @param {string} id - Document ID
   * @param {string} actorId - User ID performing the archive
   * @returns {Promise<Object>} Updated document
   */
  async softDelete(id, actorId) {
    return prisma.managedDocument.update({
      where: { id },
      data: {
        status: 'Archived',
        archivedBy: actorId,
        archivedAt: new Date(),
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Find a document version by its unique ID.
   *
   * @param {string} id - Version ID
   * @returns {Promise<Object|null>} Version with uploader details
   */
  async findVersionById(id) {
    return prisma.documentVersion.findUnique({
      where: { id },
      include: versionInclude,
    });
  }

  /**
   * Find a version by its position in a document's version chain.
   *
   * @param {string} documentId - Document ID
   * @param {number} versionNumber - 1-based version number
   * @returns {Promise<Object|null>} Version with uploader details
   */
  async findVersionByDocumentAndNumber(documentId, versionNumber) {
    return prisma.documentVersion.findFirst({
      where: { documentId, versionNumber },
      include: versionInclude,
    });
  }

  /**
   * Update a document version's blockchain anchor fields.
   *
   * @param {string} id - Version ID
   * @param {Object} data - Fields to update (txHash, blockNumber, status, network, confirmedAt)
   * @returns {Promise<Object>} Updated version with uploader details
   */
  async updateVersion(id, data) {
    return prisma.documentVersion.update({
      where: { id },
      data,
      include: versionInclude,
    });
  }

  /**
   * Find all document versions whose anchor has not been confirmed yet
   * (Pending or Failed status), oldest first. Used by the blockchain scheduler
   * to re-attempt anchoring in the background.
   *
   * @returns {Promise<Array>} List of unconfirmed versions
   */
  async findUnconfirmedVersions() {
    return prisma.documentVersion.findMany({
      where: {
        blockchainStatus: { in: ['Pending', 'Failed'] },
      },
      orderBy: { uploadedAt: 'asc' },
      include: versionInclude,
    });
  }

  /**
   * Look up a version by its content hash (used for duplicate detection).
   *
   * @param {string} sha256Hash - SHA-256 hex digest
   * @returns {Promise<Object|null>} Version id and owning document id
   */
  async findVersionByHash(sha256Hash) {
    return prisma.documentVersion.findUnique({
      where: { sha256Hash },
      select: { id: true, documentId: true },
    });
  }

  /**
   * Persist a document activity entry.
   *
   * @param {Object} data - Activity data
   * @param {string} data.documentId - Document ID
   * @param {string|null} data.versionId - Version ID
   * @param {string} data.actorId - Actor user ID
   * @param {string} data.action - Action from DOCUMENT_ACTIVITY_ACTIONS
   * @param {Object|null} [data.details] - Structured result/diff summary
   * @returns {Promise<Object>} Created activity with actor details
   */
  async createActivity(data) {
    return prisma.documentActivity.create({
      data,
      include: {
        actor: { select: { id: true, fullName: true, email: true, role: true } },
      },
    });
  }

  /**
   * Build a Prisma where clause from list filters. Shared by findMany and count.
   *
   * @private
   * @param {Object} filters - Filter criteria
   * @returns {Object} Prisma where clause
   */
  buildWhere(filters = {}) {
    const where = { deletedAt: null };

    if (filters.fiscalYearId) {
      where.fiscalYearId = filters.fiscalYearId;
    }
    if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    }
    if (filters.allocationId) {
      where.allocationId = filters.allocationId;
    }
    if (filters.uploadedBy) {
      where.uploadedBy = filters.uploadedBy;
    }
    if (filters.documentType) {
      where.documentType = filters.documentType;
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.blockchainStatus) {
      where.currentVersion = { is: { blockchainStatus: filters.blockchainStatus } };
    }

    // "Date created" range filter (dateTo is inclusive to end of day)
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        const endOfDay = new Date(filters.dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        where.createdAt.lte = endOfDay;
      }
    }

    // Fuzzy search across code, title, description, current file name, and
    // linked allocation code
    if (filters.search) {
      where.OR = [
        { documentCode: { contains: filters.search } },
        { title: { contains: filters.search } },
        { description: { contains: filters.search } },
        { currentVersion: { is: { originalFileName: { contains: filters.search } } } },
        { allocation: { is: { allocationCode: { contains: filters.search } } } },
      ];
    }

    return where;
  }

  /**
   * Build a Prisma orderBy clause from semantic sorting options.
   *
   * @private
   * @param {Object} ordering - Ordering options (sortBy, sortOrder)
   * @returns {Object} Prisma orderBy clause
   */
  buildOrderBy(ordering = {}) {
    const { sortBy, sortOrder } = ordering;

    switch (sortBy) {
      case 'newest':
        return { createdAt: 'desc' };
      case 'oldest':
        return { createdAt: 'asc' };
      case 'code':
      case 'documentCode':
        return { documentCode: sortOrder || 'asc' };
      case 'title':
        return { title: sortOrder || 'asc' };
      default:
        if (sortBy) {
          return { [sortBy]: sortOrder || 'asc' };
        }
        return { createdAt: 'desc' };
    }
  }
}

export const documentRepository = new DocumentRepository();
