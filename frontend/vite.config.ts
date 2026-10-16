import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const rootDir = path.resolve(__dirname, '..');

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, '');

  return {
    envDir: rootDir,
    plugins: [react(), tailwindcss()],
    server: {
      port: Number(env.FRONTEND_PORT) || 3000,
      strictPort: false,
      proxy: {
        '/api': {
          target: `http://localhost:${env.BACKEND_PORT || 4000}`,
          changeOrigin: true,
        },
      },
    },
  };
});
