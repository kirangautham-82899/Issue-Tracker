from sqlalchemy import create_engine, or_, and_
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from database_models import Base, User, Issue, Comment, Attachment, UserRole, IssueStatus, IssuePriority
from models import UserCreate
import os

# Database URL - using SQLite for simplicity
SQLALCHEMY_DATABASE_URL = "sqlite:///./issue_tracker.db"

# Create engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False}  # Only needed for SQLite
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_tables():
    """Create all database tables."""
    Base.metadata.create_all(bind=engine)

def get_db():
    """Dependency to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def seed_database():
    """Seed the database with initial data."""
    db = SessionLocal()
    try:
        # Check if we already have data
        if db.query(User).first():
            return
        
        # Create default admin user
        admin_user = User(
            username="admin",
            email="admin@issuetracker.com",
            full_name="System Administrator",
            hashed_password=User.get_password_hash("admin123"),
            role=UserRole.ADMIN
        )
        db.add(admin_user)
        
        # Create sample users
        users_data = [
            {
                "username": "john_doe",
                "email": "john.doe@example.com",
                "full_name": "John Doe",
                "password": "password123",
                "role": UserRole.DEVELOPER
            },
            {
                "username": "jane_smith",
                "email": "jane.smith@example.com",
                "full_name": "Jane Smith",
                "password": "password123",
                "role": UserRole.MANAGER
            },
            {
                "username": "bob_wilson",
                "email": "bob.wilson@example.com",
                "full_name": "Bob Wilson",
                "password": "password123",
                "role": UserRole.DEVELOPER
            },
            {
                "username": "alice_brown",
                "email": "alice.brown@example.com",
                "full_name": "Alice Brown",
                "password": "password123",
                "role": UserRole.REPORTER
            }
        ]
        
        created_users = []
        for user_data in users_data:
            user = User(
                username=user_data["username"],
                email=user_data["email"],
                full_name=user_data["full_name"],
                hashed_password=User.get_password_hash(user_data["password"]),
                role=user_data["role"]
            )
            db.add(user)
            created_users.append(user)
        
        db.add(admin_user)
        db.commit()
        
        # Refresh to get IDs
        db.refresh(admin_user)
        for user in created_users:
            db.refresh(user)
        
        # Create sample issues
        sample_issues = [
            {
                "title": "Fix login bug",
                "description": "Users cannot login with special characters in password",
                "status": IssueStatus.OPEN,
                "priority": IssuePriority.HIGH,
                "creator_id": admin_user.id,
                "assignee_id": created_users[0].id  # John Doe
            },
            {
                "title": "Add dark mode theme",
                "description": "Implement dark mode theme for better user experience",
                "status": IssueStatus.IN_PROGRESS,
                "priority": IssuePriority.MEDIUM,
                "creator_id": created_users[1].id,  # Jane Smith
                "assignee_id": created_users[0].id  # John Doe
            },
            {
                "title": "Optimize database queries",
                "description": "Some queries are taking too long to execute",
                "status": IssueStatus.OPEN,
                "priority": IssuePriority.CRITICAL,
                "creator_id": admin_user.id,
                "assignee_id": created_users[2].id  # Bob Wilson
            },
            {
                "title": "Update documentation",
                "description": "API documentation needs to be updated with latest changes",
                "status": IssueStatus.CLOSED,
                "priority": IssuePriority.LOW,
                "creator_id": created_users[1].id,  # Jane Smith
                "assignee_id": created_users[3].id  # Alice Brown
            },
            {
                "title": "Implement user notifications",
                "description": "Users should receive notifications for important events",
                "status": IssueStatus.OPEN,
                "priority": IssuePriority.MEDIUM,
                "creator_id": created_users[3].id,  # Alice Brown
                "assignee_id": created_users[0].id  # John Doe
            }
        ]
        
        for issue_data in sample_issues:
            issue = Issue(**issue_data)
            db.add(issue)
        
        db.commit()
        
        # Add sample comments
        issues = db.query(Issue).all()
        if issues:
            sample_comments = [
                {
                    "content": "I've started investigating this issue. It seems to be related to password encoding.",
                    "issue_id": issues[0].id,
                    "author_id": created_users[0].id
                },
                {
                    "content": "The dark mode implementation is progressing well. Should be ready for testing soon.",
                    "issue_id": issues[1].id,
                    "author_id": created_users[0].id
                },
                {
                    "content": "I've identified the slow queries. Working on optimization now.",
                    "issue_id": issues[2].id,
                    "author_id": created_users[2].id
                }
            ]
            
            for comment_data in sample_comments:
                comment = Comment(**comment_data)
                db.add(comment)
            
            db.commit()
        
        print("Database seeded successfully!")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

# Initialize database
def init_database():
    """Initialize the database with tables and seed data."""
    create_tables()
    seed_database()
