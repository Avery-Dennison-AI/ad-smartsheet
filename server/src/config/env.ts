import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from project root before reading any variables.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

interface Env {
  MONGO_URI: string;
  JWT_SECRET: string;
  PORT: number;
  NODE_ENV: string;
  ADMIN_EMAIL: string | undefined;
  ADMIN_PASSWORD: string | undefined;
  ADMIN_NAME: string | undefined;
  VITE_API_URL: string | undefined;
  UPLOAD_DIR: string;
}

function loadEnv(): Env {
  const jwtSecret = process.env.JWT_SECRET ?? '';

  if (!jwtSecret || jwtSecret.length < 32) {
    console.error(
      '[STARTUP] JWT_SECRET is missing or shorter than 32 characters. Server cannot start securely.',
    );
    process.exit(1);
  }

  return {
    MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/my_db',
    JWT_SECRET: jwtSecret,
    PORT: Number(process.env.PORT) || 5000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    ADMIN_NAME: process.env.ADMIN_NAME,
    VITE_API_URL: process.env.VITE_API_URL,
    UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  };
}

export const env: Env = loadEnv();
