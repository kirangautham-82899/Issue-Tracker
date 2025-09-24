from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    DEVELOPER = "developer"
    REPORTER = "reporter"

class IssueStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    CLOSED = "closed"

class IssuePriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

# User Models
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=100)
    role: UserRole = UserRole.REPORTER

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, min_length=1, max_length=100)
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

# Comment Models
class CommentBase(BaseModel):
    content: str = Field(..., min_length=1)

class CommentCreate(CommentBase):
    issue_id: int

class CommentUpdate(BaseModel):
    content: Optional[str] = Field(None, min_length=1)

class Comment(CommentBase):
    id: int
    issue_id: int
    author_id: int
    author: User
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Attachment Models
class AttachmentBase(BaseModel):
    filename: str
    original_filename: str
    content_type: str
    file_size: int

class Attachment(AttachmentBase):
    id: int
    file_path: str
    issue_id: int
    uploaded_by: int
    uploader: User
    created_at: datetime

    class Config:
        from_attributes = True

# Issue Models
class IssueBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    status: IssueStatus = IssueStatus.OPEN
    priority: IssuePriority = IssuePriority.MEDIUM
    assignee_id: Optional[int] = None

class IssueCreate(IssueBase):
    pass

class IssueUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    status: Optional[IssueStatus] = None
    priority: Optional[IssuePriority] = None
    assignee_id: Optional[int] = None

class Issue(IssueBase):
    id: int
    creator_id: int
    creator: User
    assignee: Optional[User] = None
    comments: List[Comment] = []
    attachments: List[Attachment] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class IssueResponse(BaseModel):
    issues: List[Issue]
    total: int
    page: int
    page_size: int
    total_pages: int

# Search Models
class SearchFilters(BaseModel):
    search: Optional[str] = None
    status: Optional[IssueStatus] = None
    priority: Optional[IssuePriority] = None
    assignee_id: Optional[int] = None
    creator_id: Optional[int] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=10, ge=1, le=100)
    sort_by: str = Field(default="updated_at")
    sort_order: str = Field(default="desc", pattern="^(asc|desc)$")

# Email Models
class EmailNotification(BaseModel):
    to_email: str
    subject: str
    body: str
    issue_id: Optional[int] = None

# Response Models
class HealthResponse(BaseModel):
    status: str = "ok"

class MessageResponse(BaseModel):
    message: str

class UserResponse(BaseModel):
    users: List[User]
    total: int

class CommentResponse(BaseModel):
    comments: List[Comment]
    total: int

# Notification Models
class NotificationType(str, Enum):
    ISSUE_ASSIGNED = "issue_assigned"
    ISSUE_UPDATED = "issue_updated"
    COMMENT_ADDED = "comment_added"
    MENTION = "mention"
    TIME_LOGGED = "time_logged"

class Notification(BaseModel):
    id: int
    type: NotificationType
    title: str
    message: str
    user_id: int
    issue_id: Optional[int] = None
    is_read: bool = False
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationCreate(BaseModel):
    type: NotificationType
    title: str
    message: str
    user_id: int
    issue_id: Optional[int] = None

# Time Tracking Models
class TimeEntry(BaseModel):
    id: int
    issue_id: int
    user_id: int
    user: User
    hours: float = Field(..., ge=0.1, le=24.0)
    description: Optional[str] = None
    date_logged: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class TimeEntryCreate(BaseModel):
    issue_id: int
    hours: float = Field(..., ge=0.1, le=24.0)
    description: Optional[str] = None
    date_logged: Optional[datetime] = None

class TimeEntryUpdate(BaseModel):
    hours: Optional[float] = Field(None, ge=0.1, le=24.0)
    description: Optional[str] = None
    date_logged: Optional[datetime] = None

# Issue Template Models
class IssueTemplate(BaseModel):
    id: int
    name: str
    title_template: str
    description_template: str
    default_priority: IssuePriority
    default_assignee_id: Optional[int] = None
    created_by: int
    creator: User
    is_active: bool = True
    created_at: datetime

    class Config:
        from_attributes = True

class IssueTemplateCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    title_template: str = Field(..., min_length=1, max_length=200)
    description_template: str
    default_priority: IssuePriority = IssuePriority.MEDIUM
    default_assignee_id: Optional[int] = None

class IssueTemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    title_template: Optional[str] = Field(None, min_length=1, max_length=200)
    description_template: Optional[str] = None
    default_priority: Optional[IssuePriority] = None
    default_assignee_id: Optional[int] = None
    is_active: Optional[bool] = None

# Enhanced Comment Models for @Mentions
class CommentCreateWithMentions(CommentBase):
    issue_id: int
    mentioned_users: List[int] = []

# WebSocket Models
class WebSocketMessage(BaseModel):
    type: str
    data: dict
    user_id: Optional[int] = None
    timestamp: datetime

# Response Models
class NotificationResponse(BaseModel):
    notifications: List[Notification]
    total: int
    unread_count: int

class TimeEntryResponse(BaseModel):
    time_entries: List[TimeEntry]
    total: int
    total_hours: float

class IssueTemplateResponse(BaseModel):
    templates: List[IssueTemplate]
    total: int
