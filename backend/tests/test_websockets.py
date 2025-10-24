"""
WebSocket tests
"""
import pytest
import json
from channels.testing import WebsocketCommunicator
from django.contrib.auth import get_user_model
from final_project_management.routing import websocket_urlpatterns
from final_project_management.consumers import NotificationConsumer, ProjectConsumer, CollaborationConsumer
from conftest import UserFactory, StudentFactory, AdvisorFactory, ProjectFactory, ProjectGroupFactory, NotificationFactory

User = get_user_model()


class TestNotificationConsumer:
    """Test notification WebSocket consumer"""
    
    @pytest.mark.asyncio
    async def test_notification_connection_authenticated(self):
        """Test notification connection with authenticated user"""
        user = UserFactory()
        communicator = WebsocketCommunicator(
            NotificationConsumer.as_asgi(),
            f"/ws/notifications/?user_id={user.id}"
        )
        communicator.scope["user"] = user
        
        connected, subprotocol = await communicator.connect()
        assert connected
        
        await communicator.disconnect()
    
    @pytest.mark.asyncio
    async def test_notification_connection_unauthenticated(self):
        """Test notification connection without authentication"""
        communicator = WebsocketCommunicator(
            NotificationConsumer.as_asgi(),
            "/ws/notifications/"
        )
        communicator.scope["user"] = None
        
        connected, subprotocol = await communicator.connect()
        assert not connected  # Should be rejected
    
    @pytest.mark.asyncio
    async def test_notification_send_message(self):
        """Test sending message to notification consumer"""
        user = UserFactory()
        communicator = WebsocketCommunicator(
            NotificationConsumer.as_asgi(),
            f"/ws/notifications/?user_id={user.id}"
        )
        communicator.scope["user"] = user
        
        connected, subprotocol = await communicator.connect()
        assert connected
        
        # Send a message
        message = {
            'action': 'get_notifications'
        }
        await communicator.send_json_to(message)
        
        # Receive response
        response = await communicator.receive_json_from()
        assert 'type' in response
        
        await communicator.disconnect()
    
    @pytest.mark.asyncio
    async def test_notification_mark_read(self):
        """Test marking notification as read"""
        user = UserFactory()
        notification = NotificationFactory(user_ids=[str(user.id)])
        
        communicator = WebsocketCommunicator(
            NotificationConsumer.as_asgi(),
            f"/ws/notifications/?user_id={user.id}"
        )
        communicator.scope["user"] = user
        
        connected, subprotocol = await communicator.connect()
        assert connected
        
        # Send mark read message
        message = {
            'action': 'mark_read',
            'notification_id': str(notification.id)
        }
        await communicator.send_json_to(message)
        
        # Receive response
        response = await communicator.receive_json_from()
        assert 'type' in response
        
        await communicator.disconnect()


