import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import { IssueService } from '../../services/issue.service';
import { Issue, IssueStatus, IssuePriority, IssueFilters } from '../../models/issue.model';

@Component({
  selector: 'app-issue-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatChipsModule,
    MatTooltipModule
  ],
  template: `
    <div class="issue-list-container animate-fade-in">
      <!-- Hero Section -->
      <div class="hero-section glass animate-slide-left">
        <div class="hero-content">
          <h1 class="hero-title">
            <mat-icon class="hero-icon">dashboard</mat-icon>
            Issue Dashboard
          </h1>
          <p class="hero-subtitle">Manage and track your project issues efficiently</p>
          <div class="stats-row">
            <div class="stat-card animate-scale-in" style="animation-delay: 0.1s">
              <mat-icon>bug_report</mat-icon>
              <div class="stat-number">{{totalItems}}</div>
              <div class="stat-label">Total Issues</div>
            </div>
            <div class="stat-card animate-scale-in" style="animation-delay: 0.2s">
              <mat-icon>schedule</mat-icon>
              <div class="stat-number">{{getOpenIssuesCount()}}</div>
              <div class="stat-label">Open Issues</div>
            </div>
            <div class="stat-card animate-scale-in" style="animation-delay: 0.3s">
              <mat-icon>trending_up</mat-icon>
              <div class="stat-number">{{getInProgressCount()}}</div>
              <div class="stat-label">In Progress</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Enhanced Filters -->
      <div class="filters-section glass animate-slide-right">
        <h3 class="filters-title">
          <mat-icon>filter_list</mat-icon>
          Smart Filters
        </h3>
        <div class="filters-container">
        <mat-form-field class="search-container">
          <mat-label>Search</mat-label>
          <input matInput 
                 [(ngModel)]="filters.search" 
                 (input)="onFilterChange()"
                 placeholder="Search in title and description">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>

        <mat-form-field class="filter-field">
          <mat-label>Status</mat-label>
          <mat-select [(ngModel)]="filters.status" (selectionChange)="onFilterChange()">
            <mat-option value="">All</mat-option>
            <mat-option value="open">Open</mat-option>
            <mat-option value="in_progress">In Progress</mat-option>
            <mat-option value="closed">Closed</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field class="filter-field">
          <mat-label>Priority</mat-label>
          <mat-select [(ngModel)]="filters.priority" (selectionChange)="onFilterChange()">
            <mat-option value="">All</mat-option>
            <mat-option value="low">Low</mat-option>
            <mat-option value="medium">Medium</mat-option>
            <mat-option value="high">High</mat-option>
            <mat-option value="critical">Critical</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field class="filter-field">
          <mat-label>Assignee</mat-label>
          <input matInput 
                 [(ngModel)]="filters.assignee" 
                 (input)="onFilterChange()"
                 placeholder="Filter by assignee">
        </mat-form-field>

        <button mat-stroked-button class="clear-filters-btn" (click)="clearFilters()">
          <mat-icon>clear_all</mat-icon>
          Clear All Filters
        </button>
        </div>
      </div>

      <!-- Enhanced Table -->
      <div class="table-section glass animate-fade-in" style="animation-delay: 0.4s">
        <div class="table-header">
          <h3 class="table-title">
            <mat-icon>view_list</mat-icon>
            Issues Overview
          </h3>
          <div class="table-actions">
            <button mat-icon-button matTooltip="Refresh" (click)="loadIssues()">
              <mat-icon>refresh</mat-icon>
            </button>
            <button mat-icon-button matTooltip="Export">
              <mat-icon>download</mat-icon>
            </button>
          </div>
        </div>
        <div class="table-container">
        <table mat-table [dataSource]="issues" matSort (matSortChange)="onSortChange($event)">
          <ng-container matColumnDef="id">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>ID</th>
            <td mat-cell *matCellDef="let issue">{{issue.id}}</td>
          </ng-container>

          <ng-container matColumnDef="title">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Title</th>
            <td mat-cell *matCellDef="let issue">{{issue.title}}</td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th>
            <td mat-cell *matCellDef="let issue">
              <span class="status-badge" [ngClass]="issue.status">
                {{getStatusDisplay(issue.status)}}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="priority">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Priority</th>
            <td mat-cell *matCellDef="let issue">
              <span class="priority-badge" [ngClass]="issue.priority">
                {{getPriorityDisplay(issue.priority)}}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="assignee">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Assignee</th>
            <td mat-cell *matCellDef="let issue">{{issue.assignee || 'Unassigned'}}</td>
          </ng-container>

          <ng-container matColumnDef="updated_at">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Updated</th>
            <td mat-cell *matCellDef="let issue">{{formatDate(issue.updated_at)}}</td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let issue">
              <button mat-icon-button [routerLink]="['/issues', issue.id, 'edit']">
                <mat-icon>edit</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns; let i = index" 
              class="clickable-row animate-fade-in"
              [style.animation-delay]="(i * 0.1) + 's'"
              (click)="openIssueDetail(row)"
              (mouseenter)="onRowHover(row)"
              (mouseleave)="onRowLeave()"></tr>
        </table>

        <mat-paginator 
          [length]="totalItems"
          [pageSize]="pageSize"
          [pageIndex]="currentPage - 1"
          [pageSizeOptions]="[5, 10, 25, 50]"
          (page)="onPageChange($event)"
          showFirstLastButtons>
        </mat-paginator>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div class="loading-overlay" *ngIf="isLoading">
      <div class="loading-spinner">
        <mat-icon class="spinning">refresh</mat-icon>
        <p>Loading issues...</p>
      </div>
    </div>

    <!-- Issue Detail Modal -->
    <div class="issue-detail-overlay" *ngIf="selectedIssue" (click)="closeDrawer()">
      <div class="issue-detail-modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Issue #{{selectedIssue.id}}</h2>
          <button mat-icon-button (click)="closeDrawer()">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        
        <div class="modal-content">
          <div class="detail-field">
            <div class="label">Title</div>
            <div class="value">{{selectedIssue.title}}</div>
          </div>
          
          <div class="detail-field">
            <div class="label">Description</div>
            <div class="value">{{selectedIssue.description || 'No description'}}</div>
          </div>
          
          <div class="detail-field">
            <div class="label">Status</div>
            <div class="value">
              <span class="status-badge" [ngClass]="selectedIssue.status">
                {{getStatusDisplay(selectedIssue.status)}}
              </span>
            </div>
          </div>
          
          <div class="detail-field">
            <div class="label">Priority</div>
            <div class="value">
              <span class="priority-badge" [ngClass]="selectedIssue.priority">
                {{getPriorityDisplay(selectedIssue.priority)}}
              </span>
            </div>
          </div>
          
          <div class="detail-field">
            <div class="label">Assignee</div>
            <div class="value">{{selectedIssue.assignee || 'Unassigned'}}</div>
          </div>
          
          <div class="detail-field">
            <div class="label">Created</div>
            <div class="value">{{formatDate(selectedIssue.created_at)}}</div>
          </div>
          
          <div class="detail-field">
            <div class="label">Updated</div>
            <div class="value">{{formatDate(selectedIssue.updated_at)}}</div>
          </div>

          <div class="detail-field">
            <div class="label">Full JSON</div>
            <pre class="json-display">{{selectedIssue | json}}</pre>
          </div>
        </div>
        
        <div class="modal-actions">
          <button mat-raised-button color="primary" [routerLink]="['/issues', selectedIssue.id, 'edit']" (click)="closeDrawer()">
            <mat-icon>edit</mat-icon>
            Edit Issue
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .issue-list-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
      min-height: 100vh;
    }

    /* Hero Section */
    .hero-section {
      margin-bottom: 2rem;
      border-radius: 20px;
      padding: 2rem;
      position: relative;
      overflow: hidden;
    }

    .hero-section::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
      transform: rotate(45deg);
      animation: shimmer 3s infinite;
    }

    .hero-content {
      position: relative;
      z-index: 2;
    }

    .hero-title {
      display: flex;
      align-items: center;
      gap: 1rem;
      font-size: 2.5rem;
      font-weight: 700;
      margin: 0 0 0.5rem 0;
      background: linear-gradient(135deg, #10b981, #059669);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero-icon {
      font-size: 3rem !important;
      width: 3rem !important;
      height: 3rem !important;
      color: #10b981;
    }

    .hero-subtitle {
      font-size: 1.2rem;
      color: rgba(255, 255, 255, 0.9);
      margin-bottom: 2rem;
    }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
    }

    .stat-card {
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      border: 2px solid rgba(255, 255, 255, 0.4);
      border-radius: 15px;
      padding: 1.5rem;
      text-align: center;
      transition: all 0.3s ease;
      cursor: pointer;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    }

    .stat-card:hover {
      transform: translateY(-5px) scale(1.02);
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
      background: rgba(255, 255, 255, 0.25);
    }

    .stat-card mat-icon {
      font-size: 2.5rem;
      width: 2.5rem;
      height: 2.5rem;
      color: #10b981;
      margin-bottom: 0.5rem;
    }

    .stat-number {
      font-size: 2rem;
      font-weight: 700;
      color: white;
      margin-bottom: 0.25rem;
    }

    .stat-label {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.8);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Filters Section */
    .filters-section {
      margin-bottom: 2rem;
      border-radius: 20px;
      padding: 1.5rem;
    }

    .filters-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0 0 1rem 0;
      font-size: 1.3rem;
      font-weight: 600;
      color: white;
    }

    .filters-container {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr auto;
      gap: 1rem;
      align-items: end;
    }

    .search-container {
      grid-column: 1;
    }

    .filter-field {
      min-width: 150px;
    }

    .clear-filters-btn {
      border-radius: 25px;
      padding: 0.75rem 1.5rem;
      transition: all 0.3s ease;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .clear-filters-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    /* Table Section */
    .table-section {
      border-radius: 20px;
      overflow: hidden;
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      background: rgba(255, 255, 255, 0.1);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .table-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0;
      font-size: 1.3rem;
      font-weight: 600;
      color: white;
    }

    .table-actions {
      display: flex;
      gap: 0.5rem;
    }

    .table-actions button {
      transition: all 0.3s ease;
    }

    .table-actions button:hover {
      transform: scale(1.1);
      background: rgba(102, 126, 234, 0.1);
    }

    .table-container {
      background: rgba(255, 255, 255, 0.12);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .mat-mdc-table {
      background: transparent !important;
    }

    .mat-mdc-header-row {
      background: rgba(255, 255, 255, 0.2) !important;
      border-bottom: 2px solid rgba(255, 255, 255, 0.3) !important;
    }

    .mat-mdc-row {
      transition: all 0.3s ease;
      cursor: pointer;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
    }

    .mat-mdc-row:hover {
      background: rgba(102, 126, 234, 0.1) !important;
      transform: translateX(5px);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }

    .clickable-row {
      position: relative;
    }

    .clickable-row::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      transform: scaleY(0);
      transition: transform 0.3s ease;
    }

    .clickable-row:hover::before {
      transform: scaleY(1);
    }

    /* Loading Overlay */
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(102, 126, 234, 0.1);
      backdrop-filter: blur(5px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 2000;
    }

    .loading-spinner {
      text-align: center;
      color: white;
    }

    .loading-spinner mat-icon {
      font-size: 3rem;
      width: 3rem;
      height: 3rem;
      margin-bottom: 1rem;
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* Enhanced Modal */
    .issue-detail-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(5px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1500;
      animation: fadeIn 0.3s ease-out;
    }

    .issue-detail-modal {
      background: rgba(26, 26, 46, 0.95);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 20px;
      max-width: 700px;
      max-height: 85vh;
      width: 90%;
      overflow: hidden;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
      animation: scaleIn 0.3s ease-out;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 2rem;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    }

    .modal-header h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      background: linear-gradient(135deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .modal-content {
      padding: 2rem;
      max-height: 60vh;
      overflow-y: auto;
    }

    .detail-field {
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      transition: all 0.3s ease;
    }

    .detail-field:hover {
      background: rgba(255, 255, 255, 0.4);
      transform: translateY(-2px);
    }

    .detail-field .label {
      font-weight: 600;
      color: #667eea;
      margin-bottom: 0.5rem;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .detail-field .value {
      font-size: 1rem;
      color: white;
      line-height: 1.5;
    }

    .json-display {
      background: rgba(0, 0, 0, 0.05);
      border: 1px solid rgba(0, 0, 0, 0.1);
      padding: 1rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-family: 'Courier New', monospace;
      overflow-x: auto;
      white-space: pre-wrap;
      max-height: 250px;
      overflow-y: auto;
    }

    .modal-actions {
      padding: 2rem;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05));
      border-top: 1px solid rgba(255, 255, 255, 0.2);
    }

    .modal-actions button {
      border-radius: 25px;
      padding: 0.75rem 2rem;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .modal-actions button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
    }

    /* Responsive Design */
    @media (max-width: 1200px) {
      .filters-container {
        grid-template-columns: 1fr;
        gap: 1rem;
      }
      
      .search-container {
        grid-column: 1;
      }
    }

    @media (max-width: 768px) {
      .issue-list-container {
        padding: 1rem;
      }

      .hero-title {
        font-size: 2rem;
        flex-direction: column;
        text-align: center;
        gap: 0.5rem;
      }

      .stats-row {
        grid-template-columns: 1fr;
      }

      .filters-section,
      .table-section {
        margin: 0 -1rem 2rem -1rem;
        border-radius: 0;
      }

      .table-container {
        overflow-x: auto;
      }

      .issue-detail-modal {
        width: 95%;
        max-height: 90vh;
        margin: 1rem;
      }

      .modal-header,
      .modal-content,
      .modal-actions {
        padding: 1rem;
      }
    }

    /* Status and Priority Badges */
    .status-badge,
    .priority-badge {
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }

    .status-badge.open {
      background: linear-gradient(135deg, #e3f2fd, #bbdefb);
      color: #1976d2;
      box-shadow: 0 2px 8px rgba(25, 118, 210, 0.2);
    }

    .status-badge.in_progress {
      background: linear-gradient(135deg, #fff3e0, #ffcc02);
      color: #f57c00;
      box-shadow: 0 2px 8px rgba(245, 124, 0, 0.2);
    }

    .status-badge.closed {
      background: linear-gradient(135deg, #e8f5e8, #c8e6c9);
      color: #388e3c;
      box-shadow: 0 2px 8px rgba(56, 142, 60, 0.2);
    }

    .priority-badge.low {
      background: linear-gradient(135deg, #f3e5f5, #e1bee7);
      color: #7b1fa2;
      box-shadow: 0 2px 8px rgba(123, 31, 162, 0.2);
    }

    .priority-badge.medium {
      background: linear-gradient(135deg, #e8f5e8, #c8e6c9);
      color: #388e3c;
      box-shadow: 0 2px 8px rgba(56, 142, 60, 0.2);
    }

    .priority-badge.high {
      background: linear-gradient(135deg, #fff3e0, #ffcc02);
      color: #f57c00;
      box-shadow: 0 2px 8px rgba(245, 124, 0, 0.2);
    }

    .priority-badge.critical {
      background: linear-gradient(135deg, #ffebee, #ffcdd2);
      color: #d32f2f;
      box-shadow: 0 2px 8px rgba(211, 47, 47, 0.2);
    }
  `]
})
export class IssueListComponent implements OnInit {
  issues: Issue[] = [];
  selectedIssue: Issue | null = null;
  displayedColumns: string[] = ['id', 'title', 'status', 'priority', 'assignee', 'updated_at', 'actions'];
  
