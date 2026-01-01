import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { copyWasmFiles } from './vite-plugin-copy-wasm';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
    copyWasmFiles(),
  ],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress warnings about modules being externalized for browser compatibility
        if (warning.message.includes('has been externalized for browser compatibility')) {
          return;
        }
        warn(warning);
      },
    },
  },
  customLogger: {
    warn(msg) {
      // Suppress warnings about modules being externalized for browser compatibility
      if (msg.includes('has been externalized for browser compatibility')) {
        return;
      }
      // Use default console.warn for other warnings
      console.warn(msg);
    },
    info(msg) {
      // Suppress info messages about modules being externalized
      if (msg.includes('has been externalized for browser compatibility')) {
        return;
      }
      console.info(msg);
    },
    error(msg) {
      console.error(msg);
    },
  },
});