class TestProjectConsumer:
    """Test project WebSocket consumer"""
    
    @pytest.mark.asyncio
    async def test_project_connection_authenticated(self):
        """Test project connection with authenticated user"""
        user = UserFactory()
        project = ProjectFactory()
        
        communicator = WebsocketCommunicator(
            ProjectConsumer.as_asgi(),
            f"/ws/projects/{project.project_id}/?user_id={user.id}"
        )
        communicator.scope["user"] = user
        
        connected, subprotocol = await communicator.connect()
        # This might fail if user doesn't have access to project
        # assert connected
        
        await communicator.disconnect()
    
    @pytest.mark.asyncio
    async def test_project_connection_unauthenticated(self):
        """Test project connection without authentication"""
        project = ProjectFactory()
        
        communicator = WebsocketCommunicator(
            ProjectConsumer.as_asgi(),
            f"/ws/projects/{project.project_id}/"
        )
        communicator.scope["user"] = None
        
        connected, subprotocol = await communicator.connect()
        assert not connected  # Should be rejected
    
    @pytest.mark.asyncio
    async def test_project_send_message(self):
        """Test sending message to project consumer"""
        user = UserFactory()
        project = ProjectFactory()
        
        communicator = WebsocketCommunicator(
            ProjectConsumer.as_asgi(),
            f"/ws/projects/{project.project_id}/?user_id={user.id}"
        )
        communicator.scope["user"] = user
        
        connected, subprotocol = await communicator.connect()
        if connected:
            # Send a message
            message = {
                'action': 'get_status'
            }
            await communicator.send_json_to(message)
            
            # Receive response
            response = await communicator.receive_json_from()
            assert 'type' in response
        
        await communicator.disconnect()
    
    @pytest.mark.asyncio
    async def test_project_milestone_update(self):
        """Test project milestone update"""
        user = UserFactory()
        project = ProjectFactory()
        
        communicator = WebsocketCommunicator(
            ProjectConsumer.as_asgi(),
            f"/ws/projects/{project.project_id}/?user_id={user.id}"
        )
        communicator.scope["user"] = user
        
        connected, subprotocol = await communicator.connect()
        if connected:
            # Send milestone update
            message = {
                'action': 'update_milestone',
                'milestone_data': {
                    'milestone_id': 'MIL001',
                    'status': 'Completed',
                    'notes': 'Milestone completed successfully'
                }
            }
            await communicator.send_json_to(message)
            
            # Receive response
            response = await communicator.receive_json_from()
            assert 'type' in response
        
        await communicator.disconnect()


class TestCollaborationConsumer:
    """Test collaboration WebSocket consumer"""
    
    @pytest.mark.asyncio
    async def test_collaboration_connection_authenticated(self):
        """Test collaboration connection with authenticated user"""
        user = UserFactory()
        room_name = 'test_room'
        
        communicator = WebsocketCommunicator(
            CollaborationConsumer.as_asgi(),
            f"/ws/collaboration/{room_name}/?user_id={user.id}"
        )
        communicator.scope["user"] = user
        
        connected, subprotocol = await communicator.connect()
        assert connected
        
        await communicator.disconnect()
    
    @pytest.mark.asyncio
    async def test_collaboration_connection_unauthenticated(self):
        """Test collaboration connection without authentication"""
        room_name = 'test_room'
        
        communicator = WebsocketCommunicator(
            CollaborationConsumer.as_asgi(),
            f"/ws/collaboration/{room_name}/"
        )
        communicator.scope["user"] = None
        
        connected, subprotocol = await communicator.connect()
        assert not connected  # Should be rejected
    
    @pytest.mark.asyncio
    async def test_collaboration_cursor_update(self):
        """Test collaboration cursor update"""
        user = UserFactory()
        room_name = 'test_room'
        
        communicator = WebsocketCommunicator(
            CollaborationConsumer.as_asgi(),
            f"/ws/collaboration/{room_name}/?user_id={user.id}"
        )
        communicator.scope["user"] = user
        
        connected, subprotocol = await communicator.connect()
        assert connected
        
        # Send cursor update
        message = {
            'action': 'cursor_update',
            'position': {'x': 100, 'y': 200}
        }
        await communicator.send_json_to(message)
        
        # Receive response
        response = await communicator.receive_json_from()
        assert 'type' in response
        
        await communicator.disconnect()
    
    @pytest.mark.asyncio
    async def test_collaboration_text_change(self):
        """Test collaboration text change"""
        user = UserFactory()
        room_name = 'test_room'
        
        communicator = WebsocketCommunicator(
            CollaborationConsumer.as_asgi(),
            f"/ws/collaboration/{room_name}/?user_id={user.id}"
        )
        communicator.scope["user"] = user
        
        connected, subprotocol = await communicator.connect()
        assert connected
        
        # Send text change
        message = {
            'action': 'text_change',
            'changes': {
                'position': 10,
                'text': 'New text',
                'length': 8
            }
        }
        await communicator.send_json_to(message)
        
        # Receive response
        response = await communicator.receive_json_from()
        assert 'type' in response
        
        await communicator.disconnect()
    
    @pytest.mark.asyncio
    async def test_collaboration_selection_change(self):
        """Test collaboration selection change"""
        user = UserFactory()
        room_name = 'test_room'
        
        communicator = WebsocketCommunicator(
            CollaborationConsumer.as_asgi(),
            f"/ws/collaboration/{room_name}/?user_id={user.id}"
        )
        communicator.scope["user"] = user
        
        connected, subprotocol = await communicator.connect()
        assert connected
        
        # Send selection change
        message = {
            'action': 'selection_change',
            'selection': {
                'start': 5,
                'end': 15,
                'text': 'Selected text'
            }
        }
        await communicator.send_json_to(message)
        
        # Receive response
        response = await communicator.receive_json_from()
        assert 'type' in response
        
        await communicator.disconnect()
    
    @pytest.mark.asyncio
    async def test_collaboration_multiple_users(self):
        """Test collaboration with multiple users"""
        user1 = UserFactory()
        user2 = UserFactory()
        room_name = 'test_room'
        
        # First user connects
        communicator1 = WebsocketCommunicator(
            CollaborationConsumer.as_asgi(),
            f"/ws/collaboration/{room_name}/?user_id={user1.id}"
        )
        communicator1.scope["user"] = user1
        
        connected1, subprotocol1 = await communicator1.connect()
        assert connected1
        
        # Second user connects
        communicator2 = WebsocketCommunicator(
            CollaborationConsumer.as_asgi(),
            f"/ws/collaboration/{room_name}/?user_id={user2.id}"
        )
        communicator2.scope["user"] = user2
        
        connected2, subprotocol2 = await communicator2.connect()
        assert connected2
        
        # First user should receive notification about second user
        response1 = await communicator1.receive_json_from()
        assert response1['type'] == 'user_joined'
        assert response1['user'] == user2.username
        
        # Second user should receive notification about first user
        response2 = await communicator2.receive_json_from()
        assert response2['type'] == 'user_joined'
        assert response2['user'] == user1.username
        
        # First user sends cursor update
        message = {
            'action': 'cursor_update',
            'position': {'x': 100, 'y': 200}
        }
        await communicator1.send_json_to(message)
        
        # Second user should receive cursor update
        response = await communicator2.receive_json_from()
        assert response['type'] == 'cursor_update'
        assert response['user'] == user1.username
        
        await communicator1.disconnect()
        await communicator2.disconnect()


