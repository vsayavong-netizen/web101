"""
Authentication serializers for JWT-based authentication
"""

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from accounts.models import User


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT token serializer with additional user information
    """
    username_field = 'username'
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['username'] = serializers.CharField()
        self.fields['password'] = serializers.CharField(write_only=True)

    def validate(self, attrs):
        """
        Validate credentials using the parent implementation to generate tokens,
        then attach additional user info and perform extra checks.
        """
        # Let the base serializer authenticate and generate tokens (access/refresh)
        data = super().validate(attrs)

        # Ensure we have the authenticated user
        user = getattr(self, 'user', None)
        if user is None:
            # Fallback (should not happen normally)
            username = attrs.get('username')
            password = attrs.get('password')
            user = authenticate(username=username, password=password)

        if not user:
            raise serializers.ValidationError(
                'Invalid credentials. Please check your username and password.'
            )

        if not user.is_active:
            raise serializers.ValidationError('User account is disabled.')

        # Enforce password change policy if enabled on user
        if getattr(user, 'must_change_password', False):
            raise serializers.ValidationError(
                'Password change required. Please contact administrator.'
            )

        # Attach user info to response
        data['user'] = UserProfileSerializer(user).data
        return data

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Add custom claims
        token['user_id'] = user.id
        token['role'] = user.role
        token['academic_year'] = user.current_academic_year
        token['username'] = user.username
        token['email'] = user.email
        
        return token


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    User registration serializer with improved error handling
    """
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'role', 'current_academic_year'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'current_academic_year': {'required': True}
        }

    def validate_password(self, value):
        """
        Validate password with custom logic for student accounts
        For student accounts, we allow slightly less strict validation
        """
        # Basic length check
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        
        # For student accounts, we'll be more lenient with password validation
        # but still enforce basic security
        role = self.initial_data.get('role', '')
        is_student = role == 'Student'
        
        if not is_student:
            # For non-student accounts, use full Django password validation
            try:
                validate_password(value)
            except ValidationError as e:
                # Convert Django ValidationError to DRF format
                errors = []
                for error in e.messages:
                    errors.append(error)
                raise serializers.ValidationError(errors)
        else:
            # For student accounts, only check basic requirements
            # (length already checked above)
            has_upper = any(c.isupper() for c in value)
            has_lower = any(c.islower() for c in value)
            has_digit = any(c.isdigit() for c in value)
            
            if not (has_upper and has_lower and has_digit):
                raise serializers.ValidationError(
                    "Password must contain at least one uppercase letter, one lowercase letter, and one number."
                )
        
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Passwords don't match."})
        return attrs

    def validate_username(self, value):
        if not value:
            raise serializers.ValidationError("Username is required.")
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists.")
        return value

    def validate_email(self, value):
        if not value:
            raise serializers.ValidationError("Email is required.")
        # Normalize email
        value = value.lower().strip()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists.")
        return value

    def validate_role(self, value):
        """Validate role value"""
        valid_roles = ['Admin', 'Advisor', 'Student', 'DepartmentAdmin']
        if value not in valid_roles:
            raise serializers.ValidationError(
                f"Invalid role. Must be one of: {', '.join(valid_roles)}"
            )
        return value

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        # Normalize email
        if 'email' in validated_data:
            validated_data['email'] = validated_data['email'].lower().strip()
        
        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """
    User profile serializer for viewing and updating user information
    """
    full_name = serializers.SerializerMethodField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'role', 'role_display', 'current_academic_year',
            'is_ai_assistant_enabled', 'last_login', 'date_joined'
        ]
        read_only_fields = ['id', 'username', 'role', 'current_academic_year', 'last_login', 'date_joined']

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username


class ChangePasswordSerializer(serializers.Serializer):
    """
    Change password serializer
    """
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("New passwords don't match.")
        return attrs

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value

    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.must_change_password = False
        user.save()
        return user


class PasswordResetRequestSerializer(serializers.Serializer):
    """
    Password reset request serializer
    """
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("No user found with this email address.")
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    """
    Password reset confirmation serializer
    """
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("Passwords don't match.")
        return attrs


class UserLoginSerializer(serializers.Serializer):
    """
    User login serializer with additional validation
    """
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)
    remember_me = serializers.BooleanField(default=False, required=False)

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            
            if not user:
                raise serializers.ValidationError(
                    'Invalid credentials. Please check your username and password.'
                )
            
            if not user.is_active:
                raise serializers.ValidationError(
                    'User account is disabled.'
                )
            
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError(
                'Must include "username" and "password".'
            )


class TokenRefreshSerializer(serializers.Serializer):
    """
    Token refresh serializer
    """
    refresh = serializers.CharField(required=True)


class LogoutSerializer(serializers.Serializer):
    """
    Logout serializer
    """
    refresh = serializers.CharField(required=True)
