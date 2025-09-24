import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { WebSocketService, NotificationMessage } from './websocket.service';

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  user_id: number;
  issue_id?: number;
  is_read: boolean;
  created_at: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  total: number;
  unread_count: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = 'http://localhost:8003';
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);

  constructor(
    private http: HttpClient,
    private webSocketService: WebSocketService
  ) {
    // Listen to WebSocket messages (with error handling)
    this.webSocketService.getMessages().subscribe({
      next: (message: NotificationMessage) => {
        this.handleRealtimeNotification(message);
        this.showToastNotification(message);
      },
      error: (error) => {
        console.log('WebSocket message error (expected in mock mode):', error);
      }
    });
  }

  initializeForUser(userId: number): void {
    this.webSocketService.connect(userId);
    this.loadNotifications();
  }

  loadNotifications(): Observable<NotificationResponse> {
    const request = this.http.get<NotificationResponse>(`${this.apiUrl}/notifications`);
    request.subscribe(response => {
      this.notificationsSubject.next(response.notifications);
      this.unreadCountSubject.next(response.unread_count);
    });
    return request;
  }

  markAsRead(notificationId: number): Observable<Notification> {
    const request = this.http.put<Notification>(`${this.apiUrl}/notifications/${notificationId}/read`, {});
    request.subscribe(() => {
      this.updateNotificationReadStatus(notificationId);
    });
    return request;
  }

  markAllAsRead(): Observable<any> {
    const request = this.http.put(`${this.apiUrl}/notifications/read-all`, {});
    request.subscribe(() => {
      const notifications = this.notificationsSubject.value.map(n => ({ ...n, is_read: true }));
      this.notificationsSubject.next(notifications);
      this.unreadCountSubject.next(0);
    });
    return request;
  }

  getNotifications(): Observable<Notification[]> {
    return this.notificationsSubject.asObservable();
  }

  getUnreadCount(): Observable<number> {
    return this.unreadCountSubject.asObservable();
  }

  private handleRealtimeNotification(message: NotificationMessage): void {
    // Create a notification object from the WebSocket message
    const notification: Notification = {
      id: Date.now(), // Temporary ID for real-time notifications
      type: message.type,
      title: message.title,
      message: message.message,
      user_id: 0, // Will be set by backend
      issue_id: message.issue_id,
      is_read: false,
      created_at: message.timestamp
    };

    // Add to the beginning of the notifications list
    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([notification, ...currentNotifications]);
    
    // Increment unread count
    const currentUnread = this.unreadCountSubject.value;
    this.unreadCountSubject.next(currentUnread + 1);
  }

  private updateNotificationReadStatus(notificationId: number): void {
    const notifications = this.notificationsSubject.value.map(n => 
      n.id === notificationId ? { ...n, is_read: true } : n
    );
    this.notificationsSubject.next(notifications);
    
    const unreadCount = notifications.filter(n => !n.is_read).length;
    this.unreadCountSubject.next(unreadCount);
  }

  private showToastNotification(message: NotificationMessage): void {
    // Create a toast notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(message.title, {
        body: message.message,
        icon: '/assets/icons/notification-icon.png',
        badge: '/assets/icons/badge-icon.png'
      });
    }

    // Also show in-app toast
    this.showInAppToast(message);
  }

  private showInAppToast(message: NotificationMessage): void {
    // Create a temporary toast element
    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    toast.innerHTML = `
      <div class="toast-content">
        <div class="toast-title">${message.title}</div>
        <div class="toast-message">${message.message}</div>
      </div>
    `;

    // Add styles
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(16, 185, 129, 0.95);
      color: white;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      max-width: 300px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      animation: slideInRight 0.3s ease-out;
    `;

    // Add animation styles to document if not already added
    if (!document.getElementById('toast-styles')) {
      const style = document.createElement('style');
      style.id = 'toast-styles';
      style.textContent = `
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .toast-title { font-weight: bold; margin-bottom: 4px; }
        .toast-message { font-size: 0.9em; opacity: 0.9; }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(toast);

    // Remove after 5 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => {
          toast.remove();
        }, 300);
      }
    }, 5000);
  }

  requestNotificationPermission(): void {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
}
