from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

# Create router for ViewSets
router = DefaultRouter()
router.register(r'users', views.UserViewSet)

urlpatterns = [
    # Authentication
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # User management
    path('users/', views.UserListView.as_view(), name='user-list'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user-detail'),
    path('me/', views.current_user, name='current-user'),
    
    # Password management
    path('password/change/', views.PasswordChangeView.as_view(), name='password-change'),
    path('password/reset/request/', views.PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password/reset/confirm/', views.PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    
    # Session management
    path('sessions/', views.UserSessionsView.as_view(), name='user-sessions'),
    path('sessions/<int:session_id>/deactivate/', views.DeactivateSessionView.as_view(), name='deactivate-session'),
    
    # AI Assistant
    path('ai-assistant/toggle/', views.toggle_ai_assistant, name='toggle-ai-assistant'),
    
    # Dashboard and analytics
    path('dashboard/', views.user_dashboard, name='user-dashboard'),
    path('export/', views.export_users, name='export-users'),
    path('activity-log/<int:user_id>/', views.user_activity_log, name='user-activity-log'),
] + router.urls
