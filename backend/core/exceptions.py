"""
Custom Exception Classes for Enhanced Error Handling
"""

from rest_framework.exceptions import APIException
from rest_framework import status


class BaseAPIException(APIException):
    """Base exception class for all API exceptions"""
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail = 'A server error occurred.'
    default_code = 'server_error'
    
    def __init__(self, detail=None, code=None, status_code=None):
        if status_code is not None:
            self.status_code = status_code
        if detail is not None:
            self.detail = detail
        if code is not None:
            self.code = code


class ValidationError(BaseAPIException):
    """Custom validation error"""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Validation failed.'
    default_code = 'validation_error'


class NotFoundError(BaseAPIException):
    """Resource not found error"""
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = 'Resource not found.'
    default_code = 'not_found'


class PermissionDeniedError(BaseAPIException):
    """Permission denied error"""
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = 'Permission denied.'
    default_code = 'permission_denied'


class AuthenticationError(BaseAPIException):
    """Authentication error"""
    status_code = status.HTTP_401_UNAUTHORIZED
    default_detail = 'Authentication required.'
    default_code = 'authentication_required'


class RateLimitError(BaseAPIException):
    """Rate limit exceeded error"""
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    default_detail = 'Rate limit exceeded.'
    default_code = 'rate_limit_exceeded'


class DatabaseError(BaseAPIException):
    """Database operation error"""
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail = 'Database operation failed.'
    default_code = 'database_error'


class ExternalServiceError(BaseAPIException):
    """External service error"""
    status_code = status.HTTP_502_BAD_GATEWAY
    default_detail = 'External service unavailable.'
    default_code = 'external_service_error'

