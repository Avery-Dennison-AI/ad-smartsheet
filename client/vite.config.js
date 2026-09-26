import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from 'path'
import { fileURLToPath } from 'url'

export default defineConfig(({ mode }) => {
  // Load environment variables from the root .env file
  const env = loadEnv(mode, path.resolve(process.cwd(), '..'));

  // Map loaded environment variables to import.meta.env
  const envWithImportMeta = Object.keys(env).reduce((prev, key) => {
    prev[`import.meta.env.${key}`] = JSON.stringify(env[key]);
    return prev;
  }, {});

  return {
  plugins: [react()],
  define: envWithImportMeta,
  // Must match "paths" in tsconfig.json. This file is ESM, so there is no
  // __dirname — resolve against import.meta.url rather than process.cwd().
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 3321,
    strictPort: true,
    allowedHosts: ["6ab6c4470002c467cfe3b0f7.icod.ai"],
    watch:{
        usePolling: true,
        interval: 300
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'utils-vendor': ['axios', 'react-hot-toast']
        }
      }
    },
    chunkSizeWarningLimit: 2500
  },};
});
