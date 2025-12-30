import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  optimizeDeps: {
    // Exclude Polkadot packages from pre-bundling
    exclude: [
      '@polkadot/api',
      '@polkadot/extension-dapp',
      '@polkadot/util',
      '@polkadot/util-crypto',
      '@polkadot/keyring',
      '@polkadot/types',
      '@polkadot/rpc-provider',
    ],
    esbuildOptions: {
      target: 'esnext',
      supported: {
        bigint: true,
      },
    },
  },
  
  build: {
    target: 'esnext',
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  
  // Define global variables
  define: {
    global: 'globalThis',
  },
})