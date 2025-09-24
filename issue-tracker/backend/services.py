from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, asc
from fastapi import HTTPException, UploadFile
from datetime import datetime
import os
import uuid
import shutil

from database_models import (
    User, Issue, Comment, Attachment, IssueStatus, IssuePriority,
    Notification, NotificationType, TimeEntry, IssueTemplate, CommentMention
)
from models import (
    UserCreate, UserUpdate, IssueCreate, IssueUpdate, 
    CommentCreate, CommentUpdate, SearchFilters,
    NotificationCreate, TimeEntryCreate, TimeEntryUpdate,
    IssueTemplateCreate, IssueTemplateUpdate, CommentCreateWithMentions
)
from email_service import email_service
from websocket_manager import notification_service
import re

class UserService:
    @staticmethod
    def create_user(db: Session, user_data: UserCreate) -> User:
        """Create a new user."""
        # Check if username or email already exists
        existing_user = db.query(User).filter(
            or_(User.username == user_data.username, User.email == user_data.email)
        ).first()
        
        if existing_user:
            raise HTTPException(status_code=400, detail="Username or email already registered")
        
        # Create new user
        hashed_password = User.get_password_hash(user_data.password)
        db_user = User(
            username=user_data.username,
            email=user_data.email,
            full_name=user_data.full_name,
            hashed_password=hashed_password,
            role=user_data.role
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    
    @staticmethod
    def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
        """Authenticate a user."""
        user = db.query(User).filter(User.username == username).first()
        if not user or not user.verify_password(password):
            return None
        return user
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        """Get user by ID."""
        return db.query(User).filter(User.id == user_id).first()
    
    @staticmethod
    def get_user_by_username(db: Session, username: str) -> Optional[User]:
        """Get user by username."""
        return db.query(User).filter(User.username == username).first()
    
    @staticmethod
    def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        """Get all users."""
        return db.query(User).offset(skip).limit(limit).all()
    
    @staticmethod
    def update_user(db: Session, user_id: int, user_update: UserUpdate) -> Optional[User]:
        """Update a user."""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return None
        
        update_data = user_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)
        
        db.commit()
        db.refresh(user)
        return user

class IssueService:
    @staticmethod
    def create_issue(db: Session, issue_data: IssueCreate, creator_id: int) -> Issue:
        """Create a new issue."""
        db_issue = Issue(
            title=issue_data.title,
            description=issue_data.description,
            status=issue_data.status,
            priority=issue_data.priority,
            creator_id=creator_id,
            assignee_id=issue_data.assignee_id
        )
        
        db.add(db_issue)
        db.commit()
        db.refresh(db_issue)
        
        # Send email notification if assigned
        if db_issue.assignee:
            email_service.send_issue_created_notification(db_issue, db_issue.assignee)
        
        return db_issue
    
    @staticmethod
    def get_issue_by_id(db: Session, issue_id: int) -> Optional[Issue]:
        """Get issue by ID with all relationships."""
        return db.query(Issue).filter(Issue.id == issue_id).first()
    
    @staticmethod
    def update_issue(db: Session, issue_id: int, issue_update: IssueUpdate, updated_by: User) -> Optional[Issue]:
        """Update an issue."""
        issue = db.query(Issue).filter(Issue.id == issue_id).first()
        if not issue:
            return None
        
        # Track changes for notifications
        changes = {}
        update_data = issue_update.model_dump(exclude_unset=True)
        
        for field, new_value in update_data.items():
            old_value = getattr(issue, field)
            if old_value != new_value:
                changes[field] = (str(old_value), str(new_value))
                setattr(issue, field, new_value)
        
        if changes:
            db.commit()
            db.refresh(issue)
            
            # Send email notifications
            email_service.send_issue_updated_notification(issue, updated_by, changes)
        
        return issue
    
    @staticmethod
    def delete_issue(db: Session, issue_id: int) -> bool:
        """Delete an issue."""
        issue = db.query(Issue).filter(Issue.id == issue_id).first()
        if not issue:
            return False
        
        db.delete(issue)
        db.commit()
        return True
    
    @staticmethod
    def search_issues(db: Session, filters: SearchFilters) -> Tuple[List[Issue], int]:
        """Search issues with advanced filtering."""
        query = db.query(Issue)
        
        # Apply filters
        if filters.search:
            search_term = f"%{filters.search}%"
            query = query.filter(
                or_(
                    Issue.title.ilike(search_term),
                    Issue.description.ilike(search_term)
                )
            )
        
        if filters.status:
            query = query.filter(Issue.status == filters.status)
        
        if filters.priority:
            query = query.filter(Issue.priority == filters.priority)
        
        if filters.assignee_id:
            query = query.filter(Issue.assignee_id == filters.assignee_id)
        
        if filters.creator_id:
            query = query.filter(Issue.creator_id == filters.creator_id)
        
        if filters.created_after:
            query = query.filter(Issue.created_at >= filters.created_after)
        
        if filters.created_before:
            query = query.filter(Issue.created_at <= filters.created_before)
        
        # Get total count before pagination
        total = query.count()
        
        # Apply sorting
        if filters.sort_order.lower() == "desc":
            sort_func = desc
        else:
            sort_func = asc
        
        if filters.sort_by == "id":
            query = query.order_by(sort_func(Issue.id))
        elif filters.sort_by == "title":
            query = query.order_by(sort_func(Issue.title))
        elif filters.sort_by == "status":
            query = query.order_by(sort_func(Issue.status))
        elif filters.sort_by == "priority":
            query = query.order_by(sort_func(Issue.priority))
        elif filters.sort_by == "created_at":
            query = query.order_by(sort_func(Issue.created_at))
        else:  # default to updated_at
            query = query.order_by(sort_func(Issue.updated_at))
        
        # Apply pagination
        offset = (filters.page - 1) * filters.page_size
        issues = query.offset(offset).limit(filters.page_size).all()
        
        return issues, total

