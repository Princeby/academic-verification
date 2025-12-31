// src/store/notifications.store.ts
import { create } from 'zustand';

export type NotificationType = 
  | 'request_received'
  | 'request_approved'
  | 'request_rejected'
  | 'credential_issued'
  | 'credential_revoked'
  | 'endorsement_received'
  | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: number;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  getUnreadCount: () => number;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      read: false,
      createdAt: Date.now(),
    };

    set((state) => ({
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  removeNotification: (id) => {
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id);
      const wasUnread = notification && !notification.read;
      
      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      };
    });
  },

  clearAll: () => {
    set({ notifications: [], unreadCount: 0 });
  },

  getUnreadCount: () => {
    return get().unreadCount;
  },
}));

// Helper function to create notifications for common events
export const createNotification = {
  requestReceived: (requesterName: string, programName: string) => ({
    type: 'request_received' as const,
    title: 'New Credential Request',
    message: `${requesterName} has requested a credential for ${programName}`,
    actionUrl: '/institution/requests',
  }),

  requestApproved: (institutionName: string, programName: string) => ({
    type: 'request_approved' as const,
    title: 'Request Approved',
    message: `${institutionName} approved your request for ${programName}`,
    actionUrl: '/my-requests',
  }),

  requestRejected: (institutionName: string, programName: string) => ({
    type: 'request_rejected' as const,
    title: 'Request Rejected',
    message: `${institutionName} rejected your request for ${programName}`,
    actionUrl: '/my-requests',
  }),

  credentialIssued: (institutionName: string, credentialType: string) => ({
    type: 'credential_issued' as const,
    title: 'Credential Issued',
    message: `${institutionName} issued your ${credentialType}`,
    actionUrl: '/credentials',
  }),

  credentialRevoked: (institutionName: string, credentialType: string) => ({
    type: 'credential_revoked' as const,
    title: 'Credential Revoked',
    message: `Your ${credentialType} from ${institutionName} has been revoked`,
    actionUrl: '/credentials',
  }),

  endorsementReceived: (endorserName: string) => ({
    type: 'endorsement_received' as const,
    title: 'New Endorsement',
    message: `${endorserName} endorsed your institution`,
    actionUrl: '/institution',
  }),
};