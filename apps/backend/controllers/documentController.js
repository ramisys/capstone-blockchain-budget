import { documentService } from '../services/documentService.js';
import { documentBlockchainService } from '../services/documentBlockchainService.js';
import { formatSuccessResponse } from '../utils/responseFormatter.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { auditLogger } from '../utils/auditLogger.js';
import { logger } from '../utils/logger.js';
import { AUDIT_ACTIONS, AUDIT_RESULTS } from '../constants/auditActions.js';

class DocumentController {
  /**
   * Upload a new document (multipart).
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async uploadDocument(req, res, next) {
    try {
      const document = await documentService.uploadDocument(req.file, req.body, req.user.id);

      auditLogger.logFromReq(req, {
        action: AUDIT_ACTIONS.DOCUMENT_UPLOAD,
        result: AUDIT_RESULTS.SUCCESS,
        resource: { type: 'Document', id: document.id, code: document.documentCode },
      });

      return res
        .status(HTTP_STATUS.CREATED)
        .json(formatSuccessResponse('Document uploaded successfully', { document }));
    } catch (error) {
      auditLogger.logFromReq(req, {
        action: AUDIT_ACTIONS.DOCUMENT_UPLOAD,
        result: AUDIT_RESULTS.FAILURE,
        resource: { type: 'Document', id: req.params?.id },
        error,
      });
      next(error);
    }
  }

  /**
   * Get a single document by ID.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getDocumentById(req, res, next) {
    try {
      const { id } = req.params;
      const document = await documentService.getDocumentById(id);
      return res
        .status(HTTP_STATUS.OK)
        .json(formatSuccessResponse('Document retrieved successfully', { document }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get documents with filtering, pagination, and sorting.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getDocuments(req, res, next) {
    try {
      const filters = {
        search: req.query.search,
        documentType: req.query.documentType,
        status: req.query.status,
        blockchainStatus: req.query.blockchainStatus,
        fiscalYearId: req.query.fiscalYearId,
        departmentId: req.query.departmentId,
        allocationId: req.query.allocationId,
        uploadedBy: req.query.uploadedBy,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
      };

      const pagination = {
        page: req.query.page,
        limit: req.query.limit,
      };

      const ordering = {
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
      };

      const result = await documentService.getDocuments(filters, pagination, ordering);
      return res
        .status(HTTP_STATUS.OK)
        .json(
          formatSuccessResponse('Documents retrieved successfully', {
            documents: result.documents,
            pagination: result.pagination,
          })
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update document metadata.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async updateDocument(req, res, next) {
    try {
      const { id } = req.params;
      const document = await documentService.updateDocument(id, req.body, req.user);

      auditLogger.logFromReq(req, {
        action: AUDIT_ACTIONS.DOCUMENT_UPDATE,
        result: AUDIT_RESULTS.SUCCESS,
        resource: { type: 'Document', id, code: document.documentCode },
        details: { updatedFields: Object.keys(req.body) },
      });

      return res
        .status(HTTP_STATUS.OK)
        .json(formatSuccessResponse('Document updated successfully', { document }));
    } catch (error) {
      auditLogger.logFromReq(req, {
        action: AUDIT_ACTIONS.DOCUMENT_UPDATE,
        result: AUDIT_RESULTS.FAILURE,
        resource: { type: 'Document', id: req.params.id },
        error,
      });
      next(error);
    }
  }

  /**
   * Replace a document's current version with a new file (multipart).
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async replaceDocument(req, res, next) {
    try {
      const { id } = req.params;
      const result = await documentService.replaceDocument(id, req.file, req.body, req.user);

      auditLogger.logFromReq(req, {
        action: AUDIT_ACTIONS.DOCUMENT_REPLACE,
        result: AUDIT_RESULTS.SUCCESS,
        resource: { type: 'Document', id, code: result.document.documentCode },
        details: { toVersionNumber: result.version.versionNumber },
      });

      return res
        .status(HTTP_STATUS.OK)
        .json(formatSuccessResponse('Document replaced successfully', result));
    } catch (error) {
      auditLogger.logFromReq(req, {
        action: AUDIT_ACTIONS.DOCUMENT_REPLACE,
        result: AUDIT_RESULTS.FAILURE,
        resource: { type: 'Document', id: req.params.id },
        error,
      });
      next(error);
    }
  }

  /**
   * Get the full version history of a document.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getDocumentVersions(req, res, next) {
    try {
      const { id } = req.params;
      const versions = await documentService.getDocumentVersions(id);
      return res
        .status(HTTP_STATUS.OK)
        .json(formatSuccessResponse('Document versions retrieved successfully', { versions }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get the persisted activity timeline of a document.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getDocumentActivities(req, res, next) {
    try {
      const { id } = req.params;
      const activities = await documentService.getDocumentActivities(id);
      return res
        .status(HTTP_STATUS.OK)
        .json(formatSuccessResponse('Document activities retrieved successfully', { activities }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify a document version's integrity and on-chain anchor.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async verifyDocument(req, res, next) {
    try {
      const { id } = req.params;
      const result = await documentBlockchainService.verifyDocument(id, req.query.version, req.user);
      return res
        .status(HTTP_STATUS.OK)
        .json(formatSuccessResponse('Document verification completed', result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Re-anchor a Pending/Failed document version on the ledger.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async retryDocument(req, res, next) {
    try {
      const { id } = req.params;
      const version = await documentBlockchainService.retryDocumentVersion(
        id,
        req.query.version,
        req.user
      );
      return res
        .status(HTTP_STATUS.OK)
        .json(formatSuccessResponse('Document anchored successfully', { version }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Archive + soft-delete a document.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async deleteDocument(req, res, next) {
    try {
      const { id } = req.params;
      const result = await documentService.deleteDocument(id, req.user);

      auditLogger.logFromReq(req, {
        action: AUDIT_ACTIONS.DOCUMENT_ARCHIVE,
        result: AUDIT_RESULTS.SUCCESS,
        resource: { type: 'Document', id },
      });

      return res.status(HTTP_STATUS.OK).json(formatSuccessResponse(result.message, {}));
    } catch (error) {
      auditLogger.logFromReq(req, {
        action: AUDIT_ACTIONS.DOCUMENT_ARCHIVE,
        result: AUDIT_RESULTS.FAILURE,
        resource: { type: 'Document', id: req.params.id },
        error,
      });
      next(error);
    }
  }

  /**
   * Download a document version as an attachment stream.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async downloadDocument(req, res, next) {
    try {
      const { id } = req.params;
      const result = await documentService.getDownloadFile(id, req.query.version);

      res.setHeader('Content-Type', result.mimeType);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename*=UTF-8''${encodeURIComponent(result.originalFileName)}`
      );
      res.setHeader('Content-Length', result.fileSizeBytes);

      result.stream.on('error', (error) => {
        logger.error('Document stream error', error);
        res.destroy(error);
      });
      result.stream.pipe(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Preview a document version inline (PDFs and images only).
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async previewDocument(req, res, next) {
    try {
      const { id } = req.params;
      const result = await documentService.getPreviewFile(id);

      res.setHeader('Content-Type', result.mimeType);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Disposition', 'inline');

      result.stream.on('error', (error) => {
        logger.error('Document stream error', error);
        res.destroy(error);
      });
      result.stream.pipe(res);
    } catch (error) {
      next(error);
    }
  }
}

export const documentController = new DocumentController();
