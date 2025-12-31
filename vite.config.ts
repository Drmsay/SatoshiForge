import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  plugins: [
    nodePolyfills({
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
    }),
  ],
  define: {
    global: 'globalThis',
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        // Bundle everything into a single file
        inlineDynamicImports: true,
        manualChunks: undefined,
        // Single file output format
        format: 'iife',
        name: 'BitcoinWalletGenerator',
        // Single entry file
        entryFileNames: 'wallet-generator.js',
        assetFileNames: 'wallet-generator.[ext]',
      },
    },
    // Don't split CSS into separate files
    cssCodeSplit: false,
    // Create a single bundle
    target: 'es2015',
    minify: 'esbuild',
  },
  server: {
    port: 3000,
    open: true,
  },
});

