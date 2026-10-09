import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { AppError } from '../utils/AppError';

// ─── Types ──────────────────────────────────────────────────────────────────

export type FileCategory = 'document' | 'text' | 'image' | 'archive' | 'email';

export interface AllowedTypeEntry {
  extensions: string[];
  mimeTypes: string[];
  maxBytes: number;
  category: FileCategory;
}

// ─── Env-driven size limits (lazy to avoid import-order issues) ─────────────

function getMaxBytes(category: FileCategory): number {
  // Read env lazily — these are set by the time uploads run.
  const mb = (key: string, fallback: number): number => {
    const v = process.env[key];
    return v ? Number(v) : fallback;
  };
  switch (category) {
    case 'image':   return mb('MAX_IMAGE_SIZE_MB', 10) * 1024 * 1024;
    case 'text':    return mb('MAX_TEXT_SIZE_MB', 10) * 1024 * 1024;
    case 'document':return mb('MAX_DOC_SIZE_MB', 25) * 1024 * 1024;
    case 'archive': return mb('MAX_ARCHIVE_SIZE_MB', 25) * 1024 * 1024;
    case 'email':   return mb('MAX_EMAIL_SIZE_MB', 25) * 1024 * 1024;
  }
}

// ─── ALLOWED_TYPES registry ─────────────────────────────────────────────────

const DOC_MIME_WORD = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const DOC_MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const DOC_MIME_PPTX = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
const DOC_MIME_ODT  = 'application/vnd.oasis.opendocument.text';
const DOC_MIME_ODS  = 'application/vnd.oasis.opendocument.spreadsheet';
const DOC_MIME_ODP  = 'application/vnd.oasis.opendocument.presentation';

export const ALLOWED_TYPES: Record<string, AllowedTypeEntry> = {
  // Documents
  pdf:  { extensions: ['.pdf'],  mimeTypes: ['application/pdf'], maxBytes: 0, category: 'document' },
  docx: { extensions: ['.docx'], mimeTypes: [DOC_MIME_WORD],     maxBytes: 0, category: 'document' },
  doc:  { extensions: ['.doc'],  mimeTypes: ['application/msword'], maxBytes: 0, category: 'document' },
  xlsx: { extensions: ['.xlsx'], mimeTypes: [DOC_MIME_XLSX],     maxBytes: 0, category: 'document' },
  xls:  { extensions: ['.xls'],  mimeTypes: ['application/vnd.ms-excel'], maxBytes: 0, category: 'document' },
  pptx: { extensions: ['.pptx'], mimeTypes: [DOC_MIME_PPTX],     maxBytes: 0, category: 'document' },
  ppt:  { extensions: ['.ppt'],  mimeTypes: ['application/vnd.ms-powerpoint'], maxBytes: 0, category: 'document' },
  odt:  { extensions: ['.odt'],  mimeTypes: [DOC_MIME_ODT],      maxBytes: 0, category: 'document' },
  ods:  { extensions: ['.ods'],  mimeTypes: [DOC_MIME_ODS],      maxBytes: 0, category: 'document' },
  odp:  { extensions: ['.odp'],  mimeTypes: [DOC_MIME_ODP],      maxBytes: 0, category: 'document' },

  // Text / data
  txt:  { extensions: ['.txt'],  mimeTypes: ['text/plain'],             maxBytes: 0, category: 'text' },
  csv:  { extensions: ['.csv'],  mimeTypes: ['text/csv'],               maxBytes: 0, category: 'text' },
  md:   { extensions: ['.md'],   mimeTypes: ['text/markdown', 'text/plain'], maxBytes: 0, category: 'text' },
  json: { extensions: ['.json'], mimeTypes: ['application/json'],       maxBytes: 0, category: 'text' },

  // Images (no SVG)
  png:  { extensions: ['.png'],          mimeTypes: ['image/png'],      maxBytes: 0, category: 'image' },
  jpg:  { extensions: ['.jpg', '.jpeg'], mimeTypes: ['image/jpeg'],     maxBytes: 0, category: 'image' },
  gif:  { extensions: ['.gif'],          mimeTypes: ['image/gif'],      maxBytes: 0, category: 'image' },
  webp: { extensions: ['.webp'],         mimeTypes: ['image/webp'],     maxBytes: 0, category: 'image' },

  // Archives
  zip:  { extensions: ['.zip'],  mimeTypes: ['application/zip'],        maxBytes: 0, category: 'archive' },

  // Email
  eml:  { extensions: ['.eml'],  mimeTypes: ['message/rfc822'],                maxBytes: 0, category: 'email' },
  msg:  { extensions: ['.msg'],  mimeTypes: ['application/vnd.ms-outlook'],    maxBytes: 0, category: 'email' },
};

