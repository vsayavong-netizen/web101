"""
WebSocket utility functions for sending real-time notifications
"""
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import json


def send_notification_to_user(user_id, notification_data):
    """
    Send notification to a specific user via WebSocket.
    
    Args:
        user_id: User ID to send notification to
        notification_data: Dictionary containing notification data
    """
    channel_layer = get_channel_layer()
    if not channel_layer:
        return  # Channel layer not configured
    
    group_name = f"notifications_{user_id}"
    
    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            'type': 'send_notification',
            'data': notification_data
        }
    )


def send_notification_to_role(role, notification_data):
    """
    Send notification to all users with a specific role via WebSocket.
    
    Args:
        role: Role name (e.g., 'Admin', 'Student', 'Advisor')
        notification_data: Dictionary containing notification data
    """
    channel_layer = get_channel_layer()
    if not channel_layer:
        return  # Channel layer not configured
    
    # Send to all users with this role
    # Note: This requires maintaining a list of active WebSocket connections per role
    # For now, we'll send to a role-based group
    group_name = f"notifications_role_{role}"
    
    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            'type': 'send_notification',
            'data': notification_data
        }
    )


def send_notification_to_all(notification_data):
    """
    Send notification to all connected users via WebSocket.
    
    Args:
        notification_data: Dictionary containing notification data
    """
    channel_layer = get_channel_layer()
    if not channel_layer:
        return  # Channel layer not configured
    
    group_name = "notifications_all"
    
    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            'type': 'send_notification',
            'data': notification_data
        }
    )


def broadcast_notification(notification):
    """
    Broadcast a notification to all relevant users based on recipient settings.
    
    Args:
        notification: Notification model instance
    """
    notification_data = {
        'id': str(notification.id),
        'title': notification.title,
        'message': notification.message,
        'type': notification.notification_type,
        'priority': notification.priority,
        'timestamp': notification.created_at.isoformat(),
        'read': notification.is_read,
        'action_url': notification.action_url,
        'action_text': notification.action_text
    }
    
    if notification.recipient_type == 'all':
        send_notification_to_all(notification_data)
    elif notification.recipient_type == 'role':
        send_notification_to_role(notification.recipient_id, notification_data)
    else:  # user
        send_notification_to_user(notification.recipient_id, notification_data)

