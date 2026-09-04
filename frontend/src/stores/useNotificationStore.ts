import { create } from 'zustand';
import { Notification } from '../types';
import { notificationsService } from '../services';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: (userId?: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: (userId?: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async (userId?: string) => {
    set({ isLoading: true });
    try {
      const notifs = await notificationsService.getNotifications(userId);
      const unread = notifs.filter((n) => !n.read).length;
      set({ notifications: notifs, unreadCount: unread, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  markAsRead: async (id: string) => {
    await notificationsService.markAsRead(id);
    const updated = get().notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    set({
      notifications: updated,
      unreadCount: updated.filter((n) => !n.read).length,
    });
  },

  markAllAsRead: async (userId?: string) => {
    await notificationsService.markAllAsRead(userId);
    const updated = get().notifications.map((n) => ({ ...n, read: true }));
    set({
      notifications: updated,
      unreadCount: 0,
    });
  },
}));
