// src/lib/utils/env.ts
/**
 * Environment configuration helper
 */

export const ENV = {
    // Blockchain
    WS_PROVIDER: import.meta.env.VITE_WS_PROVIDER || 'ws://127.0.0.1:9944',
    CHAIN_NAME: import.meta.env.VITE_CHAIN_NAME || 'Academic Verification Chain',
    TOKEN_SYMBOL: import.meta.env.VITE_TOKEN_SYMBOL || 'AVC',
    TOKEN_DECIMALS: parseInt(import.meta.env.VITE_TOKEN_DECIMALS || '12'),
  
    // App
    APP_NAME: import.meta.env.VITE_APP_NAME || 'Academic Verify',
    APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  
    // Features
    ENABLE_DEMO_MODE: import.meta.env.VITE_ENABLE_DEMO_MODE === 'true',
    DEMO_CREDENTIALS: import.meta.env.VITE_DEMO_CREDENTIALS === 'true',
  
    // Development
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
    
    // Testnet endpoints (for future use)
    TESTNET_WS: import.meta.env.VITE_TESTNET_WS || '',
    TESTNET_EXPLORER: import.meta.env.VITE_TESTNET_EXPLORER || '',
  } as const;
  
  // Validate required environment variables
  export function validateEnv() {
    const required = ['WS_PROVIDER'];
    const missing = required.filter(key => !ENV[key as keyof typeof ENV]);
  
    if (missing.length > 0) {
      console.warn('Missing environment variables:', missing);
    }
  
    return missing.length === 0;
  }
  
  // Export typed env for use in app
  export type AppEnv = typeof ENV;