  filters: IssueFilters = {
    page: 1,
    page_size: 10,
    sort_by: 'updated_at',
    sort_order: 'desc'
  };
  
  totalItems = 0;
  currentPage = 1;
  pageSize = 10;
  isLoading = false;
  hoveredRow: Issue | null = null;
  
  private filterTimeout: any;

  constructor(private issueService: IssueService) {}

  ngOnInit() {
    this.loadIssues();
  }

  loadIssues() {
    this.isLoading = true;
    this.issueService.getIssues(this.filters).subscribe({
      next: (response) => {
        // Simulate loading delay for better UX
        setTimeout(() => {
          this.issues = response.issues;
          this.totalItems = response.total;
          this.currentPage = response.page;
          this.pageSize = response.page_size;
          this.isLoading = false;
        }, 500);
      },
      error: (error) => {
        console.error('Error loading issues:', error);
        this.isLoading = false;
      }
    });
  }

  onFilterChange() {
    // Debounce the filter changes
    clearTimeout(this.filterTimeout);
    this.filterTimeout = setTimeout(() => {
      this.filters.page = 1;
      this.currentPage = 1;
      this.loadIssues();
    }, 300);
  }

  onSortChange(sort: Sort) {
    this.filters.sort_by = sort.active;
    this.filters.sort_order = sort.direction as 'asc' | 'desc';
    this.loadIssues();
  }