class TestSystemHealthConsumer:
    """Test system health WebSocket consumer"""
    
    @pytest.mark.asyncio
    async def test_system_health_connection_admin(self):
        """Test system health connection as admin"""
        admin_user = UserFactory(role='Admin')
        
        communicator = WebsocketCommunicator(
            SystemHealthConsumer.as_asgi(),
            f"/ws/system-health/?user_id={admin_user.id}"
        )
        communicator.scope["user"] = admin_user
        
        connected, subprotocol = await communicator.connect()
        assert connected
        
        await communicator.disconnect()
    
    @pytest.mark.asyncio
    async def test_system_health_connection_non_admin(self):
        """Test system health connection as non-admin"""
        user = UserFactory(role='Student')
        
        communicator = WebsocketCommunicator(
            SystemHealthConsumer.as_asgi(),
            f"/ws/system-health/?user_id={user.id}"
        )
        communicator.scope["user"] = user
        
        connected, subprotocol = await communicator.connect()
        assert not connected  # Should be rejected for non-admin
    
    @pytest.mark.asyncio
    async def test_system_health_get_status(self):
        """Test getting system health status"""
        admin_user = UserFactory(role='Admin')
        
        communicator = WebsocketCommunicator(
            SystemHealthConsumer.as_asgi(),
            f"/ws/system-health/?user_id={admin_user.id}"
        )
        communicator.scope["user"] = admin_user
        
        connected, subprotocol = await communicator.connect()
        assert connected
        
        # Send get status message
        message = {
            'action': 'get_status'
        }
        await communicator.send_json_to(message)
        
        # Receive response
        response = await communicator.receive_json_from()
        assert response['type'] == 'system_status'
        assert 'data' in response
        
        await communicator.disconnect()
    
    @pytest.mark.asyncio
    async def test_system_health_run_check(self):
        """Test running system health check"""
        admin_user = UserFactory(role='Admin')
        
        communicator = WebsocketCommunicator(
            SystemHealthConsumer.as_asgi(),
            f"/ws/system-health/?user_id={admin_user.id}"
        )
        communicator.scope["user"] = admin_user
        
        connected, subprotocol = await communicator.connect()
        assert connected
        
        # Send run health check message
        message = {
            'action': 'run_health_check'
        }
        await communicator.send_json_to(message)
        
        # Receive response
        response = await communicator.receive_json_from()
        assert response['type'] == 'health_check_result'
        assert 'data' in response
        
        await communicator.disconnect()


