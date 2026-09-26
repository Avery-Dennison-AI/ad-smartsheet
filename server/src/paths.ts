import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// server/src/paths.ts → server/ is one level up. Uploads live inside server/uploads/.
// Optional: set UPLOAD_DIR (absolute) to relocate the folder.
export const UPLOADS_DIR: string =
  process.env.UPLOAD_DIR || path.resolve(__dirname, '../uploads');

fs.mkdirSync(UPLOADS_DIR, { recursive: true });
console.log(`[uploads] dir: ${UPLOADS_DIR}`);
