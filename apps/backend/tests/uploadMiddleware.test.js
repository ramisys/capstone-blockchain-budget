import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import express from 'express';
import { uploadMiddleware, validateUploadedFile, mapUploadError } from '../middleware/uploadMiddleware.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { MulterError } from 'multer';
import { AppError } from '../errors/appError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

const UPLOAD_TEMP_DIR = path.join(os.tmpdir(), 'budgetchain-doc-uploads');

const PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

let passedTests = 0;
let totalTests = 0;

const test = async (name, testFn) => {
  totalTests++;
  try {
    await testFn();
    console.log(`   - ${name}: ✅ PASSED`);
    passedTests++;
  } catch (err) {
    console.error(`   - ${name}: ❌ FAILED`);
    console.error(`     ${err.stack || err}`);
  }
};

function buildApp() {
  const app = express();
  app.post(
    '/upload',
    uploadMiddleware('file'),
    validateUploadedFile,
    (req, res) => {
      res.json({
        ok: true,
        file: {
          safeName: req.file.safeName,
          extension: req.file.extension,
          detectedMime: req.file.detectedMime,
          storageKey: req.file.storageKey,
          size: req.file.size,
        },
      });
    }
  );
  app.use(errorHandler);
  return app;
}

let server;
let baseUrl;

async function startServer() {
  const app = buildApp();
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
}

async function stopServer() {
  await new Promise((resolve) => server.close(resolve));
}

async function uploadForm(form) {
  const res = await fetch(`${baseUrl}/upload`, { method: 'POST', body: form });
  let body;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, body };
}

async function countTempFiles() {
  try {
    const entries = await fs.readdir(UPLOAD_TEMP_DIR);
    return entries.length;
  } catch {
    return 0;
  }
}

async function runUploadMiddlewareTests() {
  console.log('🧪 Starting Upload Middleware Tests...\n');

  await startServer();

  try {
    console.log('1. Validation / rejection:');
    await test('accepts a valid PDF and derives safe metadata', async () => {
      const form = new FormData();
      form.append('file', new Blob([PDF_BYTES]), 'invoice.pdf');

      const res = await uploadForm(form);
      assert.equal(res.status, 200);
      assert.equal(res.body.ok, true);
      assert.equal(res.body.file.safeName, 'invoice.pdf');
      assert.equal(res.body.file.extension, 'pdf');
      assert.equal(res.body.file.detectedMime, 'application/pdf');
      assert.match(res.body.file.storageKey, /^[0-9a-f-]{36}\.pdf$/);
    });

    await test('accepts a valid PNG image', async () => {
      const form = new FormData();
      form.append('file', new Blob([PNG_BYTES]), 'receipt.png');

      const res = await uploadForm(form);
      assert.equal(res.status, 200);
      assert.equal(res.body.file.detectedMime, 'image/png');
      assert.equal(res.body.file.extension, 'png');
    });

    await test('rejects an executable with 415', async () => {
      const form = new FormData();
      form.append('file', new Blob([PNG_BYTES]), 'malware.exe');

      const res = await uploadForm(form);
      assert.equal(res.status, HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE);
      assert.equal(res.body.success, false);
      assert.equal(res.body.message, 'The file extension is not allowed');
    });

    await test('rejects an extension/MIME mismatch with 415', async () => {
      const form = new FormData();
      form.append('file', new Blob([PDF_BYTES]), 'photo.png');

      const res = await uploadForm(form);
      assert.equal(res.status, HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE);
      assert.equal(res.body.message, 'The file extension does not match its actual content');
    });

    await test('rejects a request with no file with 400', async () => {
      const form = new FormData();
      form.append('title', 'No file here');

      const res = await uploadForm(form);
      assert.equal(res.status, 400);
      assert.equal(res.body.message, 'A file is required');
    });

    await test('rejects an oversized file with 413', async () => {
      const bigBytes = new Uint8Array(26 * 1024 * 1024);
      bigBytes[0] = 0x25;
      bigBytes[1] = 0x50;
      bigBytes[2] = 0x44;
      bigBytes[3] = 0x46;
      bigBytes[4] = 0x2d;

      const form = new FormData();
      form.append('file', new Blob([bigBytes]), 'big.pdf');

      const res = await uploadForm(form);
      assert.equal(res.status, HTTP_STATUS.PAYLOAD_TOO_LARGE);
      assert.match(res.body.message, /size limit/);
    });

    console.log('\n2. mapUploadError unit coverage:');
    await test('maps LIMIT_FILE_SIZE to 413', () => {
      const err = new MulterError('LIMIT_FILE_SIZE', 'file');
      const mapped = mapUploadError(err);
      assert.ok(mapped instanceof AppError);
      assert.equal(mapped.statusCode, HTTP_STATUS.PAYLOAD_TOO_LARGE);
    });

    await test('maps LIMIT_UNEXPECTED_FILE to 400', () => {
      const err = new MulterError('LIMIT_UNEXPECTED_FILE', 'file');
      const mapped = mapUploadError(err);
      assert.equal(mapped.statusCode, 400);
    });

    await test('passes through non-multer errors unchanged', () => {
      const err = new Error('boom');
      assert.equal(mapUploadError(err), err);
    });

    console.log('\n3. Temp-file hygiene:');
    await test('leaves the upload temp directory empty after requests', async () => {
      const remaining = await countTempFiles();
      assert.equal(remaining, 0);
    });
  } finally {
    await stopServer();
  }

  console.log(`\n✨ Upload Middleware Tests Completed: ${passedTests}/${totalTests} Passed!\n`);
  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runUploadMiddlewareTests().catch((err) => {
  console.error('❌ Upload Middleware test failed:', err);
  process.exit(1);
});
