import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { LocalDocumentStorage } from '../services/documentStorageService.js';
import { computeSha256 } from '../utils/fileUtils.js';

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'docstorage-'));
const storage = new LocalDocumentStorage(tempRoot);

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

async function run() {
  let failed = false;
  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`PASS ${name}`);
    } catch (error) {
      failed = true;
      console.error(`FAIL ${name}: ${error.message}`);
    }
  }
  if (failed) process.exitCode = 1;
}

test('storeStream persists bytes and returns hash + size', async () => {
  const content = Buffer.from('purchase order evidence');
  const result = await storage.storeStream(Readable.from([content]), 'v1.pdf');

  assert.equal(result.sha256Hash, computeSha256(content));
  assert.equal(result.sizeBytes, content.length);
  assert.equal(result.storageKey, 'v1.pdf');
  assert.equal(fs.readFileSync(path.join(tempRoot, 'v1.pdf')).toString(), content.toString());
});

test('openReadStream returns the stored bytes', async () => {
  const content = Buffer.from('purchase order evidence');
  const stream = storage.openReadStream('v1.pdf');
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  assert.equal(Buffer.concat(chunks).toString(), content.toString());
});

test('exists reflects whether a blob is present', async () => {
  assert.equal(await storage.exists('v1.pdf'), true);
  assert.equal(await storage.exists('missing.pdf'), false);
});

test('removeBlob deletes the blob and is idempotent', async () => {
  const key = 'todelete.pdf';
  await storage.storeStream(Readable.from([Buffer.from('x')]), key);
  await storage.removeBlob(key);
  assert.equal(await storage.exists(key), false);
  await storage.removeBlob(key);
});

test('openReadStream throws NOT_FOUND for missing blobs', async () => {
  assert.throws(
    () => storage.openReadStream('missing.pdf'),
    (error) => error.statusCode === 404
  );
});

test('path traversal storage keys are rejected', async () => {
  assert.throws(
    () => storage.openReadStream('../escape.txt'),
    (error) => error.statusCode === 400
  );
  assert.throws(
    () => storage.openReadStream('..\\escape.txt'),
    (error) => error.statusCode === 400
  );
});

test('storeStream does not persist traversal keys', async () => {
  await assert.rejects(
    () => storage.storeStream(Readable.from([Buffer.from('x')]), '../evil.txt'),
    (error) => error.statusCode === 400
  );
  assert.equal(fs.existsSync(path.join(tempRoot, 'evil.txt')), false);
  assert.equal(fs.existsSync(path.resolve(tempRoot, '..', 'evil.txt')), false);
});

test('storeStream cleans up partial files on stream error', async () => {
  const failing = new Readable({
    read() {
      this.destroy(new Error('boom'));
    },
  });
  await assert.rejects(() => storage.storeStream(failing, 'partial.pdf'));
  assert.equal(fs.existsSync(path.join(tempRoot, 'partial.pdf')), false);
});

run();
