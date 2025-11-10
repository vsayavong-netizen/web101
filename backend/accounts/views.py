from rest_framework import status, generics, permissions, viewsets, filters
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import login, logout
from django.utils import timezone
from django.conf import settings
from django.db.models import Q, Count
from django_filters.rest_framework import DjangoFilterBackend
import uuid

from .models import User, UserSession, PasswordResetToken
from .serializers import (
    UserSerializer, UserCreateSerializer, UserUpdateSerializer,
    PasswordChangeSerializer, LoginSerializer, UserSessionSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer,
    UserBulkUpdateSerializer, UserSearchSerializer, UserStatisticsSerializer,
    UserProfileSerializer
)


class UserListView(generics.ListCreateAPIView):
    """List and create users."""
    
    queryset = User.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UserCreateSerializer
        return UserSerializer
    
    def get_queryset(self):
        """Filter users based on role and permissions."""
        user = self.request.user
        queryset = User.objects.all()
        
        # Students can only see themselves
        if user.role == 'Student':
            queryset = queryset.filter(id=user.id)
        
        # Advisors can see students and other advisors
        elif user.role == 'Advisor':
            queryset = queryset.filter(role__in=['Student', 'Advisor'])
        
        # Department admins can see students, advisors, and other dept admins
        elif user.role == 'DepartmentAdmin':
            queryset = queryset.filter(role__in=['Student', 'Advisor', 'DepartmentAdmin'])
        
        # Admins can see everyone
        elif user.role == 'Admin':
            pass  # No filtering
        
        return queryset


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a user."""
    
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserUpdateSerializer
        return UserSerializer
    
    def get_queryset(self):
        """Filter based on user permissions."""
        user = self.request.user
        
        if user.role == 'Student':
            return User.objects.filter(id=user.id)
        elif user.role == 'Advisor':
            return User.objects.filter(role__in=['Student', 'Advisor'])
        elif user.role == 'DepartmentAdmin':
            return User.objects.filter(role__in=['Student', 'Advisor', 'DepartmentAdmin'])
        else:  # Admin
            return User.objects.all()


class LoginView(APIView):
    """Handle user login."""
    
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Create or update user session
            session_key = str(uuid.uuid4())
            UserSession.objects.create(
                user=user,
                session_key=session_key,
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                last_activity=timezone.now()
            )
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token
            
            return Response({
                'access': str(access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    """Handle user logout."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        # Blacklist the refresh token
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            pass
        
        # Deactivate user sessions
        UserSession.objects.filter(
            user=request.user,
            is_active=True
        ).update(is_active=False)
        
        return Response({"message": "Successfully logged out."})


