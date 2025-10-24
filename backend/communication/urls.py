from django.urls import path
from . import views

urlpatterns = [
    # Channels
    path('channels/', views.CommunicationChannelListView.as_view(), name='channel-list'),
    path('channels/<uuid:pk>/', views.CommunicationChannelDetailView.as_view(), name='channel-detail'),
    path('channels/invite/', views.invite_to_channel, name='channel-invite'),
    
    # Messages
    path('channels/<uuid:channel_id>/messages/', views.MessageListView.as_view(), name='message-list'),
    path('messages/<uuid:pk>/', views.MessageDetailView.as_view(), name='message-detail'),
    path('messages/send/', views.send_message, name='message-send'),
    path('messages/search/', views.search_messages, name='message-search'),
    path('messages/<uuid:message_id>/mark-read/', views.mark_as_read, name='message-mark-read'),
    path('channels/<uuid:channel_id>/mark-read/', views.mark_channel_as_read, name='channel-mark-read'),
    
    # Reactions
    path('messages/<uuid:message_id>/reactions/', views.MessageReactionListView.as_view(), name='message-reactions'),
    path('messages/<uuid:message_id>/reactions/add/', views.add_reaction, name='message-add-reaction'),
    path('messages/<uuid:message_id>/reactions/remove/', views.remove_reaction, name='message-remove-reaction'),
    
    # Message reads
    path('messages/<uuid:message_id>/reads/', views.MessageReadListView.as_view(), name='message-reads'),
    
    # Direct messages
    path('direct-messages/send/', views.send_direct_message, name='direct-message-send'),
    
    # Logs and analysis
    path('logs/', views.CommunicationLogListView.as_view(), name='communication-logs'),
    path('analysis/', views.CommunicationAnalysisListView.as_view(), name='communication-analysis'),
    path('statistics/', views.communication_statistics, name='communication-statistics'),
    
    # Settings
    path('settings/', views.CommunicationSettingsView.as_view(), name='communication-settings'),
]
