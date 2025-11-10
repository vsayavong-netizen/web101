"""
Standardized API Response Format
"""

from rest_framework.response import Response
from rest_framework import status
from typing import Any, Optional, Dict


class APIResponse:
    """
    Standardized API response format
    """
    
    @staticmethod
    def success(
        data: Any = None,
        message: str = "Success",
        status_code: int = status.HTTP_200_OK,
        meta: Optional[Dict] = None
    ) -> Response:
        """
        Success response
        """
        response_data = {
            'success': True,
            'message': message,
            'data': data,
        }
        
        if meta:
            response_data['meta'] = meta
        
        return Response(response_data, status=status_code)
    
    @staticmethod
    def error(
        message: str = "An error occurred",
        errors: Optional[Dict] = None,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        code: Optional[str] = None
    ) -> Response:
        """
        Error response
        """
        response_data = {
            'success': False,
            'message': message,
            'code': code or 'error',
        }
        
        if errors:
            response_data['errors'] = errors
        
        return Response(response_data, status=status_code)
    
    @staticmethod
    def created(
        data: Any = None,
        message: str = "Resource created successfully",
        meta: Optional[Dict] = None
    ) -> Response:
        """
        Created response (201)
        """
        return APIResponse.success(
            data=data,
            message=message,
            status_code=status.HTTP_201_CREATED,
            meta=meta
        )
    
    @staticmethod
    def paginated(
        data: list,
        count: int,
        page: int,
        page_size: int,
        message: str = "Success"
    ) -> Response:
        """
        Paginated response
        """
        total_pages = (count + page_size - 1) // page_size
        
        meta = {
            'pagination': {
                'count': count,
                'page': page,
                'page_size': page_size,
                'total_pages': total_pages,
                'has_next': page < total_pages,
                'has_previous': page > 1,
            }
        }
        
        return APIResponse.success(
            data=data,
            message=message,
            meta=meta
        )

