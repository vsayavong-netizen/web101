"""
Authentication URL patterns
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenBlacklistView
from . import views

app_name = 'authentication'

urlpatterns = [
    # JWT Token endpoints
    path('login/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', views.CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('token/blacklist/', TokenBlacklistView.as_view(), name='token_blacklist'),
    
    # User management endpoints
    path('register/', views.UserRegistrationView.as_view(), name='user_register'),
    path('profile/', views.UserProfileView.as_view(), name='user_profile'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change_password'),
    path('password-reset/', views.PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset/confirm/', views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    
    # Utility endpoints
    path('user-info/', views.user_info, name='user_info'),
    path('force-password-change/', views.force_password_change, name='force_password_change'),
    path('switch-academic-year/', views.switch_academic_year, name='switch_academic_year'),
]