  onPageChange(event: PageEvent) {
    this.filters.page = event.pageIndex + 1;
    this.filters.page_size = event.pageSize;
    this.loadIssues();
  }

  clearFilters() {
    this.filters = {
      page: 1,
      page_size: this.pageSize,
      sort_by: 'updated_at',
      sort_order: 'desc'
    };
    this.loadIssues();
  }

  openIssueDetail(issue: Issue) {
    this.selectedIssue = issue;
  }

  closeDrawer() {
    this.selectedIssue = null;
  }

  onRowHover(issue: Issue) {
    this.hoveredRow = issue;
  }

  onRowLeave() {
    this.hoveredRow = null;
  }

  getOpenIssuesCount(): number {
    return this.issues.filter(issue => issue.status === IssueStatus.OPEN).length;
  }

  getInProgressCount(): number {
    return this.issues.filter(issue => issue.status === IssueStatus.IN_PROGRESS).length;
  }

  getStatusDisplay(status: IssueStatus): string {
    switch (status) {
      case IssueStatus.OPEN: return 'Open';
      case IssueStatus.IN_PROGRESS: return 'In Progress';
      case IssueStatus.CLOSED: return 'Closed';
      default: return status;
    }
  }

  getPriorityDisplay(priority: IssuePriority): string {
    switch (priority) {
      case IssuePriority.LOW: return 'Low';
      case IssuePriority.MEDIUM: return 'Medium';
      case IssuePriority.HIGH: return 'High';
      case IssuePriority.CRITICAL: return 'Critical';
      default: return priority;
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
