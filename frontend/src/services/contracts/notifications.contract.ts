import { Notification } from '../../types';

export interface INotificationsService {
  getNotifications(userId?: string): Promise<Notification[]>;
  markAsRead(notificationId: string): Promise<Notification>;
  markAllAsRead(userId?: string): Promise<void>;
}