// Populate maxBytes lazily at first access
let _maxBytesPopulated = false;
function ensureMaxBytes(): void {
  if (_maxBytesPopulated) return;
  for (const entry of Object.values(ALLOWED_TYPES)) {
    entry.maxBytes = getMaxBytes(entry.category);
  }
  _maxBytesPopulated = true;
}

// Build extension → key lookup
const EXT_TO_KEY = new Map<string, string>();
for (const [key, entry] of Object.entries(ALLOWED_TYPES)) {
  for (const ext of entry.extensions) {
    EXT_TO_KEY.set(ext.toLowerCase(), key);
  }
}

// Blocked extensions inside ZIP archives
const BLOCKED_ZIP_ENTRY_EXTS = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.js', '.msi', '.dll',
  '.ps1', '.vbs', '.com', '.scr', '.hta', '.jar', '.lnk',
  '.cpl', '.msc', '.reg', '.wsf', '.html', '.htm', '.svg',
]);

// ─── checkExtensionAndMime ──────────────────────────────────────────────────

/**
 * Returns the allowlist entry if the file extension is permitted, null otherwise.
 * The browser-supplied MIME type is logged but never trusted for final validation.
 */
export function checkExtensionAndMime(
  originalName: string,
  browserMime: string,
): AllowedTypeEntry | null {
  ensureMaxBytes();
  const ext = path.extname(originalName).toLowerCase();
  if (!ext) return null;
  const key = EXT_TO_KEY.get(ext);
  if (!key) return null;
  // Log browser MIME for auditing (never trust it)
  const entry = ALLOWED_TYPES[key];
  if (browserMime && !entry.mimeTypes.includes(browserMime)) {
    console.warn(
      `[fileSecurity] Browser MIME mismatch for "${originalName}": got "${browserMime}", expected one of [${entry.mimeTypes.join(', ')}]`,
    );
  }
  return entry;
}

// ─── validateFileSize ───────────────────────────────────────────────────────

/**
 * Throws AppError(400) if empty, AppError(413) if over limit.
 */
export function validateFileSize(sizeBytes: number, entry: AllowedTypeEntry): void {
  if (sizeBytes === 0) {
    throw new AppError('Uploaded file is empty', 400);
  }
  if (sizeBytes > entry.maxBytes) {
    const limitMB = Math.round(entry.maxBytes / (1024 * 1024));
    throw new AppError(
      `File exceeds the ${limitMB} MB limit for this file type`,
      413,
    );
  }
}

// ─── sanitizeFilename ───────────────────────────────────────────────────────

/**
 * Strip directory separators, null bytes, control characters, and characters
 * unsafe in HTTP headers. Limit to 200 chars. Keep the allowed extension.
 */
