import multer, { MulterError } from 'multer';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { config } from '../config/env.js';
import { AppError } from '../errors/appError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { validateUploadFile } from '../utils/fileUtils.js';
import { logger } from '../utils/logger.js';

const MAX_FILE_SIZE_BYTES = config.storage.maxFileSizeBytes;
const UPLOAD_TEMP_DIR = path.join(os.tmpdir(), 'budgetchain-doc-uploads');

/**
 * Multer disk storage. Bytes land in an OS temp directory (never in memory) so
 * large uploads keep constant memory; the document service later streams the
 * temp file into the storage driver and the temp file is removed on completion.
 */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdir(UPLOAD_TEMP_DIR, { recursive: true })
      .then(() => cb(null, UPLOAD_TEMP_DIR))
      .catch((err) => cb(err));
  },
  filename: (_req, _file, cb) => {
    cb(null, crypto.randomUUID());
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

const sizeLimitLabel =
  MAX_FILE_SIZE_BYTES >= 1024 * 1024
    ? `${Math.round(MAX_FILE_SIZE_BYTES / (1024 * 1024))} MB`
    : `${MAX_FILE_SIZE_BYTES} bytes`;

const REJECTION_MESSAGES = {
  EXTENSION_MISSING: 'The file must have a supported extension',
  EXTENSION_NOT_ALLOWED: 'The file extension is not allowed',
  MIME_UNRECOGNIZED: 'The file type could not be detected from its contents',
  MIME_NOT_ALLOWED: 'The file type is not allowed',
  EXTENSION_MISMATCH: 'The file extension does not match its actual content',
};

/**
 * Translate a multer parse error into an operational AppError.
 *
 * @private
 * @param {Error} err - Error thrown by multer
 * @returns {AppError} Mapped error
 */
export function mapUploadError(err) {
  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return new AppError(
        `File exceeds the ${sizeLimitLabel} size limit`,
        HTTP_STATUS.PAYLOAD_TOO_LARGE
      );
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return new AppError('Unexpected file field in the upload', HTTP_STATUS.BAD_REQUEST);
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return new AppError('Too many files were uploaded', HTTP_STATUS.BAD_REQUEST);
    }
    return new AppError(`Upload error: ${err.message}`, HTTP_STATUS.BAD_REQUEST);
  }
  return err;
}

/**
 * Read the first bytes of a temp file for magic-byte sniffing without loading
 * the whole file into memory.
 *
 * @private
 * @param {string} filePath - Path to the inbound temp file
 * @returns {Promise<Buffer>} Header bytes (up to 16)
 */
async function readFileHeader(filePath) {
  const handle = await fs.open(filePath, 'r');
  try {
    const buffer = Buffer.alloc(16);
    const { bytesRead } = await handle.read(buffer, 0, 16, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
}

/**
 * Multer middleware that parses a single multipart file field into a temp file.
 * Multer size/count errors are translated to proper HTTP status codes (413/400).
 *
 * @param {string} [fieldName='file'] - Multipart field name carrying the file
 * @returns {Function} Express middleware
 */
export function uploadMiddleware(fieldName = 'file') {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err) {
        if (req.file?.path) {
          fs.unlink(req.file.path).catch(() => {});
        }
        const mapped = mapUploadError(err);
        if (!(mapped instanceof AppError)) {
          logger.error('File upload failed', mapped);
        }
        return next(mapped);
      }
      next();
    });
  };
}

/**
 * Magic-byte validation middleware that runs AFTER multer has written the
 * inbound file to disk. The client-supplied extension and file name are never
 * trusted: the real MIME type is sniffed from the file contents, the extension
 * must match, and a safe server-generated storage key replaces the original
 * name. Rejected files are deleted from the temp dir and answered with 415.
 *
 * @type {Function} Express middleware
 */
export const validateUploadedFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('A file is required', HTTP_STATUS.BAD_REQUEST));
    }

    const tempPath = req.file.path;
    const headerBytes = await readFileHeader(tempPath);
    const result = validateUploadFile(req.file.originalname, headerBytes);

    if (!result.ok) {
      await fs.unlink(tempPath).catch(() => {});
      return next(
        new AppError(
          REJECTION_MESSAGES[result.reason] || 'The file is not allowed',
          HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE
        )
      );
    }

    // Attach sanitized, server-derived file metadata for the service layer.
    req.file.safeName = result.originalFileName;
    req.file.extension = result.extension;
    req.file.detectedMime = result.mimeType;
    req.file.storageKey = result.storageKey;

    // Guarantee the temp file is removed once the request completes, whether
    // the upload succeeds or a later middleware/service throws. Both finish and
    // close are registered so cleanup also runs on aborted connections; the
    // unlink is idempotent.
    const cleanupTempFile = () => {
      fs.unlink(tempPath).catch(() => {});
    };
    res.once('finish', cleanupTempFile);
    res.once('close', cleanupTempFile);

    next();
  } catch (error) {
    next(error);
  }
};
