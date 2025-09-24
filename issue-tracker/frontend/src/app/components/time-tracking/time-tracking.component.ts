import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

export interface TimeEntry {
  id: number;
  issue_id: number;
  user_id: number;
  user: any;
  hours: number;
  description?: string;
  date_logged: string;
  created_at: string;
}

export interface TimeEntryResponse {
  time_entries: TimeEntry[];
  total: number;
  total_hours: number;
}

@Component({
  selector: 'app-time-tracking',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  template: `
    <div class="time-tracking-container">
      <!-- Time Logging Form -->
      <div class="time-log-form glass">
        <h3>
          <mat-icon>schedule</mat-icon>
          Log Time
        </h3>
        
        <form [formGroup]="timeForm" (ngSubmit)="logTime()">
          <div class="form-row">
            <mat-form-field appearance="outline" class="hours-field">
              <mat-label>Hours</mat-label>
              <input 
                matInput 
                type="number" 
                step="0.25" 
                min="0.1" 
                max="24"
                formControlName="hours"
                placeholder="2.5"
              >
              <mat-hint>Enter hours worked (e.g., 2.5 for 2 hours 30 minutes)</mat-hint>
              <mat-error *ngIf="timeForm.get('hours')?.hasError('required')">
                Hours is required
              </mat-error>
              <mat-error *ngIf="timeForm.get('hours')?.hasError('min')">
                Minimum 0.1 hours (6 minutes)
              </mat-error>
              <mat-error *ngIf="timeForm.get('hours')?.hasError('max')">
                Maximum 24 hours per entry
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="date-field">
              <mat-label>Date</mat-label>
              <input 
                matInput 
                [matDatepicker]="picker" 
                formControlName="dateLogged"
                readonly
              >
              <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
              <mat-datepicker #picker></mat-datepicker>
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline" class="description-field">
            <mat-label>Description (Optional)</mat-label>
            <textarea 
              matInput 
              formControlName="description"
              rows="3"
              placeholder="What did you work on?"
            ></textarea>
            <mat-hint>Describe what you worked on during this time</mat-hint>
          </mat-form-field>

          <div class="form-actions">
            <button 
              mat-raised-button 
              color="primary" 
              type="submit"
              [disabled]="timeForm.invalid || isLogging"
              class="log-time-btn"
            >
              <mat-icon>add</mat-icon>
              {{ isLogging ? 'Logging...' : 'Log Time' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Time Entries List -->
      <div class="time-entries glass" *ngIf="timeEntries.length > 0">
        <div class="entries-header">
          <h3>
            <mat-icon>history</mat-icon>
            Time Entries
          </h3>
          <div class="total-time">
            <span class="total-label">Total:</span>
            <span class="total-hours">{{ totalHours }}h</span>
          </div>
        </div>

        <div class="entries-list">
          <div 
            class="time-entry" 
            *ngFor="let entry of timeEntries; trackBy: trackByEntryId"
          >
            <div class="entry-main">
              <div class="entry-time">
                <mat-icon>schedule</mat-icon>
                <span class="hours">{{ entry.hours }}h</span>
              </div>
              
              <div class="entry-details">
                <div class="entry-description" *ngIf="entry.description">
                  {{ entry.description }}
                </div>
                <div class="entry-meta">
                  <span class="entry-user">{{ entry.user?.full_name || 'Unknown User' }}</span>
                  <span class="entry-date">{{ formatDate(entry.date_logged) }}</span>
                </div>
              </div>
            </div>

            <div class="entry-actions" *ngIf="canEditEntry(entry)">
              <button 
                mat-icon-button 
                (click)="editEntry(entry)"
                matTooltip="Edit entry"
                class="edit-btn"
              >
                <mat-icon>edit</mat-icon>
              </button>
              <button 
                mat-icon-button 
                (click)="deleteEntry(entry)"
                matTooltip="Delete entry"
                class="delete-btn"
              >
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </div>
        </div>

        <div class="load-more" *ngIf="hasMoreEntries">
          <button 
            mat-button 
            (click)="loadMoreEntries()"
            [disabled]="isLoadingMore"
          >
            {{ isLoadingMore ? 'Loading...' : 'Load More' }}
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-state glass" *ngIf="timeEntries.length === 0 && !isLoading">
        <mat-icon>schedule</mat-icon>
        <h3>No time entries yet</h3>
        <p>Start tracking your time by logging hours above</p>
      </div>
    </div>
  `,
  styles: [`
    .time-tracking-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 20px;
    }

    .glass {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 15px;
      padding: 24px;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    }

    .time-log-form h3,
    .time-entries h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 20px 0;
      color: white;
      font-weight: 600;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }

    .hours-field,
    .date-field,
    .description-field {
      width: 100%;
    }

    .description-field {
      grid-column: 1 / -1;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 20px;
    }

    .log-time-btn {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      padding: 12px 24px;
      font-weight: 600;
    }

    .entries-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .total-time {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(16, 185, 129, 0.2);
      padding: 8px 16px;
      border-radius: 20px;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .total-label {
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.9em;
    }

    .total-hours {
      color: #10b981;
      font-weight: bold;
      font-size: 1.1em;
    }

    .entries-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .time-entry {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      padding: 16px;
      transition: all 0.3s ease;
    }

    .time-entry:hover {
      background: rgba(255, 255, 255, 0.15);
      transform: translateY(-2px);
    }

    .entry-main {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      flex: 1;
    }

    .entry-time {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(16, 185, 129, 0.2);
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid rgba(16, 185, 129, 0.3);
      flex-shrink: 0;
    }

    .entry-time mat-icon {
      color: #10b981;
      font-size: 18px;
    }

    .hours {
      color: #10b981;
      font-weight: bold;
      font-size: 0.9em;
    }

    .entry-details {
      flex: 1;
      min-width: 0;
    }

    .entry-description {
      color: white;
      font-weight: 500;
      margin-bottom: 8px;
      line-height: 1.4;
    }

    .entry-meta {
      display: flex;
      gap: 16px;
      font-size: 0.85em;
      color: rgba(255, 255, 255, 0.7);
    }

    .entry-user {
      font-weight: 500;
    }

    .entry-actions {
      display: flex;
      gap: 4px;
      flex-shrink: 0;
    }

    .edit-btn {
      color: #3b82f6;
    }

    .delete-btn {
      color: #ef4444;
    }

    .edit-btn:hover,
    .delete-btn:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .load-more {
      text-align: center;
      margin-top: 16px;
    }

    .empty-state {
      text-align: center;
      padding: 40px;
      color: rgba(255, 255, 255, 0.7);
    }

    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .empty-state h3 {
      margin: 16px 0 8px 0;
      color: white;
    }

    @media (max-width: 768px) {
      .form-row {
        grid-template-columns: 1fr;
      }
      
      .entries-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }
      
      .entry-main {
        flex-direction: column;
        gap: 12px;
      }
      
      .entry-actions {
        align-self: flex-end;
      }
    }
  `]
})
export class TimeTrackingComponent implements OnInit {
  @Input() issueId!: number;
  
