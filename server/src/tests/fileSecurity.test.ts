import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import fsp from 'fs/promises';
import os from 'os';
import path from 'path';
import {
  checkExtensionAndMime,
  validateFileSize,
  verifySignature,
  sanitizeFilename,
  ALLOWED_TYPES,
} from '../services/fileSecurity';

// ─── Temp directory for test files ──────────────────────────────────────────

let tmpDir: string;

beforeAll(async () => {
  tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'filesec-test-'));
});

afterAll(async () => {
  try {
    await fsp.rm(tmpDir, { recursive: true, force: true });
  } catch {
    // ignore cleanup errors
  }
});

/** Write a buffer to a temp file and return its path. */
async function writeTempFile(name: string, data: Buffer): Promise<string> {
  const filePath = path.join(tmpDir, name);
  await fsp.writeFile(filePath, data);
  return filePath;
}

// ─── Real byte sequences ────────────────────────────────────────────────────

// Minimal valid PDF (just the header + enough body to be parseable)
const PDF_BYTES = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n');

// PNG: 8-byte signature + IHDR chunk (minimal)
const PNG_BYTES = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), // PNG sig
  Buffer.alloc(100), // padding to make it non-trivial
]);

// JPEG: FF D8 FF E0 header
const JPEG_BYTES = Buffer.concat([
  Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
  Buffer.alloc(100),
]);

// GIF89a
const GIF_BYTES = Buffer.concat([
  Buffer.from('GIF89a', 'ascii'),
  Buffer.alloc(100),
]);

// WebP: RIFF....WEBP
const WEBP_BYTES = Buffer.concat([
  Buffer.from('RIFF', 'ascii'),
  Buffer.from([0x00, 0x00, 0x00, 0x00]), // file size placeholder
  Buffer.from('WEBP', 'ascii'),
  Buffer.alloc(100),
]);

// OLE compound document (DOC/XLS/PPT/MSG): D0 CF 11 E0 A1 B1 1A E1
const OLE_BYTES = Buffer.concat([
  Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
  Buffer.alloc(512),
]);

// Plain text
const TEXT_BYTES = Buffer.from('Hello, this is plain text content.\nLine two.\n');

// Valid JSON
const JSON_BYTES = Buffer.from('{"key": "value", "number": 42}\n');

// CSV
const CSV_BYTES = Buffer.from('name,age,city\nAlice,30,NYC\nBob,25,LA\n');

// PDF with active content (/JavaScript)
const PDF_ACTIVE_BYTES = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog /JavaScript 2 0 R >>\nendobj\n%%EOF\n');

// BAT content disguised as PDF
const BAT_AS_PDF_BYTES = Buffer.from('@echo off\r\necho Hello World\r\npause\r\n');

// HTML content disguised as PNG
const HTML_AS_PNG_BYTES = Buffer.from('<html><head><title>Test</title></head><body>Hello</body></html>');

// MZ executable header
const MZ_BYTES = Buffer.concat([
  Buffer.from([0x4d, 0x5a]), // MZ
  Buffer.alloc(100),
]);

// ─── checkExtensionAndMime tests ────────────────────────────────────────────

