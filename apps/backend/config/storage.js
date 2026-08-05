import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './env.js';

const BACKEND_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Resolved document storage options.
 *
 * The storage root is always an absolute path. Relative values in
 * STORAGE_ROOT are resolved against the backend package root so the same
 * config works regardless of the working directory.
 */
export const storageConfig = {
  driver: config.storage.driver,
  root: path.isAbsolute(config.storage.root)
    ? path.resolve(config.storage.root)
    : path.resolve(BACKEND_ROOT, config.storage.root),
  maxFileSizeBytes: config.storage.maxFileSizeBytes,
  maxVersions: config.storage.maxVersions,
};
