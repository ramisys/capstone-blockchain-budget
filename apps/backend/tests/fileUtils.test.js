import assert from 'node:assert/strict';
import {
  computeSha256,
  hashStream,
  getFileExtension,
  sanitizeFileName,
  generateStorageKey,
  sniffMimeType,
  isAllowedExtension,
  isAllowedMimeType,
  mimeMatchesExtension,
  validateUploadFile,
} from '../utils/fileUtils.js';
import { Readable } from 'node:stream';

const PDF_MAGIC = Buffer.from('%PDF-1.7\n');
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
const DOCX_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]);
const OLE_MAGIC = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
const EXE_MAGIC = Buffer.from([0x4d, 0x5a, 0x90, 0x00]);

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

test('computeSha256 returns a stable hex digest', async () => {
  const digest = computeSha256(Buffer.from('hello world'));
  assert.equal(digest, 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
});

test('hashStream computes hash and byte size', async () => {
  const stream = Readable.from([Buffer.from('hello'), Buffer.from(' world')]);
  const result = await hashStream(stream);
  assert.equal(result.sha256Hash, 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
  assert.equal(result.sizeBytes, 11);
});

test('getFileExtension handles mixed case and paths', async () => {
  assert.equal(getFileExtension('invoice.PDF'), 'pdf');
  assert.equal(getFileExtension('C:\\evil\\../receipt.docx'), 'docx');
  assert.equal(getFileExtension('noextension'), '');
});

test('sanitizeFileName strips directories and control chars', async () => {
  assert.equal(sanitizeFileName('../../etc/passwd'), 'passwd');
  assert.equal(sanitizeFileName('C:\\windows\\system32\\cmd.exe'), 'cmd.exe');
  assert.equal(sanitizeFileName('a\u0000b.pdf'), 'ab.pdf');
  assert.equal(sanitizeFileName(''), 'document');
});

test('generateStorageKey produces unique keys with extension', async () => {
  const key = generateStorageKey('pdf');
  assert.ok(key.endsWith('.pdf'));
  assert.notEqual(key, generateStorageKey('pdf'));
  assert.match(key, /^[0-9a-f-]{36}\.pdf$/);
  assert.doesNotMatch(generateStorageKey('exe'), /\./);
});

test('sniffMimeType detects supported formats from magic bytes', async () => {
  assert.equal(sniffMimeType(PDF_MAGIC), 'application/pdf');
  assert.equal(sniffMimeType(PNG_MAGIC), 'image/png');
  assert.equal(sniffMimeType(JPEG_MAGIC), 'image/jpeg');
  assert.equal(sniffMimeType(DOCX_MAGIC), 'application/zip');
  assert.equal(sniffMimeType(OLE_MAGIC), 'application/msword');
  assert.equal(sniffMimeType(Buffer.from('plain text\nhere')), 'text/plain');
  assert.equal(sniffMimeType(EXE_MAGIC), null);
  assert.equal(sniffMimeType(Buffer.alloc(0)), null);
});

test('allow-lists accept supported types and reject the rest', async () => {
  assert.ok(isAllowedExtension('pdf'));
  assert.ok(isAllowedExtension('DOCX'));
  assert.ok(!isAllowedExtension('exe'));
  assert.ok(!isAllowedExtension('zip'));
  assert.ok(isAllowedMimeType('application/pdf'));
  assert.ok(isAllowedMimeType('application/zip'));
  assert.ok(!isAllowedMimeType('application/x-executable'));
});

test('mimeMatchesExtension validates compatible families', async () => {
  assert.ok(mimeMatchesExtension('application/pdf', 'pdf'));
  assert.ok(mimeMatchesExtension('image/jpeg', 'jpg'));
  assert.ok(mimeMatchesExtension('application/zip', 'docx'));
  assert.ok(mimeMatchesExtension('application/zip', 'xlsx'));
  assert.ok(!mimeMatchesExtension('application/pdf', 'docx'));
  assert.ok(!mimeMatchesExtension('text/plain', 'pdf'));
});

test('validateUploadFile accepts a valid PDF', async () => {
  const result = validateUploadFile('budget-plan.PDF', PDF_MAGIC);
  assert.equal(result.ok, true);
  assert.equal(result.mimeType, 'application/pdf');
  assert.equal(result.extension, 'pdf');
  assert.ok(result.storageKey.endsWith('.pdf'));
});

test('validateUploadFile rejects disallowed extensions', async () => {
  const result = validateUploadFile('payload.exe', EXE_MAGIC);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'EXTENSION_NOT_ALLOWED');
});

test('validateUploadFile rejects extension/MIME mismatch', async () => {
  const result = validateUploadFile('notes.txt', PDF_MAGIC);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'EXTENSION_MISMATCH');
});

test('validateUploadFile rejects missing extensions', async () => {
  const result = validateUploadFile('README', Buffer.from('hello'));
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'EXTENSION_MISSING');
});

run();
