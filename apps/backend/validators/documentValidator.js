import { z } from 'zod';
import { DOCUMENT_TYPES_LIST } from '../constants/documentType.js';
import { DOCUMENT_STATUS_LIST } from '../constants/documentStatus.js';
import { BLOCKCHAIN_RECORD_STATUS_LIST } from '../constants/blockchainStatus.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Optional reference ID from a multipart/text body. Empty strings are
 * normalized to `null` (explicit unlink); absent keys stay `undefined`
 * (unchanged) so updates can distinguish "remove the link" from "keep it".
 */
const optionalReferenceId = z
  .string()
  .trim()
  .transform((value) => (value === '' ? null : value))
  .optional();

/**
 * Zod schema for the fields accompanying a document upload. The schema runs
 * AFTER multer has parsed the multipart body, so every value is a string.
 */
export const createDocumentSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title must not exceed 200 characters'),
  documentType: z.enum(DOCUMENT_TYPES_LIST, {
    errorMap: () => ({ message: 'Invalid document type' }),
  }),
  description: z
    .string()
    .trim()
    .max(1000, 'Description must not exceed 1000 characters')
    .transform((value) => (value === '' ? null : value))
    .optional(),
  allocationId: optionalReferenceId,
  fiscalYearId: optionalReferenceId,
  departmentId: optionalReferenceId,
});

/**
 * Zod schema for updating document metadata. Only Active documents are
 * editable; references can be removed by sending an empty string.
 */
export const updateDocumentSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title must not be empty')
    .max(200, 'Title must not exceed 200 characters')
    .optional(),
  documentType: z.enum(DOCUMENT_TYPES_LIST, {
    errorMap: () => ({ message: 'Invalid document type' }),
  }).optional(),
  description: z
    .string()
    .trim()
    .max(1000, 'Description must not exceed 1000 characters')
    .transform((value) => (value === '' ? null : value))
    .optional(),
  allocationId: optionalReferenceId,
  fiscalYearId: optionalReferenceId,
  departmentId: optionalReferenceId,
});

/**
 * Zod schema for list query parameters (filtering, pagination, search, sorting).
 */
export const documentQuerySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, 'Page must be a positive integer')
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().positive('Page must be a positive integer')),
  limit: z
    .string()
    .regex(/^\d+$/, 'Limit must be a positive integer')
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .pipe(z.number().int().positive('Limit must be a positive integer').max(100, 'Limit cannot exceed 100')),
  search: z.string().optional(),
  documentType: z.enum(DOCUMENT_TYPES_LIST, {
    errorMap: () => ({ message: 'Invalid document type' }),
  }).optional(),
  status: z.enum(DOCUMENT_STATUS_LIST, {
    errorMap: () => ({ message: 'Invalid document status' }),
  }).optional(),
  blockchainStatus: z.enum(BLOCKCHAIN_RECORD_STATUS_LIST, {
    errorMap: () => ({ message: 'Invalid blockchain status' }),
  }).optional(),
  fiscalYearId: z.string().optional(),
  departmentId: z.string().optional(),
  allocationId: z.string().optional(),
  uploadedBy: z.string().optional(),
  dateFrom: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), { message: 'Invalid dateFrom value' })
    .optional(),
  dateTo: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), { message: 'Invalid dateTo value' })
    .optional(),
  sortBy: z
    .enum(['newest', 'oldest', 'code', 'title', 'createdAt', 'updatedAt', 'documentCode'])
    .optional()
    .default('newest'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

/**
 * Zod schema for the optional fields accompanying a document replacement.
 * The schema runs AFTER multer has parsed the multipart body, so the only
 * present value is a string. Empty reasons normalize to `null`.
 */
export const replaceDocumentSchema = z.object({
  replaceReason: z
    .string()
    .trim()
    .max(500, 'Replace reason must not exceed 500 characters')
    .transform((value) => (value === '' ? null : value))
    .optional(),
});

/**
 * Zod schema for the :id route parameter on single-document routes.
 */
export const documentIdParamSchema = z.object({
  id: z
    .string({ required_error: 'Document ID is required' })
    .trim()
    .min(1, 'Document ID is required')
    .regex(UUID_REGEX, 'Invalid document ID'),
});

/**
 * Zod schema for the optional `version` query parameter used by download and
 * preview endpoints. Version numbers are 1-based positive integers.
 */
export const documentVersionQuerySchema = z.object({
  version: z
    .string()
    .regex(/^\d+$/, 'Version must be a positive integer')
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
});
