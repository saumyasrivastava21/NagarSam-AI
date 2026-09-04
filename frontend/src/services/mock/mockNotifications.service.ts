import { INotificationsService } from '../contracts/notifications.contract';
import { Notification } from '../../types';
import { mockStore } from './mockStore';

export class MockNotificationsService implements INotificationsService {
  async getNotifications(userId?: string): Promise<Notification[]> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const all = mockStore.getDB().notifications;
    const current = userId || mockStore.getCurrentUser().id;
    return all.filter((n) => n.userId === current || n.userId === 'USR-ALL');
  }

  async markAsRead(notificationId: string): Promise<Notification> {
    const notif = mockStore.getDB().notifications.find((n) => n.id === notificationId);
    if (!notif) throw new Error(`Notification ${notificationId} not found`);
    notif.read = true;
    return notif;
  }

  async markAllAsRead(userId?: string): Promise<void> {
    const current = userId || mockStore.getCurrentUser().id;
    mockStore.getDB().notifications.forEach((n) => {
      if (n.userId === current || n.userId === 'USR-ALL') {
        n.read = true;
      }
    });
  }
}

export const mockNotificationsService = new MockNotificationsService();
