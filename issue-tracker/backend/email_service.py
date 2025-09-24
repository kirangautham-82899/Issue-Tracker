import smtplib
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
from typing import List, Optional
import logging
from models import EmailNotification
from database_models import User, Issue

# Email configuration - Update these with your SMTP settings
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USERNAME = "your-email@gmail.com"  # Change this
SMTP_PASSWORD = "your-app-password"     # Change this
FROM_EMAIL = "your-email@gmail.com"     # Change this

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.smtp_server = SMTP_SERVER
        self.smtp_port = SMTP_PORT
        self.username = SMTP_USERNAME
        self.password = SMTP_PASSWORD
        self.from_email = FROM_EMAIL

    def send_email(self, to_email: str, subject: str, body: str, html_body: Optional[str] = None) -> bool:
        """Send an email."""
        try:
            msg = MimeMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.from_email
            msg['To'] = to_email

            # Add plain text part
            text_part = MimeText(body, 'plain')
            msg.attach(text_part)

            # Add HTML part if provided
            if html_body:
                html_part = MimeText(html_body, 'html')
                msg.attach(html_part)

            # Send the email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.username, self.password)
                server.send_message(msg)

            logger.info(f"Email sent successfully to {to_email}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False

    def send_issue_created_notification(self, issue: Issue, assignee: Optional[User] = None):
        """Send notification when an issue is created."""
        if not assignee or not assignee.email:
            return

        subject = f"New Issue Assigned: {issue.title}"
        body = f"""
Hello {assignee.full_name},

A new issue has been assigned to you:

Title: {issue.title}
Priority: {issue.priority.value.title()}
Status: {issue.status.value.replace('_', ' ').title()}
Created by: {issue.creator.full_name}

Description:
{issue.description or 'No description provided'}

Please log in to the Issue Tracker to view more details.

Best regards,
Issue Tracker System
        """

        html_body = f"""
        <html>
        <body>
            <h2>New Issue Assigned</h2>
            <p>Hello {assignee.full_name},</p>
            <p>A new issue has been assigned to you:</p>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <h3>{issue.title}</h3>
                <p><strong>Priority:</strong> <span style="color: {'red' if issue.priority.value == 'critical' else 'orange' if issue.priority.value == 'high' else 'blue'};">{issue.priority.value.title()}</span></p>
                <p><strong>Status:</strong> {issue.status.value.replace('_', ' ').title()}</p>
                <p><strong>Created by:</strong> {issue.creator.full_name}</p>
                <p><strong>Description:</strong></p>
                <p>{issue.description or 'No description provided'}</p>
            </div>
            
            <p>Please log in to the Issue Tracker to view more details.</p>
            <p>Best regards,<br>Issue Tracker System</p>
        </body>
        </html>
        """

        return self.send_email(assignee.email, subject, body, html_body)

    def send_issue_updated_notification(self, issue: Issue, updated_by: User, changes: dict):
        """Send notification when an issue is updated."""
        recipients = []
        
        # Notify assignee
        if issue.assignee and issue.assignee.email:
            recipients.append(issue.assignee)
        
        # Notify creator if different from updater
        if issue.creator.id != updated_by.id and issue.creator.email:
            recipients.append(issue.creator)

        if not recipients:
            return

        # Format changes
        change_text = []
        for field, (old_value, new_value) in changes.items():
            change_text.append(f"- {field.replace('_', ' ').title()}: {old_value} → {new_value}")

        changes_str = "\n".join(change_text)

        subject = f"Issue Updated: {issue.title}"
        
        for recipient in recipients:
            body = f"""
Hello {recipient.full_name},

An issue has been updated:

Title: {issue.title}
Updated by: {updated_by.full_name}

Changes made:
{changes_str}

Current Status: {issue.status.value.replace('_', ' ').title()}
Current Priority: {issue.priority.value.title()}

Please log in to the Issue Tracker to view more details.

Best regards,
Issue Tracker System
            """

            html_body = f"""
            <html>
            <body>
                <h2>Issue Updated</h2>
                <p>Hello {recipient.full_name},</p>
                <p>An issue has been updated:</p>
                
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
                    <h3>{issue.title}</h3>
                    <p><strong>Updated by:</strong> {updated_by.full_name}</p>
                    
                    <h4>Changes made:</h4>
                    <ul>
                        {"".join([f"<li>{field.replace('_', ' ').title()}: <strong>{old_value}</strong> → <strong>{new_value}</strong></li>" for field, (old_value, new_value) in changes.items()])}
                    </ul>
                    
                    <p><strong>Current Status:</strong> {issue.status.value.replace('_', ' ').title()}</p>
                    <p><strong>Current Priority:</strong> <span style="color: {'red' if issue.priority.value == 'critical' else 'orange' if issue.priority.value == 'high' else 'blue'};">{issue.priority.value.title()}</span></p>
                </div>
                
                <p>Please log in to the Issue Tracker to view more details.</p>
                <p>Best regards,<br>Issue Tracker System</p>
            </body>
            </html>
            """

            self.send_email(recipient.email, subject, body, html_body)

    def send_comment_notification(self, issue: Issue, comment_author: User, comment_content: str):
        """Send notification when a comment is added."""
        recipients = []
        
        # Notify assignee
        if issue.assignee and issue.assignee.email and issue.assignee.id != comment_author.id:
            recipients.append(issue.assignee)
        
        # Notify creator if different from comment author
        if issue.creator.id != comment_author.id and issue.creator.email:
            recipients.append(issue.creator)

        if not recipients:
            return

        subject = f"New Comment on Issue: {issue.title}"
        
        for recipient in recipients:
            body = f"""
Hello {recipient.full_name},

A new comment has been added to an issue:

Issue: {issue.title}
Comment by: {comment_author.full_name}

Comment:
{comment_content}

Please log in to the Issue Tracker to view the full conversation.

Best regards,
Issue Tracker System
            """

            html_body = f"""
            <html>
            <body>
                <h2>New Comment Added</h2>
                <p>Hello {recipient.full_name},</p>
                <p>A new comment has been added to an issue:</p>
                
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
                    <h3>{issue.title}</h3>
                    <p><strong>Comment by:</strong> {comment_author.full_name}</p>
                    
                    <div style="background-color: white; padding: 10px; border-left: 4px solid #007bff; margin: 10px 0;">
                        <p>{comment_content}</p>
                    </div>
                </div>
                
                <p>Please log in to the Issue Tracker to view the full conversation.</p>
                <p>Best regards,<br>Issue Tracker System</p>
            </body>
            </html>
            """

            self.send_email(recipient.email, subject, body, html_body)

# Global email service instance
email_service = EmailService()
