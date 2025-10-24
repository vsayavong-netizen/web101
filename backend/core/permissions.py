"""
Custom permissions for the Final Project Management System
"""

from rest_framework import permissions
from django.core.exceptions import PermissionDenied


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow admins to edit, but allow read access to authenticated users.
    """
    
    def has_permission(self, request, view):
        # Read permissions for any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Write permissions only for admins
        return request.user and request.user.is_authenticated and request.user.is_admin()


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object or admins to edit it.
    """
    
    def has_object_permission(self, request, view, obj):
        # Read permissions for any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Write permissions only for object owner or admin
        return (
            request.user and 
            request.user.is_authenticated and 
            (obj.user == request.user or request.user.is_admin())
        )


class IsAdvisorOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow advisors or admins to access.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            (request.user.is_advisor() or request.user.is_admin())
        )


class IsStudentOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow students or admins to access.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            (request.user.is_student() or request.user.is_admin())
        )


class IsDepartmentAdminOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow department admins or system admins to access.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            (request.user.is_department_admin() or request.user.is_admin())
        )


class CanAccessAcademicYear(permissions.BasePermission):
    """
    Custom permission to check if user can access data for specific academic year.
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admins can access all academic years
        if request.user.is_admin():
            return True
        
        # Get academic year from request
        academic_year = request.query_params.get('academic_year') or request.data.get('academic_year')
        
        if not academic_year:
            return True  # No specific year requested
        
        # Check if user can access this academic year
        return request.user.can_access_academic_year(academic_year)


class CanManageProject(permissions.BasePermission):
    """
    Custom permission to check if user can manage a specific project.
    """
    
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admins can manage all projects
        if request.user.is_admin():
            return True
        
        # Check if user can manage this specific project
        return obj.can_be_edited_by(request.user)


class CanViewProject(permissions.BasePermission):
    """
    Custom permission to check if user can view a specific project.
    """
    
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check if user can view this specific project
        return obj.can_be_viewed_by(request.user)


class CanManageStudents(permissions.BasePermission):
    """
    Custom permission to check if user can manage students.
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admins can manage all students
        if request.user.is_admin():
            return True
        
        # Department admins can manage students in their departments
        if request.user.is_department_admin():
            return True
        
        return False


class CanManageAdvisors(permissions.BasePermission):
    """
    Custom permission to check if user can manage advisors.
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Only admins can manage advisors
        return request.user.is_admin()


class CanAccessAnalytics(permissions.BasePermission):
    """
    Custom permission to check if user can access analytics.
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admins and department admins can access analytics
        return request.user.is_admin() or request.user.is_department_admin()


class CanUploadFiles(permissions.BasePermission):
    """
    Custom permission to check if user can upload files.
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # All authenticated users can upload files
        return True


class CanManageNotifications(permissions.BasePermission):
    """
    Custom permission to check if user can manage notifications.
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # All authenticated users can manage their own notifications
        return True


class IsProjectParticipant(permissions.BasePermission):
    """
    Custom permission to check if user is a participant in a project.
    """
    
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admins can access all projects
        if request.user.is_admin():
            return True
        
        # Check if user is a participant in this project
        if hasattr(obj, 'project'):
            project = obj.project
        else:
            project = obj
        
        return project.can_be_viewed_by(request.user)


class CanAccessAIFeatures(permissions.BasePermission):
    """
    Custom permission to check if user can access AI features.
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check if AI assistant is enabled for this user
        return getattr(request.user, 'is_ai_assistant_enabled', True)


class AcademicYearPermission(permissions.BasePermission):
    """
    Custom permission to check academic year access.
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Get academic year from various sources
        academic_year = (
            request.query_params.get('academic_year') or
            request.data.get('academic_year') or
            getattr(view, 'academic_year', None)
        )
        
        if not academic_year:
            return True  # No specific year requested
        
        # Admins can access all years
        if request.user.is_admin():
            return True
        
        # Check if user can access this academic year
        return request.user.can_access_academic_year(academic_year)


class RoleBasedPermission(permissions.BasePermission):
    """
    Generic role-based permission checker.
    """
    
    def __init__(self, allowed_roles=None):
        self.allowed_roles = allowed_roles or []
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admins always have permission
        if request.user.is_admin():
            return True
        
        # Check if user role is in allowed roles
        return request.user.role in self.allowed_roles


class DepartmentPermission(permissions.BasePermission):
    """
    Custom permission to check department-based access.
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admins can access all departments
        if request.user.is_admin():
            return True
        
        # Department admins can access their departments
        if request.user.is_department_admin():
            return True
        
        return False
    
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admins can access all objects
        if request.user.is_admin():
            return True
        
        # Department admins can access objects in their departments
        if request.user.is_department_admin():
            # Check if object belongs to user's managed departments
            if hasattr(obj, 'major'):
                return request.user.advisor_profile.can_manage_major(obj.major)
            elif hasattr(obj, 'students'):
                # For project objects, check if any student is in managed major
                for student in obj.students.all():
                    if request.user.advisor_profile.can_manage_major(student.major):
                        return True
                return False
        
        return False