describe('checkExtensionAndMime', () => {
  it('accepts .pdf with correct MIME', () => {
    const result = checkExtensionAndMime('report.pdf', 'application/pdf');
    expect(result).not.toBeNull();
    expect(result!.extensions).toContain('.pdf');
  });

  it('accepts .png with correct MIME', () => {
    const result = checkExtensionAndMime('photo.png', 'image/png');
    expect(result).not.toBeNull();
    expect(result!.extensions).toContain('.png');
  });

  it('accepts .jpg with correct MIME', () => {
    const result = checkExtensionAndMime('photo.jpg', 'image/jpeg');
    expect(result).not.toBeNull();
  });

  it('accepts .jpeg with correct MIME', () => {
    const result = checkExtensionAndMime('photo.jpeg', 'image/jpeg');
    expect(result).not.toBeNull();
  });

  it('accepts .docx with correct MIME', () => {
    const result = checkExtensionAndMime('doc.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    expect(result).not.toBeNull();
  });

  it('accepts .zip with correct MIME', () => {
    const result = checkExtensionAndMime('archive.zip', 'application/zip');
    expect(result).not.toBeNull();
  });

  it('accepts .csv with correct MIME', () => {
    const result = checkExtensionAndMime('data.csv', 'text/csv');
    expect(result).not.toBeNull();
  });

  it('accepts .eml with correct MIME', () => {
    const result = checkExtensionAndMime('email.eml', 'message/rfc822');
    expect(result).not.toBeNull();
  });

  it('rejects .svg extension (not in allowlist)', () => {
    const result = checkExtensionAndMime('icon.svg', 'image/svg+xml');
    expect(result).toBeNull();
  });

  it('rejects .exe extension', () => {
    const result = checkExtensionAndMime('malware.exe', 'application/x-msdownload');
    expect(result).toBeNull();
  });

  it('rejects .js extension', () => {
    const result = checkExtensionAndMime('script.js', 'text/javascript');
    expect(result).toBeNull();
  });

  it('rejects unknown extensions', () => {
    const result = checkExtensionAndMime('data.xyz', 'application/octet-stream');
    expect(result).toBeNull();
  });

  it('rejects files with no extension', () => {
    const result = checkExtensionAndMime('README', 'text/plain');
    expect(result).toBeNull();
  });

  it('still returns entry when browser MIME mismatches (logs warning)', () => {
    // The function should return the entry based on extension, not MIME
    const result = checkExtensionAndMime('report.pdf', 'text/html');
    expect(result).not.toBeNull();
    expect(result!.mimeTypes).toContain('application/pdf');
  });
});

// ─── validateFileSize tests ─────────────────────────────────────────────────

describe('validateFileSize', () => {
  it('rejects empty files with 400', () => {
    const entry = ALLOWED_TYPES.png;
    expect(() => validateFileSize(0, entry)).toThrow(/empty/i);
  });

  it('rejects oversized files with 413', () => {
    const entry = ALLOWED_TYPES.pdf;
    // Default doc limit is 25 MB
    const oversized = 26 * 1024 * 1024;
    expect(() => validateFileSize(oversized, entry)).toThrow(/exceeds/i);
  });

  it('accepts files within limits', () => {
    const entry = ALLOWED_TYPES.png;
    // 5 MB should be fine for images (10 MB default)
    expect(() => validateFileSize(5 * 1024 * 1024, entry)).not.toThrow();
  });
});

// ─── sanitizeFilename tests ─────────────────────────────────────────────────

describe('sanitizeFilename', () => {
  it('strips directory separators', () => {
    expect(sanitizeFilename('../../../etc/passwd')).toBe('_.._.._.._etc_passwd');
  });

  it('removes null bytes', () => {
    expect(sanitizeFilename('test\x00.txt')).toBe('test.txt');
  });

  it('removes control characters', () => {
    expect(sanitizeFilename('test\x01\x02file.txt')).toBe('testfile.txt');
  });

  it('limits to 200 chars', () => {
    const longName = 'a'.repeat(250) + '.txt';
    const result = sanitizeFilename(longName);
    expect(result.length).toBeLessThanOrEqual(200);
    expect(result.endsWith('.txt')).toBe(true);
  });

  it('returns unnamed for empty input', () => {
    expect(sanitizeFilename('')).toBe('unnamed');
  });

  it('preserves valid filenames', () => {
    expect(sanitizeFilename('report-2024.pdf')).toBe('report-2024.pdf');
  });
});

// ─── verifySignature tests ──────────────────────────────────────────────────

describe('verifySignature', () => {
  it('accepts valid PDF header', async () => {
    const filePath = await writeTempFile('test.pdf', PDF_BYTES);
    const entry = ALLOWED_TYPES.pdf;
    await expect(verifySignature(filePath, entry)).resolves.toBeUndefined();
  });

  it('accepts valid PNG header', async () => {
    const filePath = await writeTempFile('test.png', PNG_BYTES);
    const entry = ALLOWED_TYPES.png;
    await expect(verifySignature(filePath, entry)).resolves.toBeUndefined();
  });

  it('accepts valid JPEG header', async () => {
    const filePath = await writeTempFile('test.jpg', JPEG_BYTES);
    const entry = ALLOWED_TYPES.jpg;
    await expect(verifySignature(filePath, entry)).resolves.toBeUndefined();
  });

  it('accepts valid GIF header', async () => {
    const filePath = await writeTempFile('test.gif', GIF_BYTES);
    const entry = ALLOWED_TYPES.gif;
    await expect(verifySignature(filePath, entry)).resolves.toBeUndefined();
  });

  it('accepts valid WebP header', async () => {
    const filePath = await writeTempFile('test.webp', WEBP_BYTES);
    const entry = ALLOWED_TYPES.webp;
    await expect(verifySignature(filePath, entry)).resolves.toBeUndefined();
  });

  it('accepts valid OLE (DOC) header', async () => {
    const filePath = await writeTempFile('test.doc', OLE_BYTES);
    const entry = ALLOWED_TYPES.doc;
    await expect(verifySignature(filePath, entry)).resolves.toBeUndefined();
  });

  it('accepts valid CSV text', async () => {
    const filePath = await writeTempFile('test.csv', CSV_BYTES);
    const entry = ALLOWED_TYPES.csv;
    await expect(verifySignature(filePath, entry)).resolves.toBeUndefined();
  });

  it('accepts valid JSON', async () => {
    const filePath = await writeTempFile('test.json', JSON_BYTES);
    const entry = ALLOWED_TYPES.json;
    await expect(verifySignature(filePath, entry)).resolves.toBeUndefined();
  });

  it('accepts valid plain text', async () => {
    const filePath = await writeTempFile('test.txt', TEXT_BYTES);
    const entry = ALLOWED_TYPES.txt;
    await expect(verifySignature(filePath, entry)).resolves.toBeUndefined();
  });

  // ─── Rejection cases ──────────────────────────────────────────────────────

  it('rejects BAT content with .pdf extension', async () => {
    const filePath = await writeTempFile('fake.pdf', BAT_AS_PDF_BYTES);
    const entry = ALLOWED_TYPES.pdf;
    await expect(verifySignature(filePath, entry)).rejects.toThrow(/content doesn't match/i);
  });

  it('rejects HTML content with .png extension', async () => {
    const filePath = await writeTempFile('fake.png', HTML_AS_PNG_BYTES);
    const entry = ALLOWED_TYPES.png;
    await expect(verifySignature(filePath, entry)).rejects.toThrow(/content doesn't match/i);
  });

  it('rejects PDF with active content (/JavaScript)', async () => {
    const filePath = await writeTempFile('active.pdf', PDF_ACTIVE_BYTES);
    const entry = ALLOWED_TYPES.pdf;
    await expect(verifySignature(filePath, entry)).rejects.toThrow(/active content/i);
  });

  it('rejects MZ executable regardless of extension', async () => {
    const filePath = await writeTempFile('fake.pdf', MZ_BYTES);
    const entry = ALLOWED_TYPES.pdf;
    await expect(verifySignature(filePath, entry)).rejects.toThrow(/content doesn't match/i);
  });

  it('rejects text file with null bytes', async () => {
    const badText = Buffer.from('hello\x00world\n');
    const filePath = await writeTempFile('bad.txt', badText);
    const entry = ALLOWED_TYPES.txt;
    await expect(verifySignature(filePath, entry)).rejects.toThrow(/content doesn't match/i);
  });

  it('rejects invalid JSON', async () => {
    const badJson = Buffer.from('{invalid json}');
    const filePath = await writeTempFile('bad.json', badJson);
    const entry = ALLOWED_TYPES.json;
    await expect(verifySignature(filePath, entry)).rejects.toThrow(/content doesn't match/i);
  });

  it('rejects text file starting with shebang', async () => {
    const shebang = Buffer.from('#!/bin/bash\necho hello\n');
    const filePath = await writeTempFile('script.txt', shebang);
    const entry = ALLOWED_TYPES.txt;
    await expect(verifySignature(filePath, entry)).rejects.toThrow(/content doesn't match/i);
  });

  it('rejects wrong image format (PNG header for JPEG)', async () => {
    const filePath = await writeTempFile('fake.jpg', PNG_BYTES);
    const entry = ALLOWED_TYPES.jpg;
    await expect(verifySignature(filePath, entry)).rejects.toThrow(/content doesn't match/i);
  });

  it('rejects ZIP without OOXML structure as DOCX', async () => {
    // Create a minimal valid ZIP that doesn't have word/document.xml
    // ZIP local file header for a file named "readme.txt"
    const zipData = buildMinimalZip([{ name: 'readme.txt', data: Buffer.from('hello') }]);
    const filePath = await writeTempFile('fake.docx', zipData);
    const entry = ALLOWED_TYPES.docx;
    await expect(verifySignature(filePath, entry)).rejects.toThrow(/content doesn't match/i);
  });

  it('rejects ZIP containing .exe entry', async () => {
    const zipData = buildMinimalZip([
      { name: 'payload.exe', data: Buffer.from('MZ fake exe') },
      { name: 'readme.txt', data: Buffer.from('hello') },
    ]);
    const filePath = await writeTempFile('bad.zip', zipData);
    const entry = ALLOWED_TYPES.zip;
    await expect(verifySignature(filePath, entry)).rejects.toThrow(/blocked file type/i);
  });

  it('accepts valid ZIP archive', async () => {
    const zipData = buildMinimalZip([
      { name: 'document.txt', data: Buffer.from('hello world') },
      { name: 'data.csv', data: Buffer.from('a,b,c\n1,2,3') },
    ]);
    const filePath = await writeTempFile('good.zip', zipData);
    const entry = ALLOWED_TYPES.zip;
    await expect(verifySignature(filePath, entry)).resolves.toBeUndefined();
  });
});

// ─── Helper: Build minimal ZIP from entries ─────────────────────────────────

interface ZipFileEntry {
  name: string;
  data: Buffer;
}

/**
 * Builds a minimal valid ZIP file from scratch using raw bytes.
 * This avoids needing any external library for test construction.
 */
function buildMinimalZip(entries: ZipFileEntry[]): Buffer {
  const parts: Buffer[] = [];
  const centralDirEntries: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name, 'utf-8');
    const crc = crc32(entry.data);

    // Local file header
    const localHeader = Buffer.alloc(30 + nameBuf.length);
    localHeader.writeUInt32LE(0x04034b50, 0);  // signature
    localHeader.writeUInt16LE(20, 4);           // version needed
    localHeader.writeUInt16LE(0, 6);            // flags
    localHeader.writeUInt16LE(0, 8);            // compression (store)
    localHeader.writeUInt16LE(0, 10);           // mod time
    localHeader.writeUInt16LE(0, 12);           // mod date
    localHeader.writeUInt32LE(crc, 14);         // crc-32
    localHeader.writeUInt32LE(entry.data.length, 18); // compressed size
    localHeader.writeUInt32LE(entry.data.length, 22); // uncompressed size
    localHeader.writeUInt16LE(nameBuf.length, 26);    // filename length
    localHeader.writeUInt16LE(0, 28);                 // extra field length
    nameBuf.copy(localHeader, 30);

    parts.push(localHeader);
    parts.push(entry.data);

    // Central directory entry
    const cdEntry = Buffer.alloc(46 + nameBuf.length);
    cdEntry.writeUInt32LE(0x02014b50, 0);       // signature
    cdEntry.writeUInt16LE(20, 4);               // version made by
    cdEntry.writeUInt16LE(20, 6);               // version needed
    cdEntry.writeUInt16LE(0, 8);                // flags
    cdEntry.writeUInt16LE(0, 10);               // compression
    cdEntry.writeUInt16LE(0, 12);               // mod time
    cdEntry.writeUInt16LE(0, 14);               // mod date
    cdEntry.writeUInt32LE(crc, 16);             // crc-32
    cdEntry.writeUInt32LE(entry.data.length, 20); // compressed size
    cdEntry.writeUInt32LE(entry.data.length, 24); // uncompressed size
    cdEntry.writeUInt16LE(nameBuf.length, 28);    // filename length
    cdEntry.writeUInt16LE(0, 30);                 // extra field length
    cdEntry.writeUInt16LE(0, 32);                 // comment length
    cdEntry.writeUInt16LE(0, 34);                 // disk number start
    cdEntry.writeUInt16LE(0, 36);                 // internal attrs
    cdEntry.writeUInt32LE(0, 38);                 // external attrs
    cdEntry.writeUInt32LE(offset, 42);            // relative offset of local header
    nameBuf.copy(cdEntry, 46);

    centralDirEntries.push(cdEntry);
    offset += localHeader.length + entry.data.length;
  }

  const centralDirStart = offset;
  let centralDirSize = 0;
  for (const cd of centralDirEntries) {
    parts.push(cd);
    centralDirSize += cd.length;
  }

  // End of central directory record
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);          // signature
  eocd.writeUInt16LE(0, 4);                   // disk number
  eocd.writeUInt16LE(0, 6);                   // disk with CD
  eocd.writeUInt16LE(entries.length, 8);      // entries on this disk
  eocd.writeUInt16LE(entries.length, 10);     // total entries
  eocd.writeUInt32LE(centralDirSize, 12);     // CD size
  eocd.writeUInt32LE(centralDirStart, 16);    // CD offset
  eocd.writeUInt16LE(0, 20);                  // comment length
  parts.push(eocd);

  return Buffer.concat(parts);
}

/** Simple CRC-32 implementation for test ZIP construction. */
function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
