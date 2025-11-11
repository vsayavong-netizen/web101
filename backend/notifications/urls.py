from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router for ViewSets
router = DefaultRouter()
# router.register(r'notifications', views.NotificationViewSet)  # Uncomment when ViewSet is created

# Function-based view URLs
function_urls = [
    # Notifications
    path('', views.NotificationListView.as_view(), name='notification-list'),
    path('<int:pk>/', views.NotificationDetailView.as_view(), name='notification-detail'),
    
    # Notification templates
    path('templates/', views.NotificationTemplateListView.as_view(), name='notification-template-list'),
    path('templates/<int:pk>/', views.NotificationTemplateDetailView.as_view(), name='notification-template-detail'),
    
    # Notification subscriptions
    path('subscriptions/', views.NotificationSubscriptionListView.as_view(), name='notification-subscription-list'),
    path('subscriptions/<int:pk>/', views.NotificationSubscriptionDetailView.as_view(), name='notification-subscription-detail'),
    
    # Notification logs
    path('logs/', views.NotificationLogListView.as_view(), name='notification-log-list'),
    path('logs/<int:pk>/', views.NotificationLogDetailView.as_view(), name='notification-log-detail'),
    
    # Notification announcements
    path('announcements/', views.NotificationAnnouncementListView.as_view(), name='notification-announcement-list'),
    path('announcements/<int:pk>/', views.NotificationAnnouncementDetailView.as_view(), name='notification-announcement-detail'),
    
    # Notification preferences
    path('preferences/', views.NotificationPreferenceListView.as_view(), name='notification-preference-list'),
    path('preferences/<int:pk>/', views.NotificationPreferenceDetailView.as_view(), name='notification-preference-detail'),
    
    # User-specific notifications
    path('user/<str:user_id>/', views.user_notifications, name='user-notifications'),
    path('mark-read/', views.mark_notifications_read, name='mark-notifications-read'),
    path('mark-archived/', views.mark_notifications_archived, name='mark-notifications-archived'),
    
    # Statistics and search
    path('statistics/', views.notification_statistics, name='notification-statistics'),
    path('search/', views.notification_search, name='notification-search'),
    path('bulk-update/', views.bulk_update_notifications, name='bulk-update-notifications'),
    
    # Dashboard and analytics (commented out until views are created)
    # path('dashboard/', views.notification_dashboard, name='notification-dashboard'),
    # path('export/', views.export_notifications, name='export-notifications'),
]

# Combine all URLs
urlpatterns = function_urls + router.urls