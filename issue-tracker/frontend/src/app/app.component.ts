import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { IssueService } from './services/issue.service';
import { NotificationBellComponent } from './components/notification-bell/notification-bell.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    CommonModule,
    NotificationBellComponent
  ],
  template: `
    <div class="app-header glass animate-fade-in">
      <div class="header-actions">
        <div class="connection-status" [class.connected]="isBackendConnected" [class.disconnected]="!isBackendConnected">
          <mat-icon>{{ isBackendConnected ? 'wifi' : 'wifi_off' }}</mat-icon>
          <span>{{ isBackendConnected ? 'Connected' : 'Disconnected' }}</span>
        </div>
        <app-notification-bell></app-notification-bell>
        <button mat-icon-button class="profile-btn">
          <mat-icon>account_circle</mat-icon>
        </button>
      </div>
      <div class="header-content">
        <div class="logo-section animate-slide-left">
          <mat-icon class="logo-icon">bug_report</mat-icon>
          <h1 class="app-title">Issue Tracker</h1>
          <span class="app-subtitle">Professional Issue Management</span>
        </div>
        
        <nav class="nav-section animate-slide-right">
          <button mat-flat-button 
                  class="nav-button" 
                  routerLink="/issues"
                  routerLinkActive="active">
            <mat-icon>dashboard</mat-icon>
            <span>Dashboard</span>
          </button>
          <button mat-flat-button 
                  class="nav-button create-button" 
                  routerLink="/issues/new">
            <mat-icon>add_circle</mat-icon>
            <span>Create Issue</span>
          </button>
        </nav>
      </div>
    </div>
    
    <main class="main-content">
      <router-outlet></router-outlet>
    </main>
    
    <!-- Floating Action Button -->
    <button mat-fab 
            class="fab animate-scale-in" 
            routerLink="/issues/new"
            matTooltip="Create New Issue"
            matTooltipPosition="left">
      <mat-icon>add</mat-icon>
    </button>
  `,
  styles: [`
    .app-header {
      position: sticky;
      top: 0;
      z-index: 100;
      padding: 1rem 2rem;
      margin-bottom: 2rem;
      border-radius: 0 0 20px 20px;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1200px;
      margin: 0 auto;
    }

    .logo-section {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .logo-icon {
      font-size: 2.5rem;
      width: 2.5rem;
      height: 2.5rem;
      color: #10b981;
      animation: pulse 2s infinite;
    }

    .app-title {
      margin: 0;
      font-size: 1.8rem;
      font-weight: 700;
      background: linear-gradient(135deg, #10b981, #059669);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .app-subtitle {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.8);
      font-weight: 400;
    }

    .nav-section {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .nav-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border-radius: 25px;
      transition: all 0.3s ease;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .nav-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      background: rgba(255, 255, 255, 0.2);
    }

    .nav-button.active {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
    }

    .create-button {
      background: linear-gradient(135deg, #10b981, #059669) !important;
      color: white !important;
    }

    .create-button:hover {
      background: linear-gradient(135deg, #059669, #047857) !important;
    }

    .main-content {
      min-height: calc(100vh - 200px);
      padding: 0 2rem;
    }

    .fab {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
      transition: all 0.3s ease;
      z-index: 1000;
    }

    .fab:hover {
      transform: scale(1.1) rotate(90deg);
      box-shadow: 0 12px 35px rgba(16, 185, 129, 0.6);
    }

    .connection-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 500;
      transition: all 0.3s ease;
      margin-right: 1rem;
    }

    .connection-status.connected {
      background: rgba(16, 185, 129, 0.2);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .connection-status.disconnected {
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .connection-status mat-icon {
      font-size: 1.2rem;
      width: 1.2rem;
      height: 1.2rem;
    }

    @media (max-width: 768px) {
      .app-header {
        padding: 1rem;
      }
      
      .header-content {
        flex-direction: column;
        gap: 1rem;
      }
      
      .logo-section {
        flex-direction: column;
        text-align: center;
        gap: 0.5rem;
      }
      
      .app-subtitle {
        display: none;
      }
      
      .nav-section {
        width: 100%;
        justify-content: center;
      }
      
      .main-content {
        padding: 0 1rem;
      }
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'Issue Tracker';
  isBackendConnected = false;

  constructor(private issueService: IssueService) {}

  ngOnInit(): void {
    this.checkBackendConnection();
    // Check connection every 30 seconds
    setInterval(() => this.checkBackendConnection(), 30000);
  }

  private checkBackendConnection(): void {
    this.issueService.checkHealth().subscribe({
      next: (response) => {
        this.isBackendConnected = true;
        console.log('Backend connected:', response);
      },
      error: (error) => {
        this.isBackendConnected = false;
        console.log('Backend disconnected:', error);
      }
    });
  }
}
