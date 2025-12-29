// did.store.ts
import { create } from 'zustand';
import { DID_STATUS } from '@/lib/utils/constants';

interface PublicKey {
  id: string;
  keyType: string;
  publicKey: string;
  addedAt: number;
}

interface DIDState {
  hasDID: boolean;
  status: typeof DID_STATUS[keyof typeof DID_STATUS];
  didAddress: string | null;
  publicKeys: PublicKey[];
  isInstitution: boolean;
  institutionName: string | null;
  createdAt: number | null;
  setDID: (didAddress: string, publicKeys: PublicKey[]) => void;
  setInstitution: (name: string) => void;
  setStatus: (status: typeof DID_STATUS[keyof typeof DID_STATUS]) => void;
  addPublicKey: (key: PublicKey) => void;
  removePublicKey: (keyId: string) => void;
  clearDID: () => void;
}

export const useDIDStore = create<DIDState>((set) => ({
  hasDID: false,
  status: DID_STATUS.NONE,
  didAddress: null,
  publicKeys: [],
  isInstitution: false,
  institutionName: null,
  createdAt: null,

  setDID: (didAddress, publicKeys) => {
    set({
      hasDID: true,
      didAddress,
      publicKeys,
      status: DID_STATUS.ACTIVE,
      createdAt: Date.now(),
    });
  },

  setInstitution: (name) => {
    set({
      isInstitution: true,
      institutionName: name,
    });
  },

  setStatus: (status) => {
    set({ status });
  },

  addPublicKey: (key) => {
    set((state) => ({
      publicKeys: [...state.publicKeys, key],
    }));
  },

  removePublicKey: (keyId) => {
    set((state) => ({
      publicKeys: state.publicKeys.filter(key => key.id !== keyId),
    }));
  },

  clearDID: () => {
    set({
      hasDID: false,
      status: DID_STATUS.NONE,
      didAddress: null,
      publicKeys: [],
      isInstitution: false,
      institutionName: null,
      createdAt: null,
    });
  },
}));