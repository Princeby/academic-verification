// src/store/credentialRequests.store.ts
import { create } from 'zustand';
import type { CredentialRequest, RequestStatus } from '@/types/credentialRequest.types';

interface CredentialRequestsState {
  myRequests: CredentialRequest[];
  receivedRequests: CredentialRequest[];
  loading: boolean;

  setMyRequests: (requests: CredentialRequest[]) => void;
  setReceivedRequests: (requests: CredentialRequest[]) => void;
  addRequest: (request: CredentialRequest) => void;
  updateRequest: (id: string, updates: Partial<CredentialRequest>) => void;
  removeRequest: (id: string) => void;
  setLoading: (loading: boolean) => void;

  // Helper methods
  getPendingCount: () => number;
  getRequestById: (id: string) => CredentialRequest | undefined;
  getRequestsByStatus: (status: RequestStatus) => CredentialRequest[];
}

export const useCredentialRequestsStore = create<CredentialRequestsState>((set, get) => ({
  myRequests: [],
  receivedRequests: [],
  loading: false,

  setMyRequests: (requests) => {
    set({ myRequests: requests });
  },

  setReceivedRequests: (requests) => {
    set({ receivedRequests: requests });
  },

  addRequest: (request) => {
    set((state) => ({
      myRequests: [...state.myRequests, request],
    }));
  },

  updateRequest: (id, updates) => {
    set((state) => ({
      myRequests: state.myRequests.map((req) =>
        req.id === id ? { ...req, ...updates, updatedAt: Date.now() } : req
      ),
      receivedRequests: state.receivedRequests.map((req) =>
        req.id === id ? { ...req, ...updates, updatedAt: Date.now() } : req
      ),
    }));
  },

  removeRequest: (id) => {
    set((state) => ({
      myRequests: state.myRequests.filter((req) => req.id !== id),
      receivedRequests: state.receivedRequests.filter((req) => req.id !== id),
    }));
  },

  setLoading: (loading) => {
    set({ loading });
  },

  getPendingCount: () => {
    return get().receivedRequests.filter((req) => req.status === 'pending').length;
  },

  getRequestById: (id) => {
    const state = get();
    return state.myRequests.find((req) => req.id === id) ||
           state.receivedRequests.find((req) => req.id === id);
  },

  getRequestsByStatus: (status) => {
    const state = get();
    return [...state.myRequests, ...state.receivedRequests].filter(
      (req) => req.status === status
    );
  },
}));