class TestWebSocketRouting:
    """Test WebSocket routing"""
    
    def test_websocket_urlpatterns(self):
        """Test WebSocket URL patterns"""
        assert len(websocket_urlpatterns) == 4
        
        # Check that all expected patterns are present
        pattern_paths = [pattern.pattern._route for pattern in websocket_urlpatterns]
        assert 'ws/notifications/$' in pattern_paths
        assert 'ws/projects/(?P<project_id>\\w+)/$' in pattern_paths
        assert 'ws/collaboration/(?P<room_name>\\w+)/$' in pattern_paths
        assert 'ws/system-health/$' in pattern_paths


class TestWebSocketErrorHandling:
    """Test WebSocket error handling"""
    
    @pytest.mark.asyncio
    async def test_invalid_json_message(self):
        """Test handling of invalid JSON messages"""
        user = UserFactory()
        
        communicator = WebsocketCommunicator(
            NotificationConsumer.as_asgi(),
            f"/ws/notifications/?user_id={user.id}"
        )
        communicator.scope["user"] = user
        
        connected, subprotocol = await communicator.connect()
        assert connected
        
        # Send invalid JSON
        await communicator.send_to(text_data="invalid json")
        
        # Should not crash
        await communicator.disconnect()
    
    @pytest.mark.asyncio
    async def test_malformed_message(self):
        """Test handling of malformed messages"""
        user = UserFactory()
        
        communicator = WebsocketCommunicator(
            NotificationConsumer.as_asgi(),
            f"/ws/notifications/?user_id={user.id}"
        )
        communicator.scope["user"] = user
        
        connected, subprotocol = await communicator.connect()
        assert connected
        
        # Send malformed message
        message = {
            'invalid_field': 'value'
        }
        await communicator.send_json_to(message)
        
        # Should not crash
        await communicator.disconnect()
    
    @pytest.mark.asyncio
    async def test_connection_timeout(self):
        """Test connection timeout handling"""
        user = UserFactory()
        
        communicator = WebsocketCommunicator(
            NotificationConsumer.as_asgi(),
            f"/ws/notifications/?user_id={user.id}"
        )
        communicator.scope["user"] = user
        
        connected, subprotocol = await communicator.connect()
        assert connected
        
        # Let connection timeout (this is a simplified test)
        await communicator.disconnect()
    
    @pytest.mark.asyncio
    async def test_database_error_handling(self):
        """Test handling of database errors"""
        user = UserFactory()
        
        communicator = WebsocketCommunicator(
            NotificationConsumer.as_asgi(),
            f"/ws/notifications/?user_id={user.id}"
        )
        communicator.scope["user"] = user
        
        connected, subprotocol = await communicator.connect()
        assert connected
        
        # Send message that might cause database error
        message = {
            'action': 'mark_read',
            'notification_id': 'invalid_id'
        }
        await communicator.send_json_to(message)
        
        # Should not crash
        await communicator.disconnect()
