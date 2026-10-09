import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { UPLOADS_DIR } from '../../paths';
import type { IStorageDriver } from './types';

/**
 * Local disk storage driver. Stores files under UPLOADS_DIR organized by key.
 * Keys are expected to be relative paths like "<sheetId>/<uuid>.<ext>".
 */
export class LocalDiskDriver implements IStorageDriver {
  async save(key: string, stream: NodeJS.ReadableStream, _mimeType: string): Promise<void> {
    const filePath = path.join(UPLOADS_DIR, key);
    const dir = path.dirname(filePath);
    await fsp.mkdir(dir, { recursive: true });

    return new Promise<void>((resolve, reject) => {
      const writeStream = fs.createWriteStream(filePath);
      stream.pipe(writeStream);
      writeStream.on('finish', () => resolve());
      writeStream.on('error', (err) => reject(err));
      stream.on('error', (err) => {
        writeStream.destroy();
        reject(err);
      });
    });
  }

  async readStream(key: string): Promise<NodeJS.ReadableStream> {
    const filePath = path.join(UPLOADS_DIR, key);
    try {
      await fsp.access(filePath);
    } catch {
      throw new Error(`File not found: ${key}`);
    }
    return fs.createReadStream(filePath);
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(UPLOADS_DIR, key);
    try {
      await fsp.unlink(filePath);
    } catch (err: unknown) {
      // Ignore ENOENT — file already gone
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw err;
      }
    }
  }

  async exists(key: string): Promise<boolean> {
    const filePath = path.join(UPLOADS_DIR, key);
    try {
      await fsp.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
