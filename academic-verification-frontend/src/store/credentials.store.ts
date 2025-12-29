// credentials.store.ts
import { create } from 'zustand';

interface Credential {
  id: string;
  holder: string;
  issuer: string;
  credentialHash: string;
  credentialType: string;
  issuedAt: number;
  expiresAt?: number;
  revoked: boolean;
  metadata?: string;
}

interface CredentialsState {
  credentials: Credential[];
  issuedCredentials: Credential[];
  loading: boolean;
  addCredential: (credential: Credential) => void;
  removeCredential: (id: string) => void;
  setCredentials: (credentials: Credential[]) => void;
  setIssuedCredentials: (credentials: Credential[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useCredentialsStore = create<CredentialsState>((set) => ({
  credentials: [],
  issuedCredentials: [],
  loading: false,

  addCredential: (credential) => {
    set((state) => ({
      credentials: [...state.credentials, credential],
    }));
  },

  removeCredential: (id) => {
    set((state) => ({
      credentials: state.credentials.filter((c) => c.id !== id),
    }));
  },

  setCredentials: (credentials) => {
    set({ credentials });
  },

  setIssuedCredentials: (credentials) => {
    set({ issuedCredentials: credentials });
  },

  setLoading: (loading) => {
    set({ loading });
  },
}));
