"""
WebSocket consumers for real-time features
"""
import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.core.serializers.json import DjangoJSONEncoder
from notifications.models import Notification
from projects.models import ProjectGroup
from accounts.models import User

User = get_user_model()


class NotificationConsumer(AsyncWebsocketConsumer):
    """Real-time notifications consumer"""
    
    async def connect(self):
        self.user = self.scope["user"]
        # Debug logging
        import logging
        logger = logging.getLogger(__name__)
        logger.debug(f"NotificationConsumer.connect: user={self.user.username if hasattr(self.user, 'username') else 'Anonymous'}, authenticated={self.user.is_authenticated if hasattr(self.user, 'is_authenticated') else False}, user_type={type(self.user)}")
        
        if not self.user.is_authenticated:
            logger.warning(f"WebSocket connection rejected: user not authenticated")
            await self.close()
            return
        
        # Accept connection first to establish WebSocket
        await self.accept()
        
        try:
            self.notification_group_name = f"notifications_{self.user.id}"
            
            # Also join role-based group for role-wide notifications
            self.role_group_name = f"notifications_role_{self.user.role}"
            self.all_group_name = "notifications_all"
            
            # Join notification groups only if channel_layer is available
            if self.channel_layer is not None:
                try:
                    await self.channel_layer.group_add(
                        self.notification_group_name,
                        self.channel_name
                    )
                    await self.channel_layer.group_add(
                        self.role_group_name,
                        self.channel_name
                    )
                    await self.channel_layer.group_add(
                        self.all_group_name,
                        self.channel_name
                    )
                except Exception as e:
                    logger.warning(f"Failed to join channel groups: {e}")
            else:
                logger.warning("Channel layer not available, skipping group join")
            
            # Send recent notifications
            await self.send_recent_notifications()
        except Exception as e:
            logger.error(f"Error in NotificationConsumer.connect: {e}")
            # Connection already accepted, so we can't close it here
            # But we can still send error message if needed
    
    async def disconnect(self, close_code):
        if self.channel_layer is not None:
            try:
                if hasattr(self, 'notification_group_name'):
                    await self.channel_layer.group_discard(
                        self.notification_group_name,
                        self.channel_name
                    )
                if hasattr(self, 'role_group_name'):
                    await self.channel_layer.group_discard(
                        self.role_group_name,
                        self.channel_name
                    )
                if hasattr(self, 'all_group_name'):
                    await self.channel_layer.group_discard(
                        self.all_group_name,
                        self.channel_name
                    )
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Error leaving channel groups: {e}")
    
    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')
        
        if action == 'mark_read':
            notification_id = data.get('notification_id')
            await self.mark_notification_read(notification_id)
        elif action == 'get_notifications':
            await self.send_recent_notifications()
    
    async def send_notification(self, event):
        """Send notification to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'data': event['data']
        }))
    
    async def send_recent_notifications(self):
        """Send recent unread notifications"""
        notifications = await self.get_user_notifications()
        await self.send(text_data=json.dumps({
            'type': 'notifications_list',
            'data': notifications
        }))
    
    async def mark_notification_read(self, notification_id):
        """Mark notification as read"""
        await self.mark_notification_as_read(notification_id)
        await self.send_recent_notifications()
    
    @database_sync_to_async
    def get_user_notifications(self):
        """Get user's recent notifications"""
        from django.db.models import Q
        
        notifications = Notification.objects.filter(
            Q(recipient_id=str(self.user.id)) |
            Q(recipient_id=self.user.role) |
            Q(recipient_type='all')
        ).filter(
            is_read=False
        ).order_by('-created_at')[:10]
        
        return [
            {
                'id': str(notif.id),
                'title': notif.title,
                'message': notif.message,
                'type': notif.notification_type,
                'priority': notif.priority,
                'timestamp': notif.created_at.isoformat(),
                'read': notif.is_read,
                'action_url': notif.action_url,
                'action_text': notif.action_text
            }
            for notif in notifications
        ]
    
    @database_sync_to_async
    def mark_notification_as_read(self, notification_id):
        """Mark notification as read"""
        try:
            notification = Notification.objects.get(id=notification_id)
            notification.read = True
            notification.save()
        except Notification.DoesNotExist:
            pass


