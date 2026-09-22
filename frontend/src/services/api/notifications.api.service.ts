import { apiClient } from './client';
import { INotificationsService } from '../contracts/notifications.contract';
import { Notification } from '../../types';

export class ApiNotificationsService implements INotificationsService {
  async getNotifications(userId?: string): Promise<Notification[]> {
    const params = userId ? { user_id: userId } : {};
    const res = await apiClient.get<Notification[]>('/notifications', { params });
    return res.data;
  }

  async markAsRead(notificationId: string): Promise<Notification> {
    const res = await apiClient.patch<Notification>(`/notifications/${notificationId}/read`);
    return res.data;
  }

  async markAllAsRead(userId?: string): Promise<void> {
    await apiClient.post('/notifications/mark-all-read');
  }
}
