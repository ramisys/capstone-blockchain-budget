import crypto from 'node:crypto';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

/**
 * Allowed file extensions for uploaded documents.
 */
export const ALLOWED_EXTENSIONS = new Set([
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'csv',
  'jpg',
  'jpeg',
  'png',
  'tiff',
  'tif',
  'webp',
  'txt',
]);

/**
 * MIME types considered safe to store and serve.
 */
export const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'text/csv',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/tiff',
  'image/webp',
]);

/**
 * Extension -> canonical MIME type used as the default when magic bytes match.
 */
const EXTENSION_MIME_MAP = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv',
  txt: 'text/plain',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  tiff: 'image/tiff',
  tif: 'image/tiff',
  webp: 'image/webp',
};

/**
 * Compatible extension sets for each detectable MIME signature. OLE compound
 * files (doc/xls) share one signature, and OOXML files (docx/xlsx) share the
 * ZIP signature, so those detected MIMEs match several extensions. The stored
 * MIME is later canonicalized from the extension for accurate serving.
 */
const MIME_COMPATIBLE_EXTENSIONS = {
  'application/pdf': ['pdf'],
  'application/msword': ['doc', 'xls'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
  'application/vnd.ms-excel': ['xls', 'csv'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx', 'csv'],
  'text/csv': ['csv'],
  'text/plain': ['txt', 'csv'],
  'application/zip': ['docx', 'xlsx'],
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/tiff': ['tiff', 'tif'],
  'image/webp': ['webp'],
};

/**
 * Compute the SHA-256 digest of a byte buffer.
 *
 * @param {Buffer|Uint8Array} buffer - File bytes
 * @returns {string} Hex-encoded SHA-256 digest (64 characters)
 */
export function computeSha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Consume a readable stream, computing SHA-256 and byte size in one pass.
 * Useful when the stream is already being consumed (e.g. verification).
 *
 * @param {import('node:stream').Readable} stream - Readable byte stream
 * @returns {Promise<{sha256Hash: string, sizeBytes: number}>} Hash and size
 */
export function hashStream(stream) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    let sizeBytes = 0;

    stream.on('data', (chunk) => {
      sizeBytes += chunk.length;
      hash.update(chunk);
    });
    stream.on('end', () => resolve({ sha256Hash: hash.digest('hex'), sizeBytes }));
    stream.on('error', reject);
  });
}

/**
 * Extract the lowercase extension (without the dot) from a file name.
 *
 * @param {string} fileName - Original file name
 * @returns {string} Lowercase extension or empty string
 */
export function getFileExtension(fileName) {
  const ext = path.extname(fileName || '');
  return ext ? ext.slice(1).toLowerCase() : '';
}

/**
 * Strip everything but the base file name. Removes directory components and
 * path separators so a hostile name can never escape the storage root.
 *
 * @param {string} fileName - Original file name
 * @returns {string} Sanitized base file name
 */
export function sanitizeFileName(fileName) {
  const basename = path.basename(String(fileName || ''))
    .replace(/[\u0000-\u001f]/g, '')
    .trim();
  return basename || 'document';
}

/**
 * Generate a collision-safe storage key. The original file name is never used
 * in the filesystem path.
 *
 * @param {string} extension - Safe lowercase extension
 * @returns {string} Storage key, e.g. "3f6b0e2c-…-a1b2c3d4.pdf"
 */
export function generateStorageKey(extension) {
  const safeExt = ALLOWED_EXTENSIONS.has(extension) ? extension : '';
  return `${randomUUID()}${safeExt ? `.${safeExt}` : ''}`;
}

/**
 * Detect the real MIME type of a file from its magic bytes. Never trusts the
 * client-supplied header or extension.
 *
 * @param {Buffer|Uint8Array} buffer - First bytes of the file
 * @returns {string|null} Detected MIME type or null if unrecognized
 */