class CommentService:
    @staticmethod
    def create_comment(db: Session, comment_data: CommentCreate, author_id: int) -> Comment:
        """Create a new comment."""
        # Verify issue exists
        issue = db.query(Issue).filter(Issue.id == comment_data.issue_id).first()
        if not issue:
            raise HTTPException(status_code=404, detail="Issue not found")
        
        db_comment = Comment(
            content=comment_data.content,
            issue_id=comment_data.issue_id,
            author_id=author_id
        )
        
        db.add(db_comment)
        db.commit()
        db.refresh(db_comment)
        
        # Send email notification
        email_service.send_comment_notification(issue, db_comment.author, comment_data.content)
        
        return db_comment
    
    @staticmethod
    def get_comments_by_issue(db: Session, issue_id: int) -> List[Comment]:
        """Get all comments for an issue."""
        return db.query(Comment).filter(Comment.issue_id == issue_id).order_by(Comment.created_at).all()
    
    @staticmethod
    def update_comment(db: Session, comment_id: int, comment_update: CommentUpdate, user_id: int) -> Optional[Comment]:
        """Update a comment."""
        comment = db.query(Comment).filter(Comment.id == comment_id).first()
        if not comment:
            return None
        
        # Check if user owns the comment or is admin
        if comment.author_id != user_id:
            user = db.query(User).filter(User.id == user_id).first()
            if not user or user.role.value != "admin":
                raise HTTPException(status_code=403, detail="Not authorized to update this comment")
        
        update_data = comment_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(comment, field, value)
        
        db.commit()
        db.refresh(comment)
        return comment
    
    @staticmethod
    def delete_comment(db: Session, comment_id: int, user_id: int) -> bool:
        """Delete a comment."""
        comment = db.query(Comment).filter(Comment.id == comment_id).first()
        if not comment:
            return False
        
        # Check if user owns the comment or is admin
        if comment.author_id != user_id:
            user = db.query(User).filter(User.id == user_id).first()
            if not user or user.role.value != "admin":
                raise HTTPException(status_code=403, detail="Not authorized to delete this comment")
        
        db.delete(comment)
        db.commit()
        return True

