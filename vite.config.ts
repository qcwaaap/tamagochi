import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Content-Security-Policy': "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020',
      // отключаем проверки, которые приводят к генерации eval
      supported: {
        'dynamic-import': true,
        'import-meta': true,
      },
    },
  },
  build: {
    sourcemap: false, // временно отключаем source maps (они иногда юзают eval)
    minify: false,
  },
});