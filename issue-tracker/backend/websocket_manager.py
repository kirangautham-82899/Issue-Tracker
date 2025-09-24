from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List
import json
import logging
from datetime import datetime
from models import WebSocketMessage

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Store active connections by user_id
        self.active_connections: Dict[int, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: int):
        """Accept a WebSocket connection and store it."""
        await websocket.accept()
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        
        self.active_connections[user_id].append(websocket)
        logger.info(f"User {user_id} connected via WebSocket")
    
    def disconnect(self, websocket: WebSocket, user_id: int):
        """Remove a WebSocket connection."""
        if user_id in self.active_connections:
            try:
                self.active_connections[user_id].remove(websocket)
                if not self.active_connections[user_id]:
                    del self.active_connections[user_id]
                logger.info(f"User {user_id} disconnected from WebSocket")
            except ValueError:
                pass  # Connection not in list
    
    async def send_personal_message(self, message: str, user_id: int):
        """Send a message to a specific user."""
        if user_id in self.active_connections:
            disconnected_connections = []
            
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_text(message)
                except Exception as e:
                    logger.error(f"Error sending message to user {user_id}: {e}")
                    disconnected_connections.append(connection)
            
            # Remove disconnected connections
            for connection in disconnected_connections:
                self.disconnect(connection, user_id)
    
    async def send_personal_json(self, data: dict, user_id: int):
        """Send JSON data to a specific user."""
        message = WebSocketMessage(
            type=data.get("type", "notification"),
            data=data,
            user_id=user_id,
            timestamp=datetime.now()
        )
        await self.send_personal_message(message.model_dump_json(), user_id)
    
    async def broadcast_to_users(self, message: str, user_ids: List[int]):
        """Send a message to multiple users."""
        for user_id in user_ids:
            await self.send_personal_message(message, user_id)
    
    async def broadcast_json_to_users(self, data: dict, user_ids: List[int]):
        """Send JSON data to multiple users."""
        for user_id in user_ids:
            await self.send_personal_json(data, user_id)
    
    def get_connected_users(self) -> List[int]:
        """Get list of currently connected user IDs."""
        return list(self.active_connections.keys())
    
    def is_user_connected(self, user_id: int) -> bool:
        """Check if a user is currently connected."""
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0

# Global connection manager instance
manager = ConnectionManager()

class NotificationService:
    """Service for sending real-time notifications."""
    
    @staticmethod
    async def notify_issue_assigned(issue_id: int, assignee_id: int, issue_title: str, assigned_by: str):
        """Send notification when an issue is assigned."""
        await manager.send_personal_json({
            "type": "issue_assigned",
            "title": "New Issue Assigned",
            "message": f"You have been assigned to issue: {issue_title}",
            "issue_id": issue_id,
            "assigned_by": assigned_by
        }, assignee_id)
    
    @staticmethod
    async def notify_issue_updated(issue_id: int, user_ids: List[int], issue_title: str, updated_by: str, changes: dict):
        """Send notification when an issue is updated."""
        change_summary = ", ".join([f"{field}: {old} → {new}" for field, (old, new) in changes.items()])
        
        await manager.broadcast_json_to_users({
            "type": "issue_updated",
            "title": "Issue Updated",
            "message": f"Issue '{issue_title}' was updated by {updated_by}. Changes: {change_summary}",
            "issue_id": issue_id,
            "updated_by": updated_by,
            "changes": changes
        }, user_ids)
    
    @staticmethod
    async def notify_comment_added(issue_id: int, user_ids: List[int], issue_title: str, comment_author: str, comment_preview: str):
        """Send notification when a comment is added."""
        preview = comment_preview[:100] + "..." if len(comment_preview) > 100 else comment_preview
        
        await manager.broadcast_json_to_users({
            "type": "comment_added",
            "title": "New Comment",
            "message": f"{comment_author} commented on '{issue_title}': {preview}",
            "issue_id": issue_id,
            "comment_author": comment_author,
            "comment_preview": preview
        }, user_ids)
    
    @staticmethod
    async def notify_mention(mentioned_user_id: int, issue_id: int, issue_title: str, mentioned_by: str, comment_preview: str):
        """Send notification when a user is mentioned."""
        preview = comment_preview[:100] + "..." if len(comment_preview) > 100 else comment_preview
        
        await manager.send_personal_json({
            "type": "mention",
            "title": "You were mentioned",
            "message": f"{mentioned_by} mentioned you in '{issue_title}': {preview}",
            "issue_id": issue_id,
            "mentioned_by": mentioned_by,
            "comment_preview": preview
        }, mentioned_user_id)
    
    @staticmethod
    async def notify_time_logged(issue_id: int, user_ids: List[int], issue_title: str, logged_by: str, hours: float):
        """Send notification when time is logged."""
        await manager.broadcast_json_to_users({
            "type": "time_logged",
            "title": "Time Logged",
            "message": f"{logged_by} logged {hours} hours on '{issue_title}'",
            "issue_id": issue_id,
            "logged_by": logged_by,
            "hours": hours
        }, user_ids)

# Global notification service instance
notification_service = NotificationService()
