import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { storageConfig } from '../config/storage.js';
import { AppError } from '../errors/appError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { logger } from '../utils/logger.js';

/**
 * Storage driver contract: storeStream / openReadStream / removeBlob / exists.
 *
 * Implementations keep document bytes out of the database; metadata and hashes
 * live in MySQL. The local driver is the default; S3-compatible object storage
 * can be swapped in behind the same interface by setting STORAGE_DRIVER=s3.
 */
export class LocalDocumentStorage {
  constructor(root) {
    this.root = root;
  }

  /**
   * Resolve a storage key to an absolute path, rejecting anything that would
   * escape the storage root (path traversal defense).
   *
   * @private
   * @param {string} storageKey - Server-generated storage key
   * @returns {string} Absolute path inside the storage root
   */
  resolveKey(storageKey) {
    const resolved = path.resolve(this.root, storageKey);
    if (resolved !== this.root && !resolved.startsWith(this.root + path.sep)) {
      throw new AppError('Invalid storage key', HTTP_STATUS.BAD_REQUEST);
    }
    return resolved;
  }

  /**
   * Ensure the storage root directory exists.
   *
   * @private
   * @returns {Promise<void>}
   */
  async ensureRoot() {
    await fsp.mkdir(this.root, { recursive: true });
  }

  /**
   * Stream a file to disk while computing its SHA-256 digest in a single pass.
   * Any stream or write error cleans up the partial file.
   *
   * @param {import('node:stream').Readable} stream - Upload byte stream
   * @param {string} storageKey - Server-generated storage key
   * @returns {Promise<{storageKey: string, sha256Hash: string, sizeBytes: number}>}
   */
  async storeStream(stream, storageKey) {
    await this.ensureRoot();
    const target = this.resolveKey(storageKey);
    const hash = crypto.createHash('sha256');
    let sizeBytes = 0;

    try {
      await new Promise((resolve, reject) => {
        const out = fs.createWriteStream(target);
        stream.on('data', (chunk) => {
          sizeBytes += chunk.length;
          hash.update(chunk);
        });
        stream.on('error', (err) => {
          out.destroy(err);
          reject(err);
        });
        out.on('error', (err) => {
          stream.unpipe(out);
          reject(err);
        });
        out.on('finish', resolve);
        stream.pipe(out);
      });
    } catch (error) {
      await fsp.unlink(target).catch(() => {});
      throw error;
    }

    return { storageKey, sha256Hash: hash.digest('hex'), sizeBytes };
  }

  /**
   * Open a readable stream for a stored file.
   *
   * @param {string} storageKey - Server-generated storage key
   * @returns {import('node:stream').Readable} File read stream
   */
  openReadStream(storageKey) {
    const target = this.resolveKey(storageKey);
    if (!fs.existsSync(target)) {
      throw new AppError('Stored file not found', HTTP_STATUS.NOT_FOUND);
    }
    return fs.createReadStream(target);
  }

  /**
   * Delete a stored blob. Missing blobs are treated as success so cleanup
   * after failed transactions never throws.
   *
   * @param {string} storageKey - Server-generated storage key
   * @returns {Promise<void>}
   */
  async removeBlob(storageKey) {
    try {
      await fsp.unlink(this.resolveKey(storageKey));
    } catch (error) {
      if (error?.code !== 'ENOENT') {
        logger.warn(`Failed to remove stored blob ${storageKey}: ${error?.message || error}`);
      }
    }
  }

  /**
   * Whether a stored blob exists.
   *
   * @param {string} storageKey - Server-generated storage key
   * @returns {Promise<boolean>}
   */
  async exists(storageKey) {
    return fs.existsSync(this.resolveKey(storageKey));
  }
}

/**
 * Placeholder S3 driver. Selecting STORAGE_DRIVER=s3 before the adapter is
 * implemented fails fast with a clear error instead of silently misbehaving.
 */
export class S3DocumentStorage {
  constructor() {
    this.error = new AppError(
      'S3 storage driver is not implemented yet; set STORAGE_DRIVER=local',
      HTTP_STATUS.SERVICE_UNAVAILABLE
    );
  }

  async storeStream() {
    throw this.error;
  }

  openReadStream() {
    throw this.error;
  }

  async removeBlob() {
    throw this.error;
  }

  async exists() {
    throw this.error;
  }
}

/**
 * Select the storage driver from configuration.
 *
 * @returns {LocalDocumentStorage|S3DocumentStorage} Active driver
 */
export function createStorageDriver() {
  if (storageConfig.driver === 's3') {
    return new S3DocumentStorage();
  }
  return new LocalDocumentStorage(storageConfig.root);
}

export const documentStorage = createStorageDriver();
