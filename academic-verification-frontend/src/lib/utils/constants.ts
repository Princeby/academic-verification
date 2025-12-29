// constants.ts - Application constants
export const APP_NAME = 'Academic Verify';
export const APP_VERSION = '1.0.0';

// Blockchain constants
export const CHAIN_CONFIG = {
  WS_PROVIDER: 'ws://127.0.0.1:9944', // Local node
  // WS_PROVIDER: 'wss://your-parachain.example.com', // Production
  CHAIN_NAME: 'Academic Verification Chain',
  DECIMALS: 12,
  TOKEN_SYMBOL: 'AVC',
};

// Transaction status
export const TX_STATUS = {
  IDLE: 'idle',
  SIGNING: 'signing',
  SUBMITTING: 'submitting',
  IN_BLOCK: 'inBlock',
  FINALIZED: 'finalized',
  ERROR: 'error',
} as const;

// DID status
export const DID_STATUS = {
  NONE: 'none',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
} as const;

// Credential status
export const CREDENTIAL_STATUS = {
  ACTIVE: 'active',
  REVOKED: 'revoked',
  EXPIRED: 'expired',
} as const;

// Credential types
export const CREDENTIAL_TYPES = [
  'Bachelor\'s Degree',
  'Master\'s Degree',
  'Doctorate (PhD)',
  'Certificate',
  'Transcript',
  'Professional Certification',
  'Other',
] as const;

// Institution types
export const INSTITUTION_TYPES = [
  'University',
  'College',
  'Training Center',
  'Vocational School',
  'Online Academy',
  'Other',
] as const;

// Endorsement types
export const ENDORSEMENT_TYPES = [
  'Professional',
  'Academic',
  'Research',
  'Teaching',
  'Innovation',
] as const;

// Reputation score thresholds
export const REPUTATION_THRESHOLDS = {
  NEW: 0,
  ESTABLISHED: 201,
  REPUTABLE: 501,
  EXCELLENT: 751,
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  CREDENTIALS: 'av_credentials',
  PREFERENCES: 'av_preferences',
  CACHED_DIDS: 'av_cached_dids',
  THEME: 'av_theme',
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 50,
} as const;

// File upload
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ACCEPTED_TYPES: ['application/pdf', 'image/png', 'image/jpeg'],
} as const;