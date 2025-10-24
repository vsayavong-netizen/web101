"""
Utility functions for the core app
"""

# Local imports from utils module
try:
    from utils.helpers import get_client_ip as _get_client_ip_from_utils
    from utils.helpers import generate_project_id
except ImportError:
    # Fallback definitions if utils module is not available
    def get_client_ip(request):
        """
        Get the client IP address from the request
        """
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def generate_project_id(academic_year: str, sequence: int) -> str:
        """Generate a unique project ID"""
        return f"{academic_year}-{sequence:04d}"
else:
    get_client_ip = _get_client_ip_from_utils

__all__ = ['get_client_ip', 'generate_project_id']