export function sniffMimeType(buffer) {
  const bytes = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  if (bytes.length === 0) return null;

  if (bytes.subarray(0, 5).toString('ascii') === '%PDF-') {
    return 'application/pdf';
  }
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'image/png';
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return 'image/gif';
  }
  if (bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x2a && bytes[3] === 0x00) {
    return 'image/tiff';
  }
  if (bytes[0] === 0x4d && bytes[1] === 0x4d && bytes[2] === 0x00 && bytes[3] === 0x2a) {
    return 'image/tiff';
  }
  if (bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP') {
    return 'image/webp';
  }
  if (
    bytes[0] === 0xd0 &&
    bytes[1] === 0xcf &&
    bytes[2] === 0x11 &&
    bytes[3] === 0xe0 &&
    bytes[4] === 0xa1 &&
    bytes[5] === 0xb1
  ) {
    return 'application/msword';
  }
  if (bytes[0] === 0x50 && bytes[1] === 0x4b && (bytes[2] === 0x03 || bytes[2] === 0x05)) {
    return 'application/zip';
  }

  const printable = bytes.every(
    (byte) =>
      byte === 0x09 ||
      byte === 0x0a ||
      byte === 0x0d ||
      (byte >= 0x20 && byte <= 0x7e)
  );
  if (printable) {
    return 'text/plain';
  }

  return null;
}

/**
 * Whether an extension is on the allow-list (case-insensitive).
 *
 * @param {string} extension - File extension
 * @returns {boolean}
 */
export function isAllowedExtension(extension) {
  return ALLOWED_EXTENSIONS.has(String(extension).toLowerCase());
}

/**
 * Whether a MIME type is on the allow-list.
 *
 * @param {string} mimeType - MIME type
 * @returns {boolean}
 */
export function isAllowedMimeType(mimeType) {
  return ALLOWED_MIME_TYPES.has(mimeType);
}

/**
 * Whether a detected MIME type is compatible with a file extension.
 *
 * @param {string} mimeType - Detected MIME type
 * @param {string} extension - File extension
 * @returns {boolean} True when the extension is in the MIME's compatible set
 */
export function mimeMatchesExtension(mimeType, extension) {
  const compatible = MIME_COMPATIBLE_EXTENSIONS[mimeType];
  return Array.isArray(compatible) && compatible.includes(String(extension).toLowerCase());
}

/**
 * Validate a candidate upload: allowed extension, recognized + allowed MIME,
 * and extension/MIME compatibility. Produces the safe storage key on success.
 *
 * @param {string} originalFileName - Client-supplied file name
 * @param {Buffer|Uint8Array} buffer - First bytes used for magic-byte sniffing
 * @returns {Object} Validation outcome
 * @returns {boolean} outcome.ok - Whether the file passed validation
 * @returns {string|null} outcome.reason - Rejection reason when not ok
 * @returns {string} [outcome.originalFileName] - Sanitized base file name
 * @returns {string} [outcome.extension] - Safe lowercase extension
 * @returns {string} [outcome.mimeType] - Detected MIME type
 * @returns {string} [outcome.storageKey] - Server-generated storage key
 */
export function validateUploadFile(originalFileName, buffer) {
  const fileName = sanitizeFileName(originalFileName);
  const extension = getFileExtension(fileName);

  if (!extension) {
    return { ok: false, reason: 'EXTENSION_MISSING', originalFileName: fileName };
  }
  if (!isAllowedExtension(extension)) {
    return { ok: false, reason: 'EXTENSION_NOT_ALLOWED', originalFileName: fileName };
  }

  const mimeType = sniffMimeType(buffer);
  if (!mimeType) {
    return { ok: false, reason: 'MIME_UNRECOGNIZED', originalFileName: fileName };
  }
  if (!isAllowedMimeType(mimeType)) {
    return { ok: false, reason: 'MIME_NOT_ALLOWED', originalFileName: fileName, mimeType };
  }
  if (!mimeMatchesExtension(mimeType, extension)) {
    return { ok: false, reason: 'EXTENSION_MISMATCH', originalFileName: fileName, mimeType };
  }

  const canonicalMime = EXTENSION_MIME_MAP[extension] || mimeType;
  return {
    ok: true,
    originalFileName: fileName,
    extension,
    mimeType: canonicalMime,
    storageKey: generateStorageKey(extension),
  };
}