class AttachmentService:
    UPLOAD_DIR = "uploads"
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS = {
        'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx', 
        'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar', 'log'
    }
    
    @staticmethod
    def _ensure_upload_dir():
        """Ensure upload directory exists."""
        if not os.path.exists(AttachmentService.UPLOAD_DIR):
            os.makedirs(AttachmentService.UPLOAD_DIR)
    
    @staticmethod
    def _get_file_extension(filename: str) -> str:
        """Get file extension."""
        return filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    
    @staticmethod
    def upload_attachment(db: Session, file: UploadFile, issue_id: int, user_id: int) -> Attachment:
        """Upload a file attachment."""
        # Verify issue exists
        issue = db.query(Issue).filter(Issue.id == issue_id).first()
        if not issue:
            raise HTTPException(status_code=404, detail="Issue not found")
        
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        file_extension = AttachmentService._get_file_extension(file.filename)
        if file_extension not in AttachmentService.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400, 
                detail=f"File type not allowed. Allowed types: {', '.join(AttachmentService.ALLOWED_EXTENSIONS)}"
            )
        
        # Check file size
        file.file.seek(0, 2)  # Seek to end
        file_size = file.file.tell()
        file.file.seek(0)  # Reset to beginning
        
        if file_size > AttachmentService.MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB")
        
        # Generate unique filename
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        AttachmentService._ensure_upload_dir()
        file_path = os.path.join(AttachmentService.UPLOAD_DIR, unique_filename)
        
        # Save file
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
        
        # Create database record
        db_attachment = Attachment(
            filename=unique_filename,
            original_filename=file.filename,
            content_type=file.content_type or "application/octet-stream",
            file_size=file_size,
            file_path=file_path,
            issue_id=issue_id,
            uploaded_by=user_id
        )
        
        db.add(db_attachment)
        db.commit()
        db.refresh(db_attachment)
        
        return db_attachment
    
    @staticmethod
    def get_attachment(db: Session, attachment_id: int) -> Optional[Attachment]:
        """Get attachment by ID."""
        return db.query(Attachment).filter(Attachment.id == attachment_id).first()
    
    @staticmethod
    def delete_attachment(db: Session, attachment_id: int, user_id: int) -> bool:
        """Delete an attachment."""
        attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
        if not attachment:
            return False
        
        # Check if user uploaded the file or is admin
        if attachment.uploaded_by != user_id:
            user = db.query(User).filter(User.id == user_id).first()
            if not user or user.role.value != "admin":
                raise HTTPException(status_code=403, detail="Not authorized to delete this attachment")
        
        # Delete file from filesystem
        try:
            if os.path.exists(attachment.file_path):
                os.remove(attachment.file_path)
        except Exception as e:
            print(f"Warning: Could not delete file {attachment.file_path}: {e}")
        
        # Delete database record
        db.delete(attachment)
        db.commit()
        return True

class NotificationService:
    @staticmethod
    def create_notification(db: Session, notification_data: NotificationCreate) -> Notification:
        """Create a new notification."""
        db_notification = Notification(
            type=notification_data.type,
            title=notification_data.title,
            message=notification_data.message,
            user_id=notification_data.user_id,
            issue_id=notification_data.issue_id
        )
        
        db.add(db_notification)
        db.commit()
        db.refresh(db_notification)
        return db_notification
    
    @staticmethod
    def get_user_notifications(db: Session, user_id: int, skip: int = 0, limit: int = 50) -> Tuple[List[Notification], int]:
        """Get notifications for a user."""
        query = db.query(Notification).filter(Notification.user_id == user_id)
        total = query.count()
        notifications = query.order_by(desc(Notification.created_at)).offset(skip).limit(limit).all()
        return notifications, total
    
    @staticmethod
    def mark_as_read(db: Session, notification_id: int, user_id: int) -> Optional[Notification]:
        """Mark a notification as read."""
        notification = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()
        
        if notification:
            notification.is_read = True
            db.commit()
            db.refresh(notification)
        
        return notification
    
    @staticmethod
    def mark_all_as_read(db: Session, user_id: int) -> int:
        """Mark all notifications as read for a user."""
        count = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).update({"is_read": True})
        db.commit()
        return count
    
    @staticmethod
    def get_unread_count(db: Session, user_id: int) -> int:
        """Get count of unread notifications."""
        return db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).count()