class ProjectConsumer(AsyncWebsocketConsumer):
    """Real-time project updates consumer"""
    
    async def connect(self):
        self.project_id = self.scope['url_route']['kwargs']['project_id']
        self.user = self.scope["user"]
        
        if not self.user.is_authenticated:
            await self.close()
            return
        
        # Check if user has access to this project
        has_access = await self.check_project_access()
        if not has_access:
            await self.close()
            return
        
        self.project_group_name = f"project_{self.project_id}"
        
        # Join project group
        await self.channel_layer.group_add(
            self.project_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send current project status
        await self.send_project_status()
    
    async def disconnect(self, close_code):
        if hasattr(self, 'project_group_name'):
            await self.channel_layer.group_discard(
                self.project_group_name,
                self.channel_name
            )
    
    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')
        
        if action == 'get_status':
            await self.send_project_status()
        elif action == 'update_milestone':
            await self.update_milestone(data.get('milestone_data'))
    
    async def project_update(self, event):
        """Send project update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'project_update',
            'data': event['data']
        }))
    
    async def send_project_status(self):
        """Send current project status"""
        project_data = await self.get_project_data()
        await self.send(text_data=json.dumps({
            'type': 'project_status',
            'data': project_data
        }))
    
    async def update_milestone(self, milestone_data):
        """Update milestone status"""
        # This would typically update the database
        # For now, just broadcast the update
        await self.channel_layer.group_send(
            self.project_group_name,
            {
                'type': 'project_update',
                'data': {
                    'milestone_updated': milestone_data,
                    'updated_by': self.user.username,
                    'timestamp': asyncio.get_event_loop().time()
                }
            }
        )
    
    @database_sync_to_async
    def check_project_access(self):
        """Check if user has access to this project"""
        try:
            project = ProjectGroup.objects.get(project__project_id=self.project_id)
            
            # Check if user is student in project, advisor, or admin
            if self.user.role == 'Admin' or self.user.role == 'DepartmentAdmin':
                return True
            
            if self.user.role == 'Advisor' and project.project.advisor_name == self.user.username:
                return True
            
            if self.user.role == 'Student':
                return project.students.filter(user=self.user).exists()
            
            return False
        except ProjectGroup.DoesNotExist:
            return False
    
    @database_sync_to_async
    def get_project_data(self):
        """Get current project data"""
        try:
            project = ProjectGroup.objects.get(project__project_id=self.project_id)
            return {
                'project_id': project.project.project_id,
                'status': project.project.status,
                'advisor': project.project.advisor_name,
                'students': [s.student_id for s in project.students.all()],
                'milestones': [
                    {
                        'id': m.id,
                        'name': m.name,
                        'status': m.status,
                        'due_date': m.due_date.isoformat() if m.due_date else None
                    }
                    for m in project.project.milestones.all()
                ] if hasattr(project.project, 'milestones') else []
            }
        except ProjectGroup.DoesNotExist:
            return None


class CollaborationConsumer(AsyncWebsocketConsumer):
    """Real-time collaboration consumer for document editing"""
    
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.user = self.scope["user"]
        
        if not self.user.is_authenticated:
            await self.close()
            return
        
        self.room_group_name = f"collaboration_{self.room_name}"
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Notify others that user joined
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_joined',
                'user': self.user.username,
                'message': f"{self.user.username} joined the collaboration"
            }
        )
    
    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
            
            # Notify others that user left
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_left',
                    'user': self.user.username,
                    'message': f"{self.user.username} left the collaboration"
                }
            )
    
    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')
        
        if action == 'cursor_update':
            await self.handle_cursor_update(data)
        elif action == 'text_change':
            await self.handle_text_change(data)
        elif action == 'selection_change':
            await self.handle_selection_change(data)
    
    async def handle_cursor_update(self, data):
        """Handle cursor position updates"""
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'cursor_update',
                'user': self.user.username,
                'position': data.get('position'),
                'timestamp': asyncio.get_event_loop().time()
            }
        )
    
    async def handle_text_change(self, data):
        """Handle text changes"""
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'text_change',
                'user': self.user.username,
                'changes': data.get('changes'),
                'timestamp': asyncio.get_event_loop().time()
            }
        )
    
    async def handle_selection_change(self, data):
        """Handle selection changes"""
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'selection_change',
                'user': self.user.username,
                'selection': data.get('selection'),
                'timestamp': asyncio.get_event_loop().time()
            }
        )
    
    async def user_joined(self, event):
        """Handle user joined event"""
        await self.send(text_data=json.dumps({
            'type': 'user_joined',
            'user': event['user'],
            'message': event['message']
        }))
    
    async def user_left(self, event):
        """Handle user left event"""
        await self.send(text_data=json.dumps({
            'type': 'user_left',
            'user': event['user'],
            'message': event['message']
        }))
    
    async def cursor_update(self, event):
        """Handle cursor update"""
        if event['user'] != self.user.username:
            await self.send(text_data=json.dumps({
                'type': 'cursor_update',
                'user': event['user'],
                'position': event['position'],
                'timestamp': event['timestamp']
            }))
    
    async def text_change(self, event):
        """Handle text change"""
        if event['user'] != self.user.username:
            await self.send(text_data=json.dumps({
                'type': 'text_change',
                'user': event['user'],
                'changes': event['changes'],
                'timestamp': event['timestamp']
            }))
    
    async def selection_change(self, event):
        """Handle selection change"""
        if event['user'] != self.user.username:
            await self.send(text_data=json.dumps({
                'type': 'selection_change',
                'user': event['user'],
                'selection': event['selection'],
                'timestamp': event['timestamp']
            }))


class SystemHealthConsumer(AsyncWebsocketConsumer):
    """Real-time system health monitoring consumer"""
    
    async def connect(self):
        self.user = self.scope["user"]
        
        if not self.user.is_authenticated:
            await self.close()
            return
        
        # Only admins can access system health
        if self.user.role not in ['Admin', 'DepartmentAdmin']:
            await self.close()
            return
        
        self.health_group_name = "system_health"
        
        # Join health monitoring group
        await self.channel_layer.group_add(
            self.health_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send current system status
        await self.send_system_status()
    
    async def disconnect(self, close_code):
        if hasattr(self, 'health_group_name'):
            await self.channel_layer.group_discard(
                self.health_group_name,
                self.channel_name
            )
    
    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')
        
        if action == 'get_status':
            await self.send_system_status()
        elif action == 'run_health_check':
            await self.run_health_check()
    
    async def send_system_status(self):
        """Send current system status"""
        status = await self.get_system_status()
        await self.send(text_data=json.dumps({
            'type': 'system_status',
            'data': status
        }))
    
    async def run_health_check(self):
        """Run system health check"""
        # This would typically run actual health checks
        # For now, just send a mock status
        await self.send(text_data=json.dumps({
            'type': 'health_check_result',
            'data': {
                'status': 'healthy',
                'timestamp': asyncio.get_event_loop().time(),
                'checks': {
                    'database': 'healthy',
                    'redis': 'healthy',
                    'storage': 'healthy'
                }
            }
        }))
    
    async def health_alert(self, event):
        """Send health alert"""
        await self.send(text_data=json.dumps({
            'type': 'health_alert',
            'data': event['data']
        }))
    
    @database_sync_to_async
    def get_system_status(self):
        """Get current system status"""
        # This would typically check actual system metrics
        return {
            'status': 'healthy',
            'timestamp': asyncio.get_event_loop().time(),
            'metrics': {
                'active_users': 0,  # Would be calculated
                'pending_projects': 0,  # Would be calculated
                'system_load': 0.5  # Would be calculated
            }
        }
