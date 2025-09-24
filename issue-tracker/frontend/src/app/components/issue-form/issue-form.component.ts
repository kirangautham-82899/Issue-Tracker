import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TextFieldModule } from '@angular/cdk/text-field';

import { IssueService } from '../../services/issue.service';
import { Issue, IssueCreate, IssueUpdate, IssueStatus, IssuePriority } from '../../models/issue.model';

@Component({
  selector: 'app-issue-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSnackBarModule,
    TextFieldModule
  ],
  template: `
    <div class="form-container animate-fade-in">
      <div class="form-card glass animate-scale-in">
        <div class="form-header">
          <div class="header-content">
            <mat-icon class="header-icon">{{isEditMode ? 'edit' : 'add_circle'}}</mat-icon>
            <div class="header-text">
              <h1 class="form-title">{{isEditMode ? 'Edit Issue' : 'Create New Issue'}}</h1>
              <p class="form-subtitle">{{isEditMode ? 'Update issue details' : 'Fill in the details to create a new issue'}}</p>
            </div>
          </div>
        </div>
        
        <div class="form-content">
          <form [formGroup]="issueForm" (ngSubmit)="onSubmit()" class="issue-form">
            <div class="form-field-wrapper animate-slide-left" style="animation-delay: 0.1s">
              <mat-form-field class="form-field" appearance="outline">
                <mat-label>Issue Title</mat-label>
                <input matInput formControlName="title" placeholder="Enter a descriptive title" required>
                <mat-icon matSuffix>title</mat-icon>
                <mat-error *ngIf="issueForm.get('title')?.hasError('required')">
                  Title is required
                </mat-error>
                <mat-error *ngIf="issueForm.get('title')?.hasError('maxlength')">
                  Title cannot exceed 200 characters
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-field-wrapper animate-slide-right" style="animation-delay: 0.2s">
              <mat-form-field class="form-field" appearance="outline">
                <mat-label>Description</mat-label>
                <textarea matInput 
                          formControlName="description" 
                          placeholder="Describe the issue in detail"
                          rows="4"
                          cdkTextareaAutosize
                          cdkAutosizeMinRows="3"
                          cdkAutosizeMaxRows="8">
                </textarea>
                <mat-icon matSuffix>description</mat-icon>
              </mat-form-field>
            </div>

            <div class="form-row">
              <div class="form-field-wrapper animate-slide-left" style="animation-delay: 0.3s">
                <mat-form-field class="form-field" appearance="outline">
                  <mat-label>Status</mat-label>
                  <mat-select formControlName="status" required>
                    <mat-option value="open">
                      <span class="option-content">
                        <mat-icon class="option-icon status-open">radio_button_unchecked</mat-icon>
                        Open
                      </span>
                    </mat-option>
                    <mat-option value="in_progress">
                      <span class="option-content">
                        <mat-icon class="option-icon status-progress">schedule</mat-icon>
                        In Progress
                      </span>
                    </mat-option>
                    <mat-option value="closed">
                      <span class="option-content">
                        <mat-icon class="option-icon status-closed">check_circle</mat-icon>
                        Closed
                      </span>
                    </mat-option>
                  </mat-select>
                  <mat-icon matSuffix>flag</mat-icon>
                  <mat-error *ngIf="issueForm.get('status')?.hasError('required')">
                    Status is required
                  </mat-error>
                </mat-form-field>
              </div>

              <div class="form-field-wrapper animate-slide-right" style="animation-delay: 0.4s">
                <mat-form-field class="form-field" appearance="outline">
                  <mat-label>Priority</mat-label>
                  <mat-select formControlName="priority" required>
                    <mat-option value="low">
                      <span class="option-content">
                        <mat-icon class="option-icon priority-low">keyboard_arrow_down</mat-icon>
                        Low
                      </span>
                    </mat-option>
                    <mat-option value="medium">
                      <span class="option-content">
                        <mat-icon class="option-icon priority-medium">remove</mat-icon>
                        Medium
                      </span>
                    </mat-option>
                    <mat-option value="high">
                      <span class="option-content">
                        <mat-icon class="option-icon priority-high">keyboard_arrow_up</mat-icon>
                        High
                      </span>
                    </mat-option>
                    <mat-option value="critical">
                      <span class="option-content">
                        <mat-icon class="option-icon priority-critical">priority_high</mat-icon>
                        Critical
                      </span>
                    </mat-option>
                  </mat-select>
                  <mat-icon matSuffix>priority_high</mat-icon>
                  <mat-error *ngIf="issueForm.get('priority')?.hasError('required')">
                    Priority is required
                  </mat-error>
                </mat-form-field>
              </div>
            </div>

            <div class="form-field-wrapper animate-slide-left" style="animation-delay: 0.5s">
              <mat-form-field class="form-field" appearance="outline">
                <mat-label>Assignee</mat-label>
                <input matInput 
                       formControlName="assignee" 
                       placeholder="Enter assignee email (optional)"
                       type="email">
                <mat-icon matSuffix>person</mat-icon>
                <mat-error *ngIf="issueForm.get('assignee')?.hasError('email')">
                  Please enter a valid email address
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-actions animate-fade-in" style="animation-delay: 0.6s">
              <button mat-stroked-button 
                      type="button" 
                      class="cancel-btn"
                      (click)="onCancel()">
                <mat-icon>close</mat-icon>
                Cancel
              </button>
              <button mat-flat-button 
                      class="submit-btn"
                      type="submit" 
                      [disabled]="issueForm.invalid || isSubmitting">
                <mat-icon>{{isSubmitting ? 'hourglass_empty' : (isEditMode ? 'save' : 'add_circle')}}</mat-icon>
                <span>{{isSubmitting ? 'Saving...' : (isEditMode ? 'Update Issue' : 'Create Issue')}}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Loading Overlay -->
      <div class="loading-overlay" *ngIf="isSubmitting">
        <div class="loading-content">
          <mat-icon class="spinning">refresh</mat-icon>
          <p>{{isEditMode ? 'Updating' : 'Creating'}} issue...</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .form-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .form-card {
      width: 100%;
      border-radius: 25px;
      overflow: hidden;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
      position: relative;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(15px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .form-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #667eea, #764ba2, #667eea);
      background-size: 200% 100%;
      animation: shimmer 2s infinite;
    }

    .form-header {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
      padding: 2.5rem 2rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .header-icon {
      font-size: 3rem !important;
      width: 3rem !important;
      height: 3rem !important;
      color: #667eea;
      animation: pulse 2s infinite;
    }

    .header-text {
      flex: 1;
    }

    .form-title {
      margin: 0 0 0.5rem 0;
      font-size: 2rem;
      font-weight: 700;
      background: linear-gradient(135deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .form-subtitle {
      margin: 0;
      color: rgba(255, 255, 255, 0.9);
      font-size: 1.1rem;
    }

    .form-content {
      padding: 2.5rem 2rem;
    }

    .issue-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .form-field-wrapper {
      position: relative;
    }

    .form-field {
      width: 100%;
    }

    .form-field .mat-mdc-form-field-outline {
      border-radius: 15px !important;
    }

    .form-field:hover .mat-mdc-form-field-outline {
      border-color: #667eea !important;
    }

    .form-field.mat-focused .mat-mdc-form-field-outline-thick {
      border-color: #667eea !important;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    .option-content {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .option-icon {
      font-size: 1.2rem !important;
      width: 1.2rem !important;
      height: 1.2rem !important;
    }

    .status-open { color: #1976d2; }
    .status-progress { color: #f57c00; }
    .status-closed { color: #388e3c; }
    .priority-low { color: #7b1fa2; }
    .priority-medium { color: #388e3c; }
    .priority-high { color: #f57c00; }
    .priority-critical { color: #d32f2f; }

    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 1rem;
      padding-top: 2rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .cancel-btn {
      padding: 0.75rem 2rem;
      border-radius: 25px;
      border: 2px solid rgba(102, 126, 234, 0.3);
      color: #667eea;
      transition: all 0.3s ease;
      background: rgba(255, 255, 255, 0.1);
    }

    .cancel-btn:hover {
      background: rgba(102, 126, 234, 0.1);
      border-color: #667eea;
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.2);
    }

    .submit-btn {
      padding: 0.75rem 2rem;
      border-radius: 25px;
      background: linear-gradient(135deg, #667eea, #764ba2) !important;
      color: white !important;
      font-weight: 600;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .submit-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 12px 35px rgba(102, 126, 234, 0.4);
    }

    .submit-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .submit-btn::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
      transition: left 0.5s;
    }

    .submit-btn:hover:not(:disabled)::before {
      left: 100%;
    }

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

    .loading-content {
      text-align: center;
      color: white;
      background: rgba(102, 126, 234, 0.2);
      backdrop-filter: blur(10px);
      padding: 2rem;
      border-radius: 20px;
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
    }

    .loading-content mat-icon {
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

    /* Responsive Design */
    @media (max-width: 768px) {
      .form-container {
        padding: 1rem;
      }

      .form-header {
        padding: 2rem 1.5rem;
      }

      .header-content {
        flex-direction: column;
        text-align: center;
        gap: 1rem;
      }

      .form-title {
        font-size: 1.5rem;
      }

      .form-content {
        padding: 2rem 1.5rem;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .form-actions {
        flex-direction: column-reverse;
        gap: 1rem;
      }

      .cancel-btn,
      .submit-btn {
        width: 100%;
        justify-content: center;
      }
    }

    /* Enhanced Material Form Field Styling */
    ::ng-deep .mat-mdc-form-field-appearance-outline .mat-mdc-form-field-outline {
      border-radius: 15px;
    }

    ::ng-deep .mat-mdc-form-field-appearance-outline:not(.mat-form-field-disabled) .mat-mdc-form-field-outline {
      color: rgba(16, 185, 129, 0.3);
    }

    ::ng-deep .mat-mdc-form-field-appearance-outline.mat-focused .mat-mdc-form-field-outline-thick {
      color: #10b981;
    }

    ::ng-deep .mat-mdc-form-field-appearance-outline .mat-mdc-form-field-label {
      color: #10b981;
    }

    ::ng-deep .mat-mdc-select-panel {
      border-radius: 15px;
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
    }
  `]
})
export class IssueFormComponent implements OnInit {
  issueForm: FormGroup;
  isEditMode = false;
  isSubmitting = false;
  issueId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private issueService: IssueService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.issueForm = this.createForm();
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.issueId = parseInt(id, 10);
      this.loadIssue(this.issueId);
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      description: [''],
      status: [IssueStatus.OPEN, Validators.required],
      priority: [IssuePriority.MEDIUM, Validators.required],
      assignee: ['', Validators.email]
    });
  }

  loadIssue(id: number) {
    this.issueService.getIssue(id).subscribe({
      next: (issue) => {
        this.issueForm.patchValue({
          title: issue.title,
          description: issue.description || '',
          status: issue.status,
          priority: issue.priority,
          assignee: issue.assignee || ''
        });
      },
      error: (error) => {
        console.error('Error loading issue:', error);
        this.snackBar.open('Error loading issue', 'Close', { duration: 3000 });
        this.router.navigate(['/issues']);
      }
    });
  }

  onSubmit() {
    if (this.issueForm.valid) {
      this.isSubmitting = true;
      const formValue = this.issueForm.value;
      
      // Clean up empty values
      const issueData = {
        title: formValue.title,
        description: formValue.description || undefined,
        status: formValue.status,
        priority: formValue.priority,
        assignee: formValue.assignee || undefined
      };

      if (this.isEditMode && this.issueId) {
        this.updateIssue(this.issueId, issueData);
      } else {
        this.createIssue(issueData as IssueCreate);
      }
    }
  }

  createIssue(issueData: IssueCreate) {
    this.issueService.createIssue(issueData).subscribe({
      next: (issue) => {
        this.snackBar.open('Issue created successfully', 'Close', { duration: 3000 });
        this.router.navigate(['/issues']);
      },
      error: (error) => {
        console.error('Error creating issue:', error);
        this.snackBar.open('Error creating issue', 'Close', { duration: 3000 });
        this.isSubmitting = false;
      }
    });
  }

  updateIssue(id: number, issueData: IssueUpdate) {
    this.issueService.updateIssue(id, issueData).subscribe({
      next: (issue) => {
        this.snackBar.open('Issue updated successfully', 'Close', { duration: 3000 });
        this.router.navigate(['/issues']);
      },
      error: (error) => {
        console.error('Error updating issue:', error);
        this.snackBar.open('Error updating issue', 'Close', { duration: 3000 });
        this.isSubmitting = false;
      }
    });
  }

  onCancel() {
    this.router.navigate(['/issues']);
  }
}