class TimeTrackingService:
    @staticmethod
    def log_time(db: Session, time_data: TimeEntryCreate, user_id: int) -> TimeEntry:
        """Log time for an issue."""
        # Verify issue exists
        issue = db.query(Issue).filter(Issue.id == time_data.issue_id).first()
        if not issue:
            raise HTTPException(status_code=404, detail="Issue not found")
        
        # Convert hours to minutes for storage
        minutes = int(time_data.hours * 60)
        
        db_time_entry = TimeEntry(
            issue_id=time_data.issue_id,
            user_id=user_id,
            hours=minutes,
            description=time_data.description,
            date_logged=time_data.date_logged or datetime.now()
        )
        
        db.add(db_time_entry)
        db.commit()
        db.refresh(db_time_entry)
        
        # Send real-time notification (async call needs to be handled properly)
        user = db.query(User).filter(User.id == user_id).first()
        notification_users = []
        if issue.assignee_id and issue.assignee_id != user_id:
            notification_users.append(issue.assignee_id)
        if issue.creator_id != user_id and issue.creator_id not in notification_users:
            notification_users.append(issue.creator_id)
        
        # Note: WebSocket notifications will be handled in the API endpoint
        # if notification_users:
        #     await notification_service.notify_time_logged(
        #         issue.id, notification_users, issue.title, user.full_name, time_data.hours
        #     )
        
        return db_time_entry
    
    @staticmethod
    def get_time_entries_by_issue(db: Session, issue_id: int) -> Tuple[List[TimeEntry], float]:
        """Get all time entries for an issue."""
        entries = db.query(TimeEntry).filter(TimeEntry.issue_id == issue_id).order_by(TimeEntry.date_logged).all()
        total_minutes = sum(entry.hours for entry in entries)
        total_hours = total_minutes / 60.0
        return entries, total_hours
    
    @staticmethod
    def get_time_entries_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 50) -> Tuple[List[TimeEntry], float]:
        """Get time entries for a user."""
        query = db.query(TimeEntry).filter(TimeEntry.user_id == user_id)
        entries = query.order_by(desc(TimeEntry.date_logged)).offset(skip).limit(limit).all()
        total_minutes = query.with_entities(db.func.sum(TimeEntry.hours)).scalar() or 0
        total_hours = total_minutes / 60.0
        return entries, total_hours
    
    @staticmethod
    def update_time_entry(db: Session, entry_id: int, time_update: TimeEntryUpdate, user_id: int) -> Optional[TimeEntry]:
        """Update a time entry."""
        entry = db.query(TimeEntry).filter(TimeEntry.id == entry_id).first()
        if not entry:
            return None
        
        # Check if user owns the entry or is admin
        if entry.user_id != user_id:
            user = db.query(User).filter(User.id == user_id).first()
            if not user or user.role.value != "admin":
                raise HTTPException(status_code=403, detail="Not authorized to update this time entry")
        
        update_data = time_update.model_dump(exclude_unset=True)
        if "hours" in update_data:
            update_data["hours"] = int(update_data["hours"] * 60)  # Convert to minutes
        
        for field, value in update_data.items():
            setattr(entry, field, value)
        
        db.commit()
        db.refresh(entry)
        return entry
    
    @staticmethod
    def delete_time_entry(db: Session, entry_id: int, user_id: int) -> bool:
        """Delete a time entry."""
        entry = db.query(TimeEntry).filter(TimeEntry.id == entry_id).first()
        if not entry:
            return False
        
        # Check if user owns the entry or is admin
        if entry.user_id != user_id:
            user = db.query(User).filter(User.id == user_id).first()
            if not user or user.role.value != "admin":
                raise HTTPException(status_code=403, detail="Not authorized to delete this time entry")
        
        db.delete(entry)
        db.commit()
        return True

