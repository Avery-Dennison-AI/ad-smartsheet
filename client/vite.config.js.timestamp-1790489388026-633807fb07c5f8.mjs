// vite.config.js
import { defineConfig, loadEnv } from "file:///app/data/projects/6ab6c4470002c467cfe3b0f7/client/node_modules/vite/dist/node/index.js";
import react from "file:///app/data/projects/6ab6c4470002c467cfe3b0f7/client/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
import { fileURLToPath } from "url";
var __vite_injected_original_import_meta_url = "file:///app/data/projects/6ab6c4470002c467cfe3b0f7/client/vite.config.js";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(process.cwd(), ".."));
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
        "@": fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url))
      }
    },
    server: {
      host: "0.0.0.0",
      port: 3321,
      strictPort: true,
      allowedHosts: ["6ab6c4470002c467cfe3b0f7.icod.ai"],
      watch: {
        usePolling: true,
        interval: 300
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            "react-vendor": ["react", "react-dom", "react-router-dom"],
            "utils-vendor": ["axios", "react-hot-toast"]
          }
        }
      },
      chunkSizeWarningLimit: 2500
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvYXBwL2RhdGEvcHJvamVjdHMvNmFiNmM0NDcwMDAyYzQ2N2NmZTNiMGY3L2NsaWVudFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2FwcC9kYXRhL3Byb2plY3RzLzZhYjZjNDQ3MDAwMmM0NjdjZmUzYjBmNy9jbGllbnQvdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2FwcC9kYXRhL3Byb2plY3RzLzZhYjZjNDQ3MDAwMmM0NjdjZmUzYjBmNy9jbGllbnQvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGggfSBmcm9tICd1cmwnXG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+IHtcbiAgLy8gTG9hZCBlbnZpcm9ubWVudCB2YXJpYWJsZXMgZnJvbSB0aGUgcm9vdCAuZW52IGZpbGVcbiAgY29uc3QgZW52ID0gbG9hZEVudihtb2RlLCBwYXRoLnJlc29sdmUocHJvY2Vzcy5jd2QoKSwgJy4uJykpO1xuXG4gIC8vIE1hcCBsb2FkZWQgZW52aXJvbm1lbnQgdmFyaWFibGVzIHRvIGltcG9ydC5tZXRhLmVudlxuICBjb25zdCBlbnZXaXRoSW1wb3J0TWV0YSA9IE9iamVjdC5rZXlzKGVudikucmVkdWNlKChwcmV2LCBrZXkpID0+IHtcbiAgICBwcmV2W2BpbXBvcnQubWV0YS5lbnYuJHtrZXl9YF0gPSBKU09OLnN0cmluZ2lmeShlbnZba2V5XSk7XG4gICAgcmV0dXJuIHByZXY7XG4gIH0sIHt9KTtcblxuICByZXR1cm4ge1xuICBwbHVnaW5zOiBbcmVhY3QoKV0sXG4gIGRlZmluZTogZW52V2l0aEltcG9ydE1ldGEsXG4gIC8vIE11c3QgbWF0Y2ggXCJwYXRoc1wiIGluIHRzY29uZmlnLmpzb24uIFRoaXMgZmlsZSBpcyBFU00sIHNvIHRoZXJlIGlzIG5vXG4gIC8vIF9fZGlybmFtZSBcdTIwMTQgcmVzb2x2ZSBhZ2FpbnN0IGltcG9ydC5tZXRhLnVybCByYXRoZXIgdGhhbiBwcm9jZXNzLmN3ZCgpLlxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgICdAJzogZmlsZVVSTFRvUGF0aChuZXcgVVJMKCcuL3NyYycsIGltcG9ydC5tZXRhLnVybCkpLFxuICAgIH0sXG4gIH0sXG4gIHNlcnZlcjoge1xuICAgIGhvc3Q6IFwiMC4wLjAuMFwiLFxuICAgIHBvcnQ6IDMzMjEsXG4gICAgc3RyaWN0UG9ydDogdHJ1ZSxcbiAgICBhbGxvd2VkSG9zdHM6IFtcIjZhYjZjNDQ3MDAwMmM0NjdjZmUzYjBmNy5pY29kLmFpXCJdLFxuICAgIHdhdGNoOntcbiAgICAgICAgdXNlUG9sbGluZzogdHJ1ZSxcbiAgICAgICAgaW50ZXJ2YWw6IDMwMFxuICAgIH1cbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgJ3JlYWN0LXZlbmRvcic6IFsncmVhY3QnLCAncmVhY3QtZG9tJywgJ3JlYWN0LXJvdXRlci1kb20nXSxcbiAgICAgICAgICAndXRpbHMtdmVuZG9yJzogWydheGlvcycsICdyZWFjdC1ob3QtdG9hc3QnXVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDI1MDBcbiAgfSx9O1xufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXdVLFNBQVMsY0FBYyxlQUFlO0FBQzlXLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyxxQkFBcUI7QUFIOEssSUFBTSwyQ0FBMkM7QUFLN1AsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE1BQU07QUFFeEMsUUFBTSxNQUFNLFFBQVEsTUFBTSxLQUFLLFFBQVEsUUFBUSxJQUFJLEdBQUcsSUFBSSxDQUFDO0FBRzNELFFBQU0sb0JBQW9CLE9BQU8sS0FBSyxHQUFHLEVBQUUsT0FBTyxDQUFDLE1BQU0sUUFBUTtBQUMvRCxTQUFLLG1CQUFtQixHQUFHLEVBQUUsSUFBSSxLQUFLLFVBQVUsSUFBSSxHQUFHLENBQUM7QUFDeEQsV0FBTztBQUFBLEVBQ1QsR0FBRyxDQUFDLENBQUM7QUFFTCxTQUFPO0FBQUEsSUFDUCxTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsSUFDakIsUUFBUTtBQUFBO0FBQUE7QUFBQSxJQUdSLFNBQVM7QUFBQSxNQUNQLE9BQU87QUFBQSxRQUNMLEtBQUssY0FBYyxJQUFJLElBQUksU0FBUyx3Q0FBZSxDQUFDO0FBQUEsTUFDdEQ7QUFBQSxJQUNGO0FBQUEsSUFDQSxRQUFRO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixZQUFZO0FBQUEsTUFDWixjQUFjLENBQUMsa0NBQWtDO0FBQUEsTUFDakQsT0FBTTtBQUFBLFFBQ0YsWUFBWTtBQUFBLFFBQ1osVUFBVTtBQUFBLE1BQ2Q7QUFBQSxJQUNGO0FBQUEsSUFDQSxPQUFPO0FBQUEsTUFDTCxlQUFlO0FBQUEsUUFDYixRQUFRO0FBQUEsVUFDTixjQUFjO0FBQUEsWUFDWixnQkFBZ0IsQ0FBQyxTQUFTLGFBQWEsa0JBQWtCO0FBQUEsWUFDekQsZ0JBQWdCLENBQUMsU0FBUyxpQkFBaUI7QUFBQSxVQUM3QztBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsTUFDQSx1QkFBdUI7QUFBQSxJQUN6QjtBQUFBLEVBQUU7QUFDSixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
