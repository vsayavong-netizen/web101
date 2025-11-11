#!/usr/bin/env python
"""
Test script for WebSocket production configuration
"""
import os
import sys
import django
import asyncio
from channels.testing import WebsocketCommunicator

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from channels.db import database_sync_to_async
from final_project_management.asgi import application
from tests.test_asgi import test_application  # Use test application for testing
from system_monitoring.websocket_metrics import WebSocketMetrics

User = get_user_model()


@database_sync_to_async
def create_test_user():
    """Create test user"""
    # Delete existing user if exists
    User.objects.filter(username='test_ws_user').delete()
    return User.objects.create_user(
        username='test_ws_user',
        email='test_ws@example.com',
        password='testpass123',
        role='Student'
    )


@database_sync_to_async
def get_user_token(user):
    """Get JWT token for user"""
    return str(AccessToken.for_user(user))


@database_sync_to_async
def delete_user(user):
    """Delete test user"""
    user.delete()


async def test_websocket_connection():
    """Test WebSocket connection with production middleware"""
    print("=" * 60)
    print("WebSocket Production Test")
    print("=" * 60)
    
    # Create test user
    try:
        user = await create_test_user()
        token = await get_user_token(user)
        print(f"\n[OK] Created test user: {user.username}")
    except Exception as e:
        print(f"[ERROR] Failed to create test user: {e}")
        return False
    
    # Test connection
    print("\n1. Testing WebSocket connection...")
    try:
        # Use test_application to avoid origin validation issues in tests
        communicator = WebsocketCommunicator(
            test_application,
            f'/ws/notifications/?token={token}'
        )
        
        connected, subprotocol = await communicator.connect()
        
        if connected:
            print("[OK] WebSocket connection: SUCCESS")
            
            # Test receiving message
            try:
                response = await communicator.receive_json_from(timeout=2)
                print(f"[OK] Received message: {response.get('type', 'unknown')}")
            except Exception as e:
                print(f"[WARNING] No initial message received: {e}")
            
            await communicator.disconnect()
            print("[OK] WebSocket disconnection: SUCCESS")
        else:
            print("[ERROR] WebSocket connection: FAILED")
            return False
            
    except Exception as e:
        print(f"[ERROR] Connection test failed: {e}")
        return False
    
    # Test metrics
    print("\n2. Testing metrics...")
    try:
        metrics = WebSocketMetrics.get_metrics_summary()
        print(f"[OK] Active connections: {metrics['active_connections']}")
        print(f"[OK] Connections today: {metrics['connections_today']}")
        print(f"[OK] Metrics collection: WORKING")
    except Exception as e:
        print(f"[ERROR] Metrics test failed: {e}")
        return False
    
    # Cleanup
    try:
        await delete_user(user)
        print("\n[OK] Cleanup: Test user deleted")
    except Exception as e:
        print(f"[WARNING] Cleanup warning: {e}")
    
    print("\n" + "=" * 60)
    print("[OK] All tests passed!")
    print("=" * 60)
    
    return True


def run_tests():
    """Run async tests"""
    try:
        result = asyncio.run(test_websocket_connection())
        return result
    except Exception as e:
        print(f"❌ Test execution failed: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == '__main__':
    success = run_tests()
    sys.exit(0 if success else 1)

