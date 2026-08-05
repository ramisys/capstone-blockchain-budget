/**
 * Document status values used throughout the Document Management module.
 * These mirror the `DocumentStatus` Prisma enum.
 */
export const DOCUMENT_STATUS = {
  ACTIVE: 'Active',
  ARCHIVED: 'Archived',
};

export const DOCUMENT_STATUS_LIST = Object.values(DOCUMENT_STATUS);

/**
 * Prefix used when auto-generating document codes, e.g. DOC-2026-0001.
 */
export const DOCUMENT_CODE_PREFIX = 'DOC';

/**
 * Maximum number of versions allowed per document before replacement is rejected.
 */
export const MAX_DOCUMENT_VERSIONS = 50;
