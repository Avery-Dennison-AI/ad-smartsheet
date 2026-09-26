import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { env } from './config/env';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// server/src/paths.ts → server/ is one level up. Uploads live inside server/uploads/.
// The UPLOAD_DIR value comes from config/env.ts (single source of truth for process.env).
export const UPLOADS_DIR: string = path.isAbsolute(env.UPLOAD_DIR)
  ? env.UPLOAD_DIR
  : path.resolve(__dirname, '..', env.UPLOAD_DIR);

fs.mkdirSync(UPLOADS_DIR, { recursive: true });
console.log(`[uploads] dir: ${UPLOADS_DIR}`);
