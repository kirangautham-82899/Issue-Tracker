import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NotificationService, Notification } from '../../services/notification.service';
import { WebSocketService } from '../../services/websocket.service';
// import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  template: `
    <div class="notification-bell" [class.has-notifications]="unreadCount > 0">
      <button 
        class="bell-button" 
        (click)="toggleDropdown()"
        [class.connected]="isConnected"
        matTooltip="Notifications"
      >
        <mat-icon>notifications</mat-icon>
        <span class="notification-badge" *ngIf="unreadCount > 0">
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
        <div class="connection-indicator" [class.connected]="isConnected"></div>
      </button>

      <div class="notification-dropdown" *ngIf="showDropdown" (clickOutside)="closeDropdown()">
        <div class="dropdown-header">
          <h3>Notifications</h3>
          <div class="header-actions">
            <button 
              class="mark-all-read" 
              (click)="markAllAsRead()" 
              *ngIf="unreadCount > 0"
              matTooltip="Mark all as read"
            >
              <mat-icon>done_all</mat-icon>
            </button>
            <button class="close-dropdown" (click)="closeDropdown()">
              <mat-icon>close</mat-icon>
            </button>
          </div>
        </div>

        <div class="connection-status" [class.connected]="isConnected">
          <mat-icon>{{ isConnected ? 'wifi' : 'wifi_off' }}</mat-icon>
          <span>{{ isConnected ? 'Live notifications active' : 'Connecting...' }}</span>
        </div>

        <div class="notifications-list" *ngIf="notifications.length > 0; else noNotifications">
          <div 
            class="notification-item" 
            *ngFor="let notification of notifications; trackBy: trackByNotificationId"
            [class.unread]="!notification.is_read"
            [class.mention]="notification.type === 'mention'"
            [class.assignment]="notification.type === 'issue_assigned'"
            [class.comment]="notification.type === 'comment_added'"
            [class.time-logged]="notification.type === 'time_logged'"
            (click)="handleNotificationClick(notification)"
          >
            <div class="notification-icon">
              <mat-icon>{{ getNotificationIcon(notification.type) }}</mat-icon>
            </div>
            <div class="notification-content">
              <div class="notification-title">{{ notification.title }}</div>
              <div class="notification-message">{{ notification.message }}</div>
              <div class="notification-time">{{ getRelativeTime(notification.created_at) }}</div>
            </div>
            <div class="notification-actions" *ngIf="!notification.is_read">
              <button 
                class="mark-read-btn" 
                (click)="markAsRead(notification.id, $event)"
                matTooltip="Mark as read"
              >
                <mat-icon>check</mat-icon>
              </button>
            </div>
          </div>
        </div>

        <ng-template #noNotifications>
          <div class="no-notifications">
            <mat-icon>notifications_none</mat-icon>
            <p>No notifications yet</p>
            <small>You'll see live updates here when they happen</small>
          </div>
        </ng-template>

        <div class="dropdown-footer" *ngIf="notifications.length > 5">
          <button class="view-all-btn" (click)="viewAllNotifications()">
            View All Notifications
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notification-bell {
      position: relative;
      display: inline-block;
    }

    .bell-button {
      position: relative;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
      color: white;
    }

    .bell-button:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: scale(1.05);
    }

    .bell-button.connected {
      border-color: rgba(16, 185, 129, 0.5);
    }

    .notification-badge {
      position: absolute;
      top: -8px;
      right: -8px;
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
      border-radius: 12px;
      padding: 2px 6px;
      font-size: 11px;
      font-weight: bold;
      min-width: 18px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      animation: pulse 2s infinite;
    }

    .connection-indicator {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #ef4444;
      transition: all 0.3s ease;
    }

    .connection-indicator.connected {
      background: #10b981;
      box-shadow: 0 0 6px rgba(16, 185, 129, 0.6);
    }

    .notification-dropdown {
      position: absolute;
      top: 60px;
      right: 0;
      width: 380px;
      max-height: 500px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      z-index: 1000;
      overflow: hidden;
      animation: dropdownSlide 0.3s ease-out;
    }

    .dropdown-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.1);
    }

    .dropdown-header h3 {
      margin: 0;
      color: #1f2937;
      font-weight: 600;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }

    .header-actions button {
      background: none;
      border: none;
      padding: 4px;
      border-radius: 6px;
      cursor: pointer;
      color: #6b7280;
      transition: all 0.2s ease;
    }

    .header-actions button:hover {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
    }

    .connection-status {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
      font-size: 0.9em;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .connection-status.connected {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
    }

    .notifications-list {
      max-height: 300px;
      overflow-y: auto;
    }

    .notification-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
    }

    .notification-item:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .notification-item.unread {
      background: rgba(59, 130, 246, 0.05);
      border-left: 3px solid #3b82f6;
    }

    .notification-item.mention {
      border-left-color: #f59e0b;
    }

    .notification-item.assignment {
      border-left-color: #10b981;
    }

    .notification-item.comment {
      border-left-color: #3b82f6;
    }

    .notification-item.time-logged {
      border-left-color: #8b5cf6;
    }

    .notification-icon {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
    }

    .notification-content {
      flex: 1;
      min-width: 0;
    }

    .notification-title {
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 4px;
      font-size: 0.9em;
    }

    .notification-message {
      color: #6b7280;
      font-size: 0.85em;
      line-height: 1.4;
      margin-bottom: 4px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .notification-time {
      color: #9ca3af;
      font-size: 0.75em;
    }

    .notification-actions {
      flex-shrink: 0;
    }

    .mark-read-btn {
      background: none;
      border: none;
      padding: 4px;
      border-radius: 4px;
      cursor: pointer;
      color: #6b7280;
      transition: all 0.2s ease;
    }

    .mark-read-btn:hover {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
    }

    .no-notifications {
      text-align: center;
      padding: 40px 20px;
      color: #6b7280;
    }

    .no-notifications mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .dropdown-footer {
      padding: 12px 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.05);
    }

    .view-all-btn {
      width: 100%;
      padding: 8px;
      background: none;
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 6px;
      color: #10b981;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .view-all-btn:hover {
      background: rgba(16, 185, 129, 0.1);
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }

    @keyframes dropdownSlide {
      from {
        opacity: 0;
        transform: translateY(-10px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
  `]
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  unreadCount = 0;
  showDropdown = false;
  isConnected = false;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private notificationService: NotificationService,
    private webSocketService: WebSocketService
    // private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Request notification permission
    this.notificationService.requestNotificationPermission();

    // Initialize notifications for current user (mock user ID for now)
    // const currentUser = this.authService.getCurrentUser();
    // if (currentUser) {
      this.notificationService.initializeForUser(1); // Mock user ID
    // }

    // Subscribe to notifications
    this.subscriptions.push(
      this.notificationService.getNotifications().subscribe(notifications => {
        this.notifications = notifications.slice(0, 10); // Show only latest 10
      })
    );

    // Subscribe to unread count
    this.subscriptions.push(
      this.notificationService.getUnreadCount().subscribe(count => {
        this.unreadCount = count;
      })
    );

    // Subscribe to connection status
    this.subscriptions.push(
      this.webSocketService.getConnectionStatus().subscribe(connected => {
        this.isConnected = connected;
      })
    );

    // Close dropdown when clicking outside
    document.addEventListener('click', this.handleDocumentClick.bind(this));
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    document.removeEventListener('click', this.handleDocumentClick.bind(this));
    this.webSocketService.disconnect();
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  closeDropdown(): void {
    this.showDropdown = false;
  }

  markAsRead(notificationId: number, event: Event): void {
    event.stopPropagation();
    this.notificationService.markAsRead(notificationId).subscribe();
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe();
  }

  handleNotificationClick(notification: Notification): void {
    // Mark as read if unread
    if (!notification.is_read) {
      this.markAsRead(notification.id, new Event('click'));
    }

    // Navigate to related issue if available
    if (notification.issue_id) {
      // You can implement navigation to issue details here
      console.log('Navigate to issue:', notification.issue_id);
    }

    this.closeDropdown();
  }

  viewAllNotifications(): void {
    // Navigate to full notifications page
    this.closeDropdown();
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'issue_assigned': return 'assignment';
      case 'comment_added': return 'comment';
      case 'mention': return 'alternate_email';
      case 'time_logged': return 'schedule';
      case 'issue_updated': return 'update';
      default: return 'notifications';
    }
  }

  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  }

  trackByNotificationId(index: number, notification: Notification): number {
    return notification.id;
  }

  private handleDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const bellElement = target.closest('.notification-bell');
    
    if (!bellElement && this.showDropdown) {
      this.closeDropdown();
    }
  }
}
