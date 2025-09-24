from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import uvicorn

app = FastAPI(title="Issue Tracker API - Simple")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4201", "http://127.0.0.1:4201", "http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple models
class Issue(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    status: str = "open"
    priority: str = "medium"
    assignee: Optional[str] = None
    created_at: str
    updated_at: str

class IssueCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "open"
    priority: str = "medium"
    assignee: Optional[str] = None

class IssueResponse(BaseModel):
    issues: List[Issue]
    total: int
    page: int
    page_size: int
    total_pages: int

# Mock data
mock_issues = [
    Issue(
        id=1,
        title="Fix login bug",
        description="Users can't log in with special characters in password",
        status="open",
        priority="high",
        assignee="john.doe",
        created_at="2024-01-15T10:30:00Z",
        updated_at="2024-01-15T10:30:00Z"
    ),
    Issue(
        id=2,
        title="Add dark mode",
        description="Implement dark mode toggle for better user experience",
        status="in_progress",
        priority="medium",
        assignee="jane.smith",
        created_at="2024-01-14T09:15:00Z",
        updated_at="2024-01-16T14:20:00Z"
    ),
    Issue(
        id=3,
        title="Database optimization",
        description="Optimize database queries for better performance",
        status="closed",
        priority="critical",
        assignee="mike.wilson",
        created_at="2024-01-10T08:00:00Z",
        updated_at="2024-01-18T16:45:00Z"
    ),
    Issue(
        id=4,
        title="Update documentation",
        description="Update API documentation with new endpoints",
        status="open",
        priority="low",
        assignee=None,
        created_at="2024-01-12T11:20:00Z",
        updated_at="2024-01-12T11:20:00Z"
    ),
    Issue(
        id=5,
        title="Mobile responsiveness",
        description="Fix mobile layout issues on smaller screens",
        status="in_progress",
        priority="medium",
        assignee="sarah.johnson",
        created_at="2024-01-13T13:45:00Z",
        updated_at="2024-01-17T10:15:00Z"
    )
]

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "Backend is running successfully!", "timestamp": datetime.now().isoformat()}

@app.get("/issues", response_model=IssueResponse)
async def get_issues(
    page: int = 1,
    page_size: int = 10,
    search: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assignee: Optional[str] = None,
    sort_by: str = "updated_at",
    sort_order: str = "desc"
):
    # Filter issues
    filtered_issues = mock_issues.copy()
    
    if search:
        filtered_issues = [
            issue for issue in filtered_issues 
            if search.lower() in issue.title.lower() or 
               (issue.description and search.lower() in issue.description.lower())
        ]
    
    if status:
        filtered_issues = [issue for issue in filtered_issues if issue.status == status]
    
    if priority:
        filtered_issues = [issue for issue in filtered_issues if issue.priority == priority]
    
    if assignee:
        filtered_issues = [
            issue for issue in filtered_issues 
            if issue.assignee and assignee.lower() in issue.assignee.lower()
        ]
    
    # Sort issues
    reverse = sort_order == "desc"
    if sort_by == "id":
        filtered_issues.sort(key=lambda x: x.id, reverse=reverse)
    elif sort_by == "title":
        filtered_issues.sort(key=lambda x: x.title.lower(), reverse=reverse)
    elif sort_by == "status":
        filtered_issues.sort(key=lambda x: x.status, reverse=reverse)
    elif sort_by == "priority":
        priority_order = {"low": 1, "medium": 2, "high": 3, "critical": 4}
        filtered_issues.sort(key=lambda x: priority_order.get(x.priority, 0), reverse=reverse)
    
    # Pagination
    total = len(filtered_issues)
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    paginated_issues = filtered_issues[start_idx:end_idx]
    
    total_pages = (total + page_size - 1) // page_size
    
    return IssueResponse(
        issues=paginated_issues,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@app.get("/issues/{issue_id}", response_model=Issue)
async def get_issue(issue_id: int):
    issue = next((issue for issue in mock_issues if issue.id == issue_id), None)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return issue

@app.post("/issues", response_model=Issue)
async def create_issue(issue_data: IssueCreate):
    new_id = max([issue.id for issue in mock_issues]) + 1
    current_time = datetime.now().isoformat() + "Z"
    
    new_issue = Issue(
        id=new_id,
        title=issue_data.title,
        description=issue_data.description,
        status=issue_data.status,
        priority=issue_data.priority,
        assignee=issue_data.assignee,
        created_at=current_time,
        updated_at=current_time
    )
    
    mock_issues.append(new_issue)
    return new_issue

@app.put("/issues/{issue_id}", response_model=Issue)
async def update_issue(issue_id: int, issue_data: dict):
    issue = next((issue for issue in mock_issues if issue.id == issue_id), None)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    # Update fields
    for field, value in issue_data.items():
        if hasattr(issue, field) and value is not None:
            setattr(issue, field, value)
    
    issue.updated_at = datetime.now().isoformat() + "Z"
    return issue

@app.delete("/issues/{issue_id}")
async def delete_issue(issue_id: int):
    global mock_issues
    mock_issues = [issue for issue in mock_issues if issue.id != issue_id]
    return {"message": "Issue deleted successfully"}

# Mock notifications
class Notification(BaseModel):
    id: int
    type: str
    title: str
    message: str
    user_id: int
    issue_id: Optional[int] = None
    is_read: bool = False
    created_at: str

class NotificationResponse(BaseModel):
    notifications: List[Notification]
    total: int
    unread_count: int

mock_notifications = [
    Notification(
        id=1,
        type="issue_assigned",
        title="Issue Assigned",
        message="You have been assigned to issue #1: Fix login bug",
        user_id=1,
        issue_id=1,
        is_read=False,
        created_at="2024-01-18T10:30:00Z"
    ),
    Notification(
        id=2,
        type="issue_updated",
        title="Issue Updated",
        message="Issue #2: Add dark mode has been updated",
        user_id=1,
        issue_id=2,
        is_read=True,
        created_at="2024-01-17T14:20:00Z"
    )
]

@app.get("/notifications", response_model=NotificationResponse)
async def get_notifications():
    unread_count = len([n for n in mock_notifications if not n.is_read])
    return NotificationResponse(
        notifications=mock_notifications,
        total=len(mock_notifications),
        unread_count=unread_count
    )

@app.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: int):
    notification = next((n for n in mock_notifications if n.id == notification_id), None)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_read = True
    return {"message": "Notification marked as read"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8003)
