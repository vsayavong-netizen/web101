"""
Authentication views for JWT-based authentication
"""

from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.db import transaction
from django.conf import settings

from accounts.models import User
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserRegistrationSerializer,
    UserProfileSerializer,
    ChangePasswordSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    UserLoginSerializer,
    TokenRefreshSerializer,
    LogoutSerializer
)
from core.utils import get_client_ip


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom JWT token obtain view with additional user information
    """
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        try:
            response = super().post(request, *args, **kwargs)
            
            if response.status_code == 200:
                # Log successful login
                user = authenticate(
                    username=request.data.get('username'),
                    password=request.data.get('password')
                )
                if user:
                    user.last_login_ip = get_client_ip(request)
                    user.save(update_fields=['last_login_ip'])
            
            return response
        except Exception as e:
            # Handle unexpected errors gracefully
            return Response({
                'detail': 'An error occurred during login. Please try again.',
                'error': str(e) if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CustomTokenRefreshView(TokenRefreshView):
    """
    Custom JWT token refresh view
    """
    serializer_class = TokenRefreshSerializer


class UserRegistrationView(generics.CreateAPIView):
    """
    User registration view with improved error handling
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        
        # Validate data and return detailed errors if validation fails
        if not serializer.is_valid():
            # Format errors for better frontend consumption
            errors = {}
            for field, field_errors in serializer.errors.items():
                if isinstance(field_errors, list):
                    errors[field] = field_errors[0] if len(field_errors) == 1 else field_errors
                else:
                    errors[field] = field_errors
            
            return Response({
                'errors': errors,
                'message': 'Registration failed. Please check the errors below.',
                'detail': 'Validation error'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            with transaction.atomic():
                user = serializer.save()
                
                # Generate tokens for new user
                refresh = RefreshToken.for_user(user)
                access_token = refresh.access_token
                
                return Response({
                    'user': UserProfileSerializer(user).data,
                    'tokens': {
                        'access': str(access_token),
                        'refresh': str(refresh)
                    },
                    'message': 'User registered successfully'
                }, status=status.HTTP_201_CREATED)
        except Exception as e:
            # Handle unexpected errors
            return Response({
                'errors': {'non_field_errors': [str(e)]},
                'message': 'An error occurred during registration. Please try again.',
                'detail': 'Internal server error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    User profile view for viewing and updating user information
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        # Prevent users from changing certain fields
        if 'role' in request.data:
            request.data.pop('role')
        if 'academic_year' in request.data:
            request.data.pop('academic_year')
        
        return super().update(request, *args, **kwargs)


class ChangePasswordView(APIView):
    """
    Change password view
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'message': 'Password changed successfully'
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetRequestView(APIView):
    """
    Password reset request view
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        
        if serializer.is_valid():
            email = serializer.validated_data['email']
            user = User.objects.get(email=email)
            
            # Generate password reset token
            refresh = RefreshToken.for_user(user)
            reset_token = refresh.access_token
            
            # In a real application, you would send this token via email
            # For now, we'll just return it (for development purposes)
            return Response({
                'message': 'Password reset token generated',
                'reset_token': str(reset_token)  # Remove this in production
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetConfirmView(APIView):
    """
    Password reset confirmation view
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        
        if serializer.is_valid():
            # In a real application, you would validate the token
            # For now, we'll just update the password
            token = serializer.validated_data['token']
            new_password = serializer.validated_data['new_password']
            
            # Find user by token (simplified for demo)
            # In production, you would decode and validate the JWT token
            try:
                # This is a simplified implementation
                # In production, use proper JWT token validation
                user = User.objects.get(id=1)  # Replace with actual token validation
                user.set_password(new_password)
                user.must_change_password = False
                user.save()
                
                return Response({
                    'message': 'Password reset successfully'
                }, status=status.HTTP_200_OK)
            except User.DoesNotExist:
                return Response({
                    'error': 'Invalid reset token'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    """
    Logout view with token blacklisting
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                refresh_token = serializer.validated_data['refresh']
                token = RefreshToken(refresh_token)
                token.blacklist()
                
                return Response({
                    'message': 'Logged out successfully'
                }, status=status.HTTP_200_OK)
            except Exception as e:
                return Response({
                    'error': 'Invalid token'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def force_password_change(request):
    """
    Force user to change password (admin only)
    """
    if not request.user.is_admin():
        return Response({
            'error': 'Permission denied'
        }, status=status.HTTP_403_FORBIDDEN)
    
    user_id = request.data.get('user_id')
    if not user_id:
        return Response({
            'error': 'user_id is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
        user.must_change_password = True
        user.save()
        
        return Response({
            'message': f'User {user.username} must change password on next login'
        }, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({
            'error': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_info(request):
    """
    Get current user information
    """
    user = request.user
    serializer = UserProfileSerializer(user)
    
    return Response({
        'user': serializer.data,
        'permissions': {
            'can_manage_users': user.is_admin(),
            'can_manage_projects': user.is_admin() or user.is_advisor(),
            'can_view_analytics': user.is_admin() or user.is_department_admin(),
        }
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def switch_academic_year(request):
    """
    Switch user's academic year (admin only)
    """
    if not request.user.is_admin():
        return Response({
            'error': 'Permission denied'
        }, status=status.HTTP_403_FORBIDDEN)
    
    new_year = request.data.get('academic_year')
    if not new_year:
        return Response({
            'error': 'academic_year is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if not new_year.isdigit() or len(new_year) != 4:
        return Response({
            'error': 'Academic year must be a 4-digit year'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    request.user.academic_year = new_year
    request.user.save()
    
    return Response({
        'message': f'Academic year switched to {new_year}',
        'academic_year': new_year
    }, status=status.HTTP_200_OK)
