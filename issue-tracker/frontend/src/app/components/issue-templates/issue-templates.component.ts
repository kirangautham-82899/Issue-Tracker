import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface IssueTemplate {
  id: number;
  name: string;
  title_template: string;
  description_template: string;
  default_priority: string;
  default_assignee_id?: number;
  created_by: number;
  creator: any;
  is_active: boolean;
  created_at: string;
}

export interface IssueTemplateResponse {
  templates: IssueTemplate[];
  total: number;
}

@Component({
  selector: 'app-issue-templates',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  template: `
    <div class="templates-container">
      <!-- Templates Header -->
      <div class="templates-header">
        <h2>
          <mat-icon>description</mat-icon>
          Issue Templates
        </h2>
        <button 
          mat-raised-button 
          color="primary" 
          (click)="openCreateDialog()"
          class="create-template-btn"
        >
          <mat-icon>add</mat-icon>
          Create Template
        </button>
      </div>

      <!-- Templates Grid -->
      <div class="templates-grid" *ngIf="templates.length > 0; else noTemplates">
        <div 
          class="template-card glass" 
          *ngFor="let template of templates; trackBy: trackByTemplateId"
          [class.inactive]="!template.is_active"
        >
          <div class="template-header">
            <div class="template-info">
              <h3 class="template-name">{{ template.name }}</h3>
              <div class="template-meta">
                <span class="priority-badge" [class]="'priority-' + template.default_priority">
                  {{ template.default_priority | titlecase }}
                </span>
                <span class="created-by">by {{ template.creator?.full_name || 'Unknown' }}</span>
              </div>
            </div>
            <div class="template-actions">
              <button 
                mat-icon-button 
                (click)="useTemplate(template)"
                matTooltip="Use this template"
                class="use-btn"
              >
                <mat-icon>play_arrow</mat-icon>
              </button>
              <button 
                mat-icon-button 
                (click)="editTemplate(template)"
                matTooltip="Edit template"
                class="edit-btn"
              >
                <mat-icon>edit</mat-icon>
              </button>
              <button 
                mat-icon-button 
                (click)="toggleTemplate(template)"
                [matTooltip]="template.is_active ? 'Deactivate template' : 'Activate template'"
                [class]="template.is_active ? 'deactivate-btn' : 'activate-btn'"
              >
                <mat-icon>{{ template.is_active ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <button 
                mat-icon-button 
                (click)="deleteTemplate(template)"
                matTooltip="Delete template"
                class="delete-btn"
              >
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </div>

          <div class="template-content">
            <div class="template-title">
              <strong>Title:</strong> {{ template.title_template }}
            </div>
            <div class="template-description">
              <strong>Description:</strong>
              <div class="description-preview">{{ getDescriptionPreview(template.description_template) }}</div>
            </div>
          </div>

          <div class="template-footer">
            <div class="template-date">
              Created {{ formatDate(template.created_at) }}
            </div>
            <div class="template-status" [class.active]="template.is_active">
              {{ template.is_active ? 'Active' : 'Inactive' }}
            </div>
          </div>
        </div>
      </div>

      <ng-template #noTemplates>
        <div class="empty-state glass">
          <mat-icon>description</mat-icon>
          <h3>No templates yet</h3>
          <p>Create your first issue template to streamline issue creation</p>
          <button 
            mat-raised-button 
            color="primary" 
            (click)="openCreateDialog()"
          >
            <mat-icon>add</mat-icon>
            Create First Template
          </button>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .templates-container {
      padding: 20px;
    }

    .templates-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .templates-header h2 {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;
      color: white;
      font-weight: 600;
    }

    .create-template-btn {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      font-weight: 600;
    }

    .templates-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 20px;
    }

    .template-card {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 16px;
      padding: 20px;
      transition: all 0.3s ease;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    }

    .template-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 35px rgba(0, 0, 0, 0.4);
      border-color: rgba(16, 185, 129, 0.5);
    }

    .template-card.inactive {
      opacity: 0.6;
      border-color: rgba(255, 255, 255, 0.2);
    }

    .template-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .template-info {
      flex: 1;
      min-width: 0;
    }

    .template-name {
      margin: 0 0 8px 0;
      color: white;
      font-size: 1.2em;
      font-weight: 600;
    }

    .template-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .priority-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.75em;
      font-weight: bold;
      text-transform: uppercase;
    }

    .priority-low {
      background: rgba(34, 197, 94, 0.2);
      color: #22c55e;
      border: 1px solid rgba(34, 197, 94, 0.3);
    }

    .priority-medium {
      background: rgba(245, 158, 11, 0.2);
      color: #f59e0b;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }

    .priority-high {
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .priority-critical {
      background: rgba(147, 51, 234, 0.2);
      color: #9333ea;
      border: 1px solid rgba(147, 51, 234, 0.3);
    }

    .created-by {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.85em;
    }

    .template-actions {
      display: flex;
      gap: 4px;
      flex-shrink: 0;
    }

    .template-actions button {
      width: 36px;
      height: 36px;
      border-radius: 8px;
    }

    .use-btn {
      color: #10b981;
    }

    .edit-btn {
      color: #3b82f6;
    }

    .activate-btn {
      color: #10b981;
    }

    .deactivate-btn {
      color: #f59e0b;
    }

    .delete-btn {
      color: #ef4444;
    }

    .template-actions button:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .template-content {
      margin-bottom: 16px;
    }

    .template-title,
    .template-description {
      margin-bottom: 12px;
      color: white;
      font-size: 0.9em;
    }

    .template-title strong,
    .template-description strong {
      color: rgba(255, 255, 255, 0.8);
      display: block;
      margin-bottom: 4px;
    }

    .description-preview {
      background: rgba(255, 255, 255, 0.1);
      padding: 8px 12px;
      border-radius: 6px;
      border-left: 3px solid rgba(16, 185, 129, 0.5);
      font-family: 'Courier New', monospace;
      font-size: 0.85em;
      line-height: 1.4;
      max-height: 80px;
      overflow: hidden;
      position: relative;
    }

    .description-preview::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 20px;
      background: linear-gradient(transparent, rgba(255, 255, 255, 0.1));
    }

    .template-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.2);
      font-size: 0.8em;
    }

    .template-date {
      color: rgba(255, 255, 255, 0.6);
    }

    .template-status {
      padding: 4px 8px;
      border-radius: 12px;
      font-weight: bold;
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .template-status.active {
      background: rgba(34, 197, 94, 0.2);
      color: #22c55e;
      border: 1px solid rgba(34, 197, 94, 0.3);
    }

    .empty-state {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 16px;
      padding: 60px 40px;
      text-align: center;
      color: rgba(255, 255, 255, 0.8);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    }

    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 20px;
      opacity: 0.6;
    }

    .empty-state h3 {
      margin: 20px 0 12px 0;
      color: white;
      font-weight: 600;
    }

    .empty-state p {
      margin-bottom: 24px;
      line-height: 1.5;
    }

    @media (max-width: 768px) {
      .templates-grid {
        grid-template-columns: 1fr;
      }
      
      .templates-header {
        flex-direction: column;
        align-items: stretch;
        gap: 16px;
      }
      
      .template-header {
        flex-direction: column;
        gap: 12px;
      }
      
      .template-actions {
        align-self: flex-end;
      }
    }
  `]
})
export class IssueTemplatesComponent implements OnInit {
  @Output() templateSelected = new EventEmitter<IssueTemplate>();
  
