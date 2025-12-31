import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    nodePolyfills({
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
      // Whether to polyfill specific globals.
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    })
  ],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Fix bn.js default export issue
      'bn.js': path.resolve(__dirname, './node_modules/bn.js/lib/bn.js'),
    },
  },
  
  optimizeDeps: {
    include: [
      'bn.js',
      '@polkadot/util',
      '@polkadot/util-crypto',
    ],
    // Exclude Polkadot packages from pre-bundling to avoid issues
    exclude: [
      '@polkadot/api',
      '@polkadot/extension-dapp',
      '@polkadot/keyring',
      '@polkadot/types',
      '@polkadot/rpc-provider',
    ],
    esbuildOptions: {
      target: 'esnext',
      supported: {
        bigint: true,
      },
      // Handle Node.js built-ins
      define: {
        global: 'globalThis',
      },
    },
  },
  
  build: {
    target: 'esnext',
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'polkadot-core': ['@polkadot/api', '@polkadot/util', '@polkadot/util-crypto'],
        },
      },
    },
  },
  
  // Define global variables for browser compatibility
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  
  server: {
    port: 5174,
    strictPort: false,
  },
})