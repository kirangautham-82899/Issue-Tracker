from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from datetime import timedelta
import math
import os
import json

from models import (
    # User models
    User, UserCreate, UserUpdate, UserLogin, Token, UserResponse,
    # Issue models
    Issue, IssueCreate, IssueUpdate, IssueResponse,
    # Comment models
    Comment, CommentCreate, CommentUpdate, CommentResponse, CommentCreateWithMentions,
    # Attachment models
    Attachment,
    # Notification models
    Notification, NotificationCreate, NotificationResponse,
    # Time tracking models
    TimeEntry, TimeEntryCreate, TimeEntryUpdate, TimeEntryResponse,
    # Template models
    IssueTemplate, IssueTemplateCreate, IssueTemplateUpdate, IssueTemplateResponse,
    # Search models
    SearchFilters,
    # Response models
    HealthResponse, MessageResponse,
    # Enums
    IssueStatus, IssuePriority, UserRole, NotificationType
)
from database import get_db, init_database
from auth import (
    create_access_token, get_current_active_user, require_admin, 
    require_manager_or_admin, ACCESS_TOKEN_EXPIRE_MINUTES
)
from services import (
    UserService, IssueService, CommentService, AttachmentService,
    NotificationService, TimeTrackingService, IssueTemplateService, MentionService
)
from websocket_manager import manager
from auth import verify_token

# Initialize database
init_database()

app = FastAPI(
    title="Issue Tracker API",
    description="A comprehensive issue tracking system with authentication, comments, and file attachments",
    version="2.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://127.0.0.1:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

# Health Check
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse()

# Authentication Endpoints
@app.post("/auth/register", response_model=User)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    return UserService.create_user(db, user_data)

@app.post("/auth/login", response_model=Token)
async def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """Login user and return access token"""
    user = UserService.authenticate_user(db, user_credentials.username, user_credentials.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return Token(access_token=access_token, user=user)

@app.get("/auth/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """Get current user information"""
    return current_user

# User Management Endpoints
@app.get("/users", response_model=UserResponse)
async def get_users(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin)
):
    """Get all users (Manager/Admin only)"""
    users = UserService.get_users(db, skip=skip, limit=limit)
    return UserResponse(users=users, total=len(users))

@app.get("/users/{user_id}", response_model=User)
async def get_user(
    user_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get user by ID"""
    user = UserService.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.put("/users/{user_id}", response_model=User)
async def update_user(
    user_id: int, 
    user_update: UserUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update user (own profile or admin)"""
    # Users can update their own profile, admins can update any profile
    if user_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update this user")
    
    user = UserService.update_user(db, user_id, user_update)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Issue Endpoints
@app.post("/issues", response_model=Issue)
async def create_issue(
    issue: IssueCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new issue"""
    return IssueService.create_issue(db, issue, current_user.id)

@app.get("/issues/{issue_id}", response_model=Issue)
async def get_issue(
    issue_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific issue by ID"""
    issue = IssueService.get_issue_by_id(db, issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return issue

@app.put("/issues/{issue_id}", response_model=Issue)
async def update_issue(
    issue_id: int, 
    issue_update: IssueUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update an existing issue"""
    issue = IssueService.update_issue(db, issue_id, issue_update, current_user)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return issue

@app.delete("/issues/{issue_id}", response_model=MessageResponse)
async def delete_issue(
    issue_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin)
):
    """Delete an issue (Manager/Admin only)"""
    success = IssueService.delete_issue(db, issue_id)
    if not success:
        raise HTTPException(status_code=404, detail="Issue not found")
    return MessageResponse(message="Issue deleted successfully")

@app.get("/issues", response_model=IssueResponse)
async def search_issues(
    search: str = None,
    status: IssueStatus = None,
    priority: IssuePriority = None,
    assignee_id: int = None,
    creator_id: int = None,
    page: int = 1,
    page_size: int = 10,
    sort_by: str = "updated_at",
    sort_order: str = "desc",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Search issues with advanced filtering"""
    filters = SearchFilters(
        search=search,
        status=status,
        priority=priority,
        assignee_id=assignee_id,
        creator_id=creator_id,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    issues, total = IssueService.search_issues(db, filters)
    total_pages = math.ceil(total / page_size)
    
    return IssueResponse(
        issues=issues,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

# Comment Endpoints
@app.post("/comments", response_model=Comment)
async def create_comment(
    comment: CommentCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new comment"""
    return CommentService.create_comment(db, comment, current_user.id)

@app.get("/issues/{issue_id}/comments", response_model=CommentResponse)
async def get_issue_comments(
    issue_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all comments for an issue"""
    comments = CommentService.get_comments_by_issue(db, issue_id)
    return CommentResponse(comments=comments, total=len(comments))

@app.put("/comments/{comment_id}", response_model=Comment)
async def update_comment(
    comment_id: int, 
    comment_update: CommentUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update a comment"""
    comment = CommentService.update_comment(db, comment_id, comment_update, current_user.id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    return comment

@app.delete("/comments/{comment_id}", response_model=MessageResponse)
async def delete_comment(
    comment_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a comment"""
    success = CommentService.delete_comment(db, comment_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Comment not found")
    return MessageResponse(message="Comment deleted successfully")

# File Attachment Endpoints
@app.post("/issues/{issue_id}/attachments", response_model=Attachment)
async def upload_attachment(
    issue_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Upload a file attachment to an issue"""
    return AttachmentService.upload_attachment(db, file, issue_id, current_user.id)

@app.get("/attachments/{attachment_id}/download")
async def download_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Download a file attachment"""
    attachment = AttachmentService.get_attachment(db, attachment_id)
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    
    if not os.path.exists(attachment.file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    return FileResponse(
        path=attachment.file_path,
        filename=attachment.original_filename,
        media_type=attachment.content_type
    )

@app.delete("/attachments/{attachment_id}", response_model=MessageResponse)
async def delete_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a file attachment"""
    success = AttachmentService.delete_attachment(db, attachment_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Attachment not found")
    return MessageResponse(message="Attachment deleted successfully")

# WebSocket Endpoints
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    """WebSocket endpoint for real-time notifications."""
    await manager.connect(websocket, user_id)
    try:
        while True:
            # Keep connection alive and listen for messages
            data = await websocket.receive_text()
            # Echo back for heartbeat
            await websocket.send_text(f"Connected as user {user_id}")
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)

# Notification Endpoints
@app.get("/notifications", response_model=NotificationResponse)
async def get_notifications(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get notifications for current user."""
    notifications, total = NotificationService.get_user_notifications(db, current_user.id, skip, limit)
    unread_count = NotificationService.get_unread_count(db, current_user.id)
    return NotificationResponse(notifications=notifications, total=total, unread_count=unread_count)

@app.put("/notifications/{notification_id}/read", response_model=Notification)
async def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Mark a notification as read."""
    notification = NotificationService.mark_as_read(db, notification_id, current_user.id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notification

@app.put("/notifications/read-all", response_model=MessageResponse)
async def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Mark all notifications as read."""
    count = NotificationService.mark_all_as_read(db, current_user.id)
    return MessageResponse(message=f"Marked {count} notifications as read")

# Time Tracking Endpoints
@app.post("/time-entries", response_model=TimeEntry)
async def log_time(
    time_data: TimeEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Log time for an issue."""
    return TimeTrackingService.log_time(db, time_data, current_user.id)

@app.get("/issues/{issue_id}/time-entries", response_model=TimeEntryResponse)
async def get_issue_time_entries(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get time entries for an issue."""
    entries, total_hours = TimeTrackingService.get_time_entries_by_issue(db, issue_id)
    return TimeEntryResponse(time_entries=entries, total=len(entries), total_hours=total_hours)

@app.get("/time-entries/my", response_model=TimeEntryResponse)
async def get_my_time_entries(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get current user's time entries."""
    entries, total_hours = TimeTrackingService.get_time_entries_by_user(db, current_user.id, skip, limit)
    return TimeEntryResponse(time_entries=entries, total=len(entries), total_hours=total_hours)

@app.put("/time-entries/{entry_id}", response_model=TimeEntry)
async def update_time_entry(
    entry_id: int,
    time_update: TimeEntryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update a time entry."""
    entry = TimeTrackingService.update_time_entry(db, entry_id, time_update, current_user.id)
    if not entry:
        raise HTTPException(status_code=404, detail="Time entry not found")
    return entry

@app.delete("/time-entries/{entry_id}", response_model=MessageResponse)
async def delete_time_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a time entry."""
    success = TimeTrackingService.delete_time_entry(db, entry_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Time entry not found")
    return MessageResponse(message="Time entry deleted successfully")

# Issue Template Endpoints
@app.post("/templates", response_model=IssueTemplate)
async def create_template(
    template_data: IssueTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin)
):
    """Create an issue template."""
    return IssueTemplateService.create_template(db, template_data, current_user.id)

@app.get("/templates", response_model=IssueTemplateResponse)
async def get_templates(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get issue templates."""
    templates = IssueTemplateService.get_templates(db, skip, limit, active_only)
    return IssueTemplateResponse(templates=templates, total=len(templates))

@app.get("/templates/{template_id}", response_model=IssueTemplate)
async def get_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a template by ID."""
    template = IssueTemplateService.get_template_by_id(db, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template

@app.put("/templates/{template_id}", response_model=IssueTemplate)
async def update_template(
    template_id: int,
    template_update: IssueTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update an issue template."""
    template = IssueTemplateService.update_template(db, template_id, template_update, current_user.id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template

@app.delete("/templates/{template_id}", response_model=MessageResponse)
async def delete_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete an issue template."""
    success = IssueTemplateService.delete_template(db, template_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Template not found")
    return MessageResponse(message="Template deleted successfully")

# Enhanced Comment Endpoints with Mentions
@app.post("/comments/with-mentions", response_model=Comment)
async def create_comment_with_mentions(
    comment: CommentCreateWithMentions,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a comment with @mentions support."""
    return MentionService.create_comment_with_mentions(db, comment, current_user.id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
