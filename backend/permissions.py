from rest_framework.permissions import BasePermission, SAFE_METHODS
from django.contrib.auth import get_user_model
from functools import wraps
from rest_framework.response import Response
from rest_framework import status


User = get_user_model()


class IsAdmin(BasePermission):
    message = 'Admin role required.'

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and getattr(user, 'role', None) == 'Admin')


class IsDepartmentAdmin(BasePermission):
    message = 'DepartmentAdmin role required.'

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and getattr(user, 'role', None) == 'DepartmentAdmin')


class IsAdvisor(BasePermission):
    message = 'Advisor role required.'

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and getattr(user, 'role', None) == 'Advisor')


class IsStudent(BasePermission):
    message = 'Student role required.'

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and getattr(user, 'role', None) == 'Student')


class IsAdminOrDepartmentAdmin(BasePermission):
    message = 'Admin or DepartmentAdmin role required.'

    def has_permission(self, request, view):
        role = getattr(request.user, 'role', None)
        return bool(request.user and request.user.is_authenticated and role in ('Admin', 'DepartmentAdmin'))


class ReadOnly(BasePermission):
    def has_permission(self, request, view):
        return request.method in SAFE_METHODS


class RolePermission(BasePermission):
    """Flexible role-based permission.
    Usage:
        permission_classes = [RolePermission]
        allowed_roles = ('Admin', 'Advisor')
    """

    message = 'You do not have permission to perform this action.'

    def has_permission(self, request, view):
        allowed_roles = getattr(view, 'allowed_roles', None)
        if not allowed_roles:
            return bool(request.user and request.user.is_authenticated)
        role = getattr(request.user, 'role', None)
        return bool(request.user and request.user.is_authenticated and role in allowed_roles)


class RoleRequiredMixin:
    """Class-based view mixin to enforce role-based access.
    Usage:
        class MyView(RoleRequiredMixin, APIView):
            allowed_roles = ('Admin', 'DepartmentAdmin')
    """

    allowed_roles = None  # type: ignore

    def get_allowed_roles(self):
        return getattr(self, 'allowed_roles', None)

    def get_permissions(self):
        base_permissions = super().get_permissions()  # type: ignore
        return base_permissions + [RolePermission()]


def require_roles(*roles):
    """Function-based view decorator to enforce role-based access.
    Example:
        @require_roles('Admin','DepartmentAdmin')
        def view(request): ...
    """
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            user = getattr(request, 'user', None)
            if not user or not user.is_authenticated:
                return Response({'detail': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)
            if roles and getattr(user, 'role', None) not in roles:
                return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
            return view_func(request, *args, **kwargs)
        return _wrapped_view
    return decorator


class CanManageProject(BasePermission):
    """Permission to manage projects (create, update, delete)."""
    message = 'You do not have permission to manage projects.'

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        role = getattr(user, 'role', None)
        return role in ('Admin', 'DepartmentAdmin', 'Advisor')


class CanViewProject(BasePermission):
    """Permission to view projects."""
    message = 'You do not have permission to view projects.'

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        role = getattr(user, 'role', None)
        return role in ('Admin', 'DepartmentAdmin', 'Advisor', 'Student')


class IsProjectParticipant(BasePermission):
    """Permission for project participants."""
    message = 'You must be a participant in this project.'

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        # This would need to be implemented based on project membership
        return True


class AcademicYearPermission(BasePermission):
    """Permission based on academic year access."""
    message = 'You do not have permission to access this academic year.'

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        # This would need to be implemented based on academic year logic
        return True


class IsAdvisorOrAdmin(BasePermission):
    """Permission for advisors or admins."""
    message = 'Advisor or Admin role required.'

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        role = getattr(user, 'role', None)
        return role in ('Admin', 'DepartmentAdmin', 'Advisor')