class PasswordChangeView(APIView):
    """Handle password change."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.must_change_password = False
            user.save()
            return Response({"message": "Password changed successfully."})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetRequestView(APIView):
    """Handle password reset request."""
    
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            user = User.objects.get(email=email)
            
            # Create password reset token
            token = str(uuid.uuid4())
            PasswordResetToken.objects.create(
                user=user,
                token=token,
                expires_at=timezone.now() + timezone.timedelta(hours=24)
            )
            
            # TODO: Send email with reset link
            # For now, just return the token (remove in production)
            return Response({
                "message": "Password reset token sent to email.",
                "token": token  # Remove this in production
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetConfirmView(APIView):
    """Handle password reset confirmation."""
    
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            reset_token = serializer.validated_data['reset_token']
            user = reset_token.user
            new_password = serializer.validated_data['new_password']
            
            # Update password
            user.set_password(new_password)
            user.must_change_password = False
            user.save()
            
            # Mark token as used
            reset_token.is_used = True
            reset_token.save()
            
            return Response({"message": "Password reset successfully."})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserSessionsView(generics.ListAPIView):
    """List user sessions."""
    
    serializer_class = UserSessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UserSession.objects.filter(user=self.request.user, is_active=True)


class DeactivateSessionView(APIView):
    """Deactivate a specific user session."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, session_id):
        try:
            session = UserSession.objects.get(
                id=session_id,
                user=request.user,
                is_active=True
            )
            session.is_active = False
            session.save()
            return Response({"message": "Session deactivated successfully."})
        except UserSession.DoesNotExist:
            return Response(
                {"error": "Session not found."},
                status=status.HTTP_404_NOT_FOUND
            )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def current_user(request):
    """Get current user information."""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def toggle_ai_assistant(request):
    """Toggle AI assistant for current user."""
    user = request.user
    user.is_ai_assistant_enabled = not user.is_ai_assistant_enabled
    user.save()
    
    return Response({
        "message": f"AI assistant {'enabled' if user.is_ai_assistant_enabled else 'disabled'}.",
        "is_ai_assistant_enabled": user.is_ai_assistant_enabled
    })


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet for comprehensive user management."""
    
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]  # Temporarily allow anonymous access for testing
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['role', 'is_active', 'current_academic_year', 'email']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['username', 'email', 'date_joined', 'last_login']
    ordering = ['-date_joined']
    pagination_class = PageNumberPagination
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        elif self.action == 'profile':
            return UserProfileSerializer
        return UserSerializer
    
    def get_queryset(self):
        """Filter users based on role and permissions."""
        user = self.request.user
        queryset = User.objects.all()
        
        # Filter by email if provided in query params (before role filtering)
        email = self.request.query_params.get('email')
        if email:
            queryset = queryset.filter(email=email)
        
        # If user is not authenticated, return filtered queryset (by email if provided)
        if not user.is_authenticated:
            return queryset
        
        # Students can only see themselves
        if hasattr(user, 'role') and user.role == 'Student':
            queryset = queryset.filter(id=user.id)
        
        # Advisors can see students and other advisors
        elif hasattr(user, 'role') and user.role == 'Advisor':
            queryset = queryset.filter(role__in=['Student', 'Advisor'])
        
        # Department admins can see students, advisors, and other dept admins
        elif hasattr(user, 'role') and user.role == 'DepartmentAdmin':
            queryset = queryset.filter(role__in=['Student', 'Advisor', 'DepartmentAdmin'])
        
        # Admins can see everyone
        elif hasattr(user, 'role') and user.role == 'Admin':
            pass  # No filtering
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """Bulk update users."""
        serializer = UserBulkUpdateSerializer(data=request.data)
        if serializer.is_valid():
            user_ids = serializer.validated_data['user_ids']
            updates = serializer.validated_data['updates']
            
            # Update users
            updated_count = User.objects.filter(id__in=user_ids).update(**updates)
            
            return Response({
                'message': f'Successfully updated {updated_count} users.',
                'updated_count': updated_count
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search users with advanced filtering."""
        serializer = UserSearchSerializer(data=request.query_params)
        if serializer.is_valid():
            query = serializer.validated_data.get('query', '')
            role = serializer.validated_data.get('role')
            is_active = serializer.validated_data.get('is_active')
            
            queryset = self.get_queryset()
            
            if query:
                queryset = queryset.filter(
                    Q(username__icontains=query) |
                    Q(email__icontains=query) |
                    Q(first_name__icontains=query) |
                    Q(last_name__icontains=query)
                )
            
            if role:
                queryset = queryset.filter(role=role)
            
            if is_active is not None:
                queryset = queryset.filter(is_active=is_active)
            
            # Apply pagination
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = UserSerializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            
            serializer = UserSerializer(queryset, many=True)
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get user statistics."""
        queryset = self.get_queryset()
        
        total_users = queryset.count()
        active_users = queryset.filter(is_active=True).count()
        inactive_users = queryset.filter(is_active=False).count()
        
        # Users by role
        users_by_role = {}
        for role in ['Admin', 'DepartmentAdmin', 'Advisor', 'Student']:
            users_by_role[role] = queryset.filter(role=role).count()
        
        # Recent registrations (last 30 days)
        recent_registrations = queryset.filter(
            date_joined__gte=timezone.now() - timedelta(days=30)
        ).count()
        
        # Last login stats
        last_login_stats = {
            'never_logged_in': queryset.filter(last_login__isnull=True).count(),
            'logged_in_last_week': queryset.filter(
                last_login__gte=timezone.now() - timedelta(days=7)
            ).count(),
            'logged_in_last_month': queryset.filter(
                last_login__gte=timezone.now() - timedelta(days=30)
            ).count()
        }
        
        statistics = {
            'total_users': total_users,
            'active_users': active_users,
            'inactive_users': inactive_users,
            'users_by_role': users_by_role,
            'recent_registrations': recent_registrations,
            'last_login_stats': last_login_stats
        }
        
        serializer = UserStatisticsSerializer(statistics)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def profile(self, request, pk=None):
        """Get detailed user profile."""
        user = self.get_object()
        serializer = UserProfileSerializer(user)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate user account."""
        user = self.get_object()
        user.is_active = True
        user.save()
        return Response({'message': 'User activated successfully.'})
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate user account."""
        user = self.get_object()
        user.is_active = False
        user.save()
        return Response({'message': 'User deactivated successfully.'})
    
    @action(detail=True, methods=['get'])
    def sessions(self, request, pk=None):
        """Get user sessions."""
        user = self.get_object()
        sessions = user.sessions.all().order_by('-created_at')
        serializer = UserSessionSerializer(sessions, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def terminate_sessions(self, request, pk=None):
        """Terminate all user sessions."""
        user = self.get_object()
        sessions = user.sessions.filter(is_active=True)
        sessions.update(is_active=False)
        return Response({'message': f'Terminated {sessions.count()} sessions.'})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_dashboard(request):
    """Get user dashboard data."""
    user = request.user
    
    dashboard_data = {
        'user': UserProfileSerializer(user).data,
        'recent_activity': [],
        'notifications': [],
        'quick_stats': {}
    }
    
    # Add role-specific data
    if user.role == 'Student':
        # Student-specific dashboard data
        dashboard_data['quick_stats'] = {
            'total_projects': 0,  # Would be calculated from actual data
            'active_projects': 0,
            'completed_milestones': 0,
            'upcoming_deadlines': 0
        }
    elif user.role == 'Advisor':
        # Advisor-specific dashboard data
        dashboard_data['quick_stats'] = {
            'total_students': 0,  # Would be calculated from actual data
            'active_projects': 0,
            'pending_reviews': 0,
            'workload_percentage': 0
        }
    elif user.role == 'Admin':
        # Admin-specific dashboard data
        dashboard_data['quick_stats'] = {
            'total_users': User.objects.count(),
            'active_users': User.objects.filter(is_active=True).count(),
            'total_projects': 0,  # Would be calculated from actual data
            'system_health': 'Good'
        }
    
    return Response(dashboard_data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def export_users(request):
    """Export users data."""
    # This would typically generate and return a file
    # For now, return a placeholder response
    return Response({
        'message': 'Export functionality would be implemented here',
        'export_url': '/api/users/export/download/',
        'status': 'processing'
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_activity_log(request, user_id):
    """Get user activity log."""
    try:
        user = User.objects.get(id=user_id)
        # Check permissions
        if request.user.role not in ['Admin', 'DepartmentAdmin'] and request.user.id != user.id:
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get user sessions as activity log
        sessions = user.sessions.all().order_by('-created_at')
        serializer = UserSessionSerializer(sessions, many=True)
        
        return Response({
            'user': UserSerializer(user).data,
            'activity_log': serializer.data,
            'total_sessions': sessions.count()
        })
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