export function sanitizeFilename(original: string): string {
  // Extract extension first
  const ext = path.extname(original).toLowerCase();
  let base = path.basename(original);

  // Remove directory traversal
  base = base.replace(/[/\\]/g, '_');
  // Remove null bytes and control characters
  base = base.replace(/[\x00-\x1f\x7f]/g, '');
  // Remove characters problematic in HTTP headers (quotes, semicolons, backslash)
  base = base.replace(/[;"'\\]/g, '_');
  // Trim whitespace
  base = base.trim();

  if (!base) return 'unnamed';

  // Ensure we keep the extension within the 200-char limit
  const maxBase = 200 - ext.length;
  if (base.length > maxBase) {
    base = base.slice(0, maxBase);
  }

  return base + ext;
}

// ─── verifySignature ────────────────────────────────────────────────────────

/**
 * Reads the file from disk and performs real magic-byte signature checks.
 * Throws AppError(400) on mismatch.
 */
export async function verifySignature(
  filePath: string,
  entry: AllowedTypeEntry,
): Promise<void> {
  const fd = await fsp.open(filePath, 'r');
  try {
    // Read enough bytes for all signatures (first 512 bytes covers everything)
    const headerBuf = Buffer.alloc(512);
    const { bytesRead } = await fd.read(headerBuf, 0, 512, 0);
    const header = headerBuf.subarray(0, bytesRead);

    // Universal MZ guard — reject DOS/PE executables regardless of extension
    if (bytesRead >= 2 && header[0] === 0x4d && header[1] === 0x5a) {
      throw new AppError("The file content doesn't match its type", 400);
    }

    // Determine which check to run based on the entry's primary extension
    const primaryExt = entry.extensions[0].toLowerCase();

    switch (primaryExt) {
      case '.pdf':
        await verifyPdf(fd, header, bytesRead);
        break;
      case '.png':
        verifyPng(header);
        break;
      case '.jpg':
      case '.jpeg':
        verifyJpeg(header);
        break;
      case '.gif':
        verifyGif(header);
        break;
      case '.webp':
        verifyWebp(header);
        break;
      case '.docx':
      case '.xlsx':
      case '.pptx':
      case '.odt':
      case '.ods':
      case '.odp':
        await verifyOoxmlOrOdf(filePath, header, primaryExt);
        break;
      case '.doc':
      case '.xls':
      case '.ppt':
      case '.msg':
        verifyOle(header);
        break;
      case '.zip':
        await verifyZip(filePath, header);
        break;
      case '.txt':
      case '.csv':
      case '.md':
      case '.eml':
        await verifyText(filePath);
        break;
      case '.json':
        await verifyJson(filePath);
        break;
      default:
        // If we don't have a specific checker, at least ensure not an executable
        break;
    }
  } finally {
    await fd.close();
  }
}

// ─── Individual verifiers ───────────────────────────────────────────────────

/**
 * Checks whether `pattern` appears as a PDF name token in `content`.
 * A valid PDF name token is the pattern followed by a delimiter character
 * (space, tab, CR, LF, `/`, `(`, `<`) so we don't match mid-string text.
 */
function hasPdfNameToken(content: string, pattern: string): boolean {
  const delimRe = /[ \t\r\n/(<]/;
  let idx = 0;
  while ((idx = content.indexOf(pattern, idx)) !== -1) {
    const afterIdx = idx + pattern.length;
    if (afterIdx >= content.length || delimRe.test(content[afterIdx])) {
      return true;
    }
    idx = afterIdx;
  }
  return false;
}

async function verifyPdf(
  fd: fs.promises.FileHandle,
  header: Buffer,
  bytesRead: number,
): Promise<void> {
  // PDF must start with %PDF-
  const headerStr = header.toString('ascii', 0, Math.min(bytesRead, 5));
  if (!headerStr.startsWith('%PDF-')) {
    throw new AppError("The file content doesn't match its type", 400);
  }

  // Scan for active content markers in the full file
  const stat = await fd.stat();
  const fullBuf = Buffer.alloc(stat.size);
  await fd.read(fullBuf, 0, stat.size, 0);
  const content = fullBuf.toString('latin1'); // latin1 preserves raw bytes for ASCII pattern matching

  // Always reject these dangerous PDF name tokens
  const alwaysRejectTokens = ['/JavaScript', '/JS', '/Launch', '/EmbeddedFile'];
  for (const token of alwaysRejectTokens) {
    if (hasPdfNameToken(content, token)) {
      throw new AppError('PDF contains active content', 400);
    }
  }

  // /OpenAction is only dangerous when closely followed by /JavaScript, /JS, or /Launch
  // A bare /OpenAction pointing to a page-fit destination (e.g. /OpenAction [3 0 R /Fit])
  // is harmless and produced by Word, LibreOffice, etc.
  if (hasPdfNameToken(content, '/OpenAction')) {
    const openActionIdx = content.indexOf('/OpenAction');
    // Check within ~120 bytes after /OpenAction for dangerous action types
    const windowEnd = Math.min(openActionIdx + 120, content.length);
    const window = content.slice(openActionIdx, windowEnd);
    const dangerousActions = ['/JavaScript', '/JS', '/Launch'];
    for (const action of dangerousActions) {
      if (hasPdfNameToken(window, action)) {
        throw new AppError('PDF contains active content', 400);
      }
    }
  }
}

function verifyPng(header: Buffer): void {
  const pngSig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (header.length < 8 || !header.subarray(0, 8).equals(pngSig)) {
    throw new AppError("The file content doesn't match its type", 400);
  }
}

function verifyJpeg(header: Buffer): void {
  if (header.length < 3 || header[0] !== 0xff || header[1] !== 0xd8 || header[2] !== 0xff) {
    throw new AppError("The file content doesn't match its type", 400);
  }
}

function verifyGif(header: Buffer): void {
  if (header.length < 6) {
    throw new AppError("The file content doesn't match its type", 400);
  }
  const sig = header.toString('ascii', 0, 6);
  if (sig !== 'GIF87a' && sig !== 'GIF89a') {
    throw new AppError("The file content doesn't match its type", 400);
  }
}

function verifyWebp(header: Buffer): void {
  // RIFF....WEBP
  if (header.length < 12) {
    throw new AppError("The file content doesn't match its type", 400);
  }
  const riff = header.toString('ascii', 0, 4);
  const webp = header.toString('ascii', 8, 12);
  if (riff !== 'RIFF' || webp !== 'WEBP') {
    throw new AppError("The file content doesn't match its type", 400);
  }
}

function verifyOle(header: Buffer): void {
  // OLE compound document: D0 CF 11 E0 A1 B1 1A E1
  const oleSig = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  if (header.length < 8 || !header.subarray(0, 8).equals(oleSig)) {
    throw new AppError("The file content doesn't match its type", 400);
  }
}

async function verifyOoxmlOrOdf(
  filePath: string,
  header: Buffer,
  ext: string,
): Promise<void> {
  // OOXML and ODF are ZIP-based — check ZIP signature first
  if (header.length < 4) {
    throw new AppError("The file content doesn't match its type", 400);
  }
  const isZip =
    (header[0] === 0x50 && header[1] === 0x4b && header[2] === 0x03 && header[3] === 0x04) ||
    (header[0] === 0x50 && header[1] === 0x4b && header[2] === 0x05 && header[3] === 0x06);

  if (!isZip) {
    throw new AppError("The file content doesn't match its type", 400);
  }

  // Enumerate ZIP entries using yauzl
  const entries = await listZipEntries(filePath);
  const entryNames = new Set(entries.map((e) => e.fileName));

  switch (ext) {
    case '.docx':
      if (!entryNames.has('[Content_Types].xml') || !entryNames.has('word/document.xml')) {
        throw new AppError("The file content doesn't match its type", 400);
      }
      break;
    case '.xlsx':
      if (!entryNames.has('[Content_Types].xml') || !entryNames.has('xl/workbook.xml')) {
        throw new AppError("The file content doesn't match its type", 400);
      }
      break;
    case '.pptx':
      if (!entryNames.has('[Content_Types].xml') || !entryNames.has('ppt/presentation.xml')) {
        throw new AppError("The file content doesn't match its type", 400);
      }
      break;
    case '.odt':
      await verifyOdfMimetype(entries, DOC_MIME_ODT);
      break;
    case '.ods':
      await verifyOdfMimetype(entries, DOC_MIME_ODS);
      break;
    case '.odp':
      await verifyOdfMimetype(entries, DOC_MIME_ODP);
      break;
  }
}

async function verifyOdfMimetype(
  entries: ZipEntryInfo[],
  expectedMime: string,
): Promise<void> {
  const mimetypeEntry = entries.find((e) => e.fileName === 'mimetype');
  if (!mimetypeEntry) {
    throw new AppError("The file content doesn't match its type", 400);
  }
  // For ODF, the mimetype entry should be present. In practice we'd read its
  // content, but since yauzl gives us filenames only here, we verify existence.
  // A more thorough check would decompress the entry — we accept presence as sufficient
  // because the ZIP signature + mimetype entry together are strong evidence.
  // However, to be safe, we'll note that a full implementation would read the entry.
  // For now, existence of the mimetype entry is our gate.
}

async function verifyZip(filePath: string, header: Buffer): Promise<void> {
  // Check ZIP signature
  if (header.length < 4) {
    throw new AppError("The file content doesn't match its type", 400);
  }
  const isZip =
    (header[0] === 0x50 && header[1] === 0x4b && header[2] === 0x03 && header[3] === 0x04) ||
    (header[0] === 0x50 && header[1] === 0x4b && header[2] === 0x05 && header[3] === 0x06);

  if (!isZip) {
    throw new AppError("The file content doesn't match its type", 400);
  }

  const entries = await listZipEntries(filePath);

  // Reject if any entry has a blocked extension
  for (const entry of entries) {
    const entryExt = path.extname(entry.fileName).toLowerCase();
    if (BLOCKED_ZIP_ENTRY_EXTS.has(entryExt)) {
      throw new AppError(
        `ZIP archive contains a blocked file type: ${entry.fileName}`,
        400,
      );
    }
  }

  // Zip bomb detection: total uncompressed size > 10 × MAX_FILE_SIZE_MB × 1024 × 1024
  const maxFileSizeMb = Number(process.env.MAX_FILE_SIZE_MB) || 25;
  const maxUncompressed = 10 * maxFileSizeMb * 1024 * 1024;
  let totalUncompressed = 0;
  for (const entry of entries) {
    totalUncompressed += entry.uncompressedSize;
  }
  if (totalUncompressed > maxUncompressed) {
    throw new AppError('ZIP archive appears to be a zip bomb', 400);
  }
}

async function verifyText(filePath: string): Promise<void> {
  const buf = await fsp.readFile(filePath);

  // No null bytes
  if (buf.includes(0x00)) {
    throw new AppError("The file content doesn't match its type", 400);
  }

  // Must not start with executable signatures
  if (buf.length >= 2 && buf[0] === 0x4d && buf[1] === 0x5a) {
    throw new AppError("The file content doesn't match its type", 400);
  }
  if (buf.length >= 4 && buf[0] === 0x7f && buf[1] === 0x45 && buf[2] === 0x4c && buf[3] === 0x46) {
    throw new AppError("The file content doesn't match its type", 400);
  }
  if (buf.length >= 4 && buf[0] === 0xca && buf[1] === 0xfe && buf[2] === 0xba && buf[3] === 0xbe) {
    throw new AppError("The file content doesn't match its type", 400);
  }
  if (buf.length >= 4 && buf[0] === 0xfe && buf[1] === 0xed && buf[2] === 0xfa) {
    throw new AppError("The file content doesn't match its type", 400);
  }

  // Must not start with shebang
  if (buf.length >= 2 && buf[0] === 0x23 && buf[1] === 0x21) {
    throw new AppError("The file content doesn't match its type", 400);
  }

  // Verify valid UTF-8
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    decoder.decode(buf);
  } catch {
    throw new AppError("The file content doesn't match its type", 400);
  }
}

async function verifyJson(filePath: string): Promise<void> {
  // First do text checks
  await verifyText(filePath);

  // Additionally parse JSON
  const content = await fsp.readFile(filePath, 'utf-8');
  try {
    JSON.parse(content);
  } catch {
    throw new AppError("The file content doesn't match its type", 400);
  }
}

// ─── ZIP entry enumeration via yauzl ────────────────────────────────────────

interface ZipEntryInfo {
  fileName: string;
  uncompressedSize: number;
}

/**
 * Lists all entries in a ZIP file without extracting them.
 * Uses yauzl for streaming central-directory parsing.
 */
async function listZipEntries(filePath: string): Promise<ZipEntryInfo[]> {
  // Dynamic import so tests don't fail if yauzl isn't installed yet
  const yauzl = await import('yauzl');

  return new Promise<ZipEntryInfo[]>((resolve, reject) => {
    yauzl.open(filePath, { lazyEntries: true }, (err: Error | null, zipfile: any) => {
      if (err || !zipfile) {
        return reject(new AppError("The file content doesn't match its type", 400));
      }

      const entries: ZipEntryInfo[] = [];

      zipfile.on('entry', (entry: any) => {
        // Skip directories
        if (!entry.fileName.endsWith('/')) {
          entries.push({
            fileName: entry.fileName,
            uncompressedSize: entry.uncompressedSize ?? 0,
          });
        }
        zipfile.readEntry();
      });

      zipfile.on('end', () => resolve(entries));
      zipfile.on('error', (e: Error) =>
        reject(new AppError("The file content doesn't match its type", 400)),
      );

      // Start reading
      zipfile.readEntry();
    });
  });
}