  timeForm: FormGroup;
  timeEntries: TimeEntry[] = [];
  totalHours = 0;
  isLogging = false;
  isLoading = false;
  isLoadingMore = false;
  hasMoreEntries = false;
  
  private apiUrl = 'http://localhost:8000';
  private currentPage = 0;
  private pageSize = 10;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {
    this.timeForm = this.fb.group({
      hours: ['', [Validators.required, Validators.min(0.1), Validators.max(24)]],
      description: [''],
      dateLogged: [new Date()]
    });
  }

  ngOnInit(): void {
    this.loadTimeEntries();
  }

  logTime(): void {
    if (this.timeForm.valid) {
      this.isLogging = true;
      
      const formValue = this.timeForm.value;
      const timeData = {
        issue_id: this.issueId,
        hours: parseFloat(formValue.hours),
        description: formValue.description || null,
        date_logged: formValue.dateLogged.toISOString()
      };

      this.http.post<TimeEntry>(`${this.apiUrl}/time-entries`, timeData).subscribe({
        next: (entry) => {
          this.timeEntries.unshift(entry);
          this.totalHours += entry.hours;
          this.timeForm.reset({
            dateLogged: new Date()
          });
          this.snackBar.open('Time logged successfully!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        },
        error: (error) => {
          console.error('Error logging time:', error);
          this.snackBar.open('Failed to log time. Please try again.', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        },
        complete: () => {
          this.isLogging = false;
        }
      });
    }
  }

  loadTimeEntries(): void {
    this.isLoading = true;
    
    this.http.get<TimeEntryResponse>(`${this.apiUrl}/issues/${this.issueId}/time-entries`).subscribe({
      next: (response) => {
        this.timeEntries = response.time_entries;
        this.totalHours = response.total_hours;
        this.hasMoreEntries = response.time_entries.length >= this.pageSize;
      },
      error: (error) => {
        console.error('Error loading time entries:', error);
        this.snackBar.open('Failed to load time entries.', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  loadMoreEntries(): void {
    this.isLoadingMore = true;
    this.currentPage++;
    
    const skip = this.currentPage * this.pageSize;
    this.http.get<TimeEntryResponse>(`${this.apiUrl}/issues/${this.issueId}/time-entries?skip=${skip}&limit=${this.pageSize}`).subscribe({
      next: (response) => {
        this.timeEntries.push(...response.time_entries);
        this.hasMoreEntries = response.time_entries.length >= this.pageSize;
      },
      error: (error) => {
        console.error('Error loading more entries:', error);
        this.currentPage--; // Revert page increment on error
      },
      complete: () => {
        this.isLoadingMore = false;
      }
    });
  }

  editEntry(entry: TimeEntry): void {
    // TODO: Implement edit functionality
    console.log('Edit entry:', entry);
  }

  deleteEntry(entry: TimeEntry): void {
    if (confirm('Are you sure you want to delete this time entry?')) {
      this.http.delete(`${this.apiUrl}/time-entries/${entry.id}`).subscribe({
        next: () => {
          this.timeEntries = this.timeEntries.filter(e => e.id !== entry.id);
          this.totalHours -= entry.hours;
          this.snackBar.open('Time entry deleted successfully!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        },
        error: (error) => {
          console.error('Error deleting entry:', error);
          this.snackBar.open('Failed to delete time entry.', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  canEditEntry(entry: TimeEntry): boolean {
    // TODO: Implement proper permission checking
    return true;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  trackByEntryId(index: number, entry: TimeEntry): number {
    return entry.id;
  }
}