  templates: IssueTemplate[] = [];
  isLoading = false;
  
  private apiUrl = 'http://localhost:8000';

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadTemplates();
  }

  loadTemplates(): void {
    this.isLoading = true;
    
    this.http.get<IssueTemplateResponse>(`${this.apiUrl}/templates`).subscribe({
      next: (response) => {
        this.templates = response.templates;
      },
      error: (error) => {
        console.error('Error loading templates:', error);
        this.snackBar.open('Failed to load templates.', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  openCreateDialog(): void {
    // TODO: Open create template dialog
    console.log('Open create template dialog');
  }

  useTemplate(template: IssueTemplate): void {
    this.templateSelected.emit(template);
    this.snackBar.open(`Template "${template.name}" applied!`, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  editTemplate(template: IssueTemplate): void {
    // TODO: Open edit template dialog
    console.log('Edit template:', template);
  }

  toggleTemplate(template: IssueTemplate): void {
    const newStatus = !template.is_active;
    const updateData = { is_active: newStatus };
    
    this.http.put<IssueTemplate>(`${this.apiUrl}/templates/${template.id}`, updateData).subscribe({
      next: (updatedTemplate) => {
        const index = this.templates.findIndex(t => t.id === template.id);
        if (index !== -1) {
          this.templates[index] = updatedTemplate;
        }
        this.snackBar.open(
          `Template ${newStatus ? 'activated' : 'deactivated'} successfully!`, 
          'Close', 
          {
            duration: 3000,
            panelClass: ['success-snackbar']
          }
        );
      },
      error: (error) => {
        console.error('Error toggling template:', error);
        this.snackBar.open('Failed to update template status.', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  deleteTemplate(template: IssueTemplate): void {
    if (confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
      this.http.delete(`${this.apiUrl}/templates/${template.id}`).subscribe({
        next: () => {
          this.templates = this.templates.filter(t => t.id !== template.id);
          this.snackBar.open('Template deleted successfully!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        },
        error: (error) => {
          console.error('Error deleting template:', error);
          this.snackBar.open('Failed to delete template.', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  getDescriptionPreview(description: string): string {
    return description.length > 150 ? description.substring(0, 150) + '...' : description;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  trackByTemplateId(index: number, template: IssueTemplate): number {
    return template.id;
  }
}
