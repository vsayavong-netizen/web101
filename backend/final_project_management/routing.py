"""
WebSocket URL routing for real-time features
"""
from django.urls import re_path
from final_project_management.consumers import (
    NotificationConsumer,
    ProjectConsumer,
    CollaborationConsumer,
    SystemHealthConsumer
)

websocket_urlpatterns = [
    re_path(r'ws/notifications/$', NotificationConsumer.as_asgi()),
    re_path(r'ws/projects/(?P<project_id>\w+)/$', ProjectConsumer.as_asgi()),
    re_path(r'ws/collaboration/(?P<room_name>\w+)/$', CollaborationConsumer.as_asgi()),
    re_path(r'ws/system-health/$', SystemHealthConsumer.as_asgi()),
]
