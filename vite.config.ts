import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  // Use base path only in production (for GitHub Pages)
  // In development, Vite serves from root
  base: mode === 'production' ? '/blackjack/' : '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Variables are imported in main.scss
      }
    }
  }
}));