class IssueTemplateService:
    @staticmethod
    def create_template(db: Session, template_data: IssueTemplateCreate, creator_id: int) -> IssueTemplate:
        """Create a new issue template."""
        db_template = IssueTemplate(
            name=template_data.name,
            title_template=template_data.title_template,
            description_template=template_data.description_template,
            default_priority=template_data.default_priority,
            default_assignee_id=template_data.default_assignee_id,
            created_by=creator_id
        )
        
        db.add(db_template)
        db.commit()
        db.refresh(db_template)
        return db_template
    
    @staticmethod
    def get_templates(db: Session, skip: int = 0, limit: int = 100, active_only: bool = True) -> List[IssueTemplate]:
        """Get issue templates."""
        query = db.query(IssueTemplate)
        if active_only:
            query = query.filter(IssueTemplate.is_active == True)
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def get_template_by_id(db: Session, template_id: int) -> Optional[IssueTemplate]:
        """Get template by ID."""
        return db.query(IssueTemplate).filter(IssueTemplate.id == template_id).first()
    
    @staticmethod
    def update_template(db: Session, template_id: int, template_update: IssueTemplateUpdate, user_id: int) -> Optional[IssueTemplate]:
        """Update an issue template."""
        template = db.query(IssueTemplate).filter(IssueTemplate.id == template_id).first()
        if not template:
            return None
        
        # Check if user created the template or is admin
        if template.created_by != user_id:
            user = db.query(User).filter(User.id == user_id).first()
            if not user or user.role.value not in ["admin", "manager"]:
                raise HTTPException(status_code=403, detail="Not authorized to update this template")
        
        update_data = template_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(template, field, value)
        
        db.commit()
        db.refresh(template)
        return template
    
    @staticmethod
    def delete_template(db: Session, template_id: int, user_id: int) -> bool:
        """Delete an issue template."""
        template = db.query(IssueTemplate).filter(IssueTemplate.id == template_id).first()
        if not template:
            return False
        
        # Check if user created the template or is admin
        if template.created_by != user_id:
            user = db.query(User).filter(User.id == user_id).first()
            if not user or user.role.value not in ["admin", "manager"]:
                raise HTTPException(status_code=403, detail="Not authorized to delete this template")
        
        db.delete(template)
        db.commit()
        return True

class MentionService:
    @staticmethod
    def extract_mentions(content: str) -> List[str]:
        """Extract @mentions from content."""
        # Find all @username patterns
        mention_pattern = r'@(\w+)'
        mentions = re.findall(mention_pattern, content)
        return mentions
    
    @staticmethod
    def create_comment_with_mentions(db: Session, comment_data: CommentCreateWithMentions, author_id: int) -> Comment:
        """Create a comment and handle mentions."""
        # Verify issue exists
        issue = db.query(Issue).filter(Issue.id == comment_data.issue_id).first()
        if not issue:
            raise HTTPException(status_code=404, detail="Issue not found")
        
        # Create the comment
        db_comment = Comment(
            content=comment_data.content,
            issue_id=comment_data.issue_id,
            author_id=author_id
        )
        
        db.add(db_comment)
        db.commit()
        db.refresh(db_comment)
        
        # Extract mentions from content
        mentioned_usernames = MentionService.extract_mentions(comment_data.content)
        
        # Add explicitly mentioned users
        if comment_data.mentioned_users:
            mentioned_user_objects = db.query(User).filter(User.id.in_(comment_data.mentioned_users)).all()
            mentioned_usernames.extend([user.username for user in mentioned_user_objects])
        
        # Process mentions
        if mentioned_usernames:
            # Get mentioned users
            mentioned_users = db.query(User).filter(User.username.in_(mentioned_usernames)).all()
            
            # Create mention records
            for user in mentioned_users:
                if user.id != author_id:  # Don't mention yourself
                    mention = CommentMention(
                        comment_id=db_comment.id,
                        mentioned_user_id=user.id
                    )
                    db.add(mention)
                    
                    # Send real-time notification (will be handled in API endpoint)
                    # author = db.query(User).filter(User.id == author_id).first()
                    # await notification_service.notify_mention(
                    #     user.id, issue.id, issue.title, author.full_name, comment_data.content
                    # )
            
            db.commit()
        
        # Send general comment notification
        author = db.query(User).filter(User.id == author_id).first()
        notification_users = []
        if issue.assignee_id and issue.assignee_id != author_id:
            notification_users.append(issue.assignee_id)
        if issue.creator_id != author_id and issue.creator_id not in notification_users:
            notification_users.append(issue.creator_id)
        
        # Real-time notifications will be handled in API endpoints
        # if notification_users:
        #     await notification_service.notify_comment_added(
        #         issue.id, notification_users, issue.title, author.full_name, comment_data.content
        #     )
        
        # Send email notification
        email_service.send_comment_notification(issue, author, comment_data.content)
        
        return db_comment
