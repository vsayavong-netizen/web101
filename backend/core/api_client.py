"""
Enhanced API Client for Backend Services
Provides unified interface for internal API communication
"""

import requests
import logging
from typing import Optional, Dict, Any, List
from django.conf import settings
from django.core.cache import cache
from rest_framework_simplejwt.tokens import RefreshToken
import time

logger = logging.getLogger(__name__)


class APIClient:
    """
    Enhanced API client with:
    - Automatic retry logic
    - Token refresh handling
    - Caching support
    - Error handling
    - Request/Response logging
    """
    
    def __init__(self, base_url: Optional[str] = None, timeout: int = 30):
        self.base_url = base_url or getattr(settings, 'API_BASE_URL', 'http://localhost:8000')
        self.timeout = timeout
        self.session = requests.Session()
        self._token: Optional[str] = None
        self._refresh_token: Optional[str] = None
        
    def set_token(self, token: str, refresh_token: Optional[str] = None):
        """Set authentication token"""
        self._token = token
        self._refresh_token = refresh_token
        self.session.headers.update({
            'Authorization': f'Bearer {token}'
        })
    
    def _refresh_access_token(self) -> bool:
        """Attempt to refresh access token"""
        if not self._refresh_token:
            return False
        
        try:
            response = requests.post(
                f'{self.base_url}/api/auth/token/refresh/',
                json={'refresh': self._refresh_token},
                timeout=self.timeout
            )
            if response.status_code == 200:
                data = response.json()
                new_token = data.get('access')
                if new_token:
                    self.set_token(new_token, self._refresh_token)
                    return True
        except Exception as e:
            logger.error(f"Token refresh failed: {e}")
        
        return False
    
    def _make_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
        use_cache: bool = False,
        cache_timeout: int = 300,
        retries: int = 3
    ) -> Dict[str, Any]:
        """
        Make HTTP request with retry logic and error handling
        """
        url = f"{self.base_url.rstrip('/')}/{endpoint.lstrip('/')}"
        
        # Check cache for GET requests
        if use_cache and method == 'GET':
            cache_key = f"api_cache:{method}:{url}:{params}"
            cached_response = cache.get(cache_key)
            if cached_response:
                logger.debug(f"Cache hit for {url}")
                return cached_response
        
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        
        if self._token:
            headers['Authorization'] = f'Bearer {self._token}'
        
        for attempt in range(retries):
            try:
                response = self.session.request(
                    method=method,
                    url=url,
                    json=data,
                    params=params,
                    headers=headers,
                    timeout=self.timeout
                )
                
                # Handle 401 - Try token refresh
                if response.status_code == 401 and attempt < retries - 1:
                    if self._refresh_access_token():
                        continue
                    else:
                        raise Exception("Authentication failed")
                
                response.raise_for_status()
                result = response.json()
                
                # Cache successful GET responses
                if use_cache and method == 'GET' and response.status_code == 200:
                    cache.set(cache_key, result, cache_timeout)
                
                return result
                
            except requests.exceptions.RequestException as e:
                if attempt == retries - 1:
                    logger.error(f"Request failed after {retries} attempts: {e}")
                    raise
                time.sleep(2 ** attempt)  # Exponential backoff
        
        raise Exception("Request failed")
    
    def get(
        self,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        use_cache: bool = True,
        cache_timeout: int = 300
    ) -> Dict[str, Any]:
        """GET request"""
        return self._make_request(
            'GET',
            endpoint,
            params=params,
            use_cache=use_cache,
            cache_timeout=cache_timeout
        )
    
    def post(
        self,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        use_cache: bool = False
    ) -> Dict[str, Any]:
        """POST request"""
        return self._make_request('POST', endpoint, data=data, use_cache=use_cache)
    
    def patch(
        self,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        use_cache: bool = False
    ) -> Dict[str, Any]:
        """PATCH request"""
        return self._make_request('PATCH', endpoint, data=data, use_cache=use_cache)
    
    def put(
        self,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        use_cache: bool = False
    ) -> Dict[str, Any]:
        """PUT request"""
        return self._make_request('PUT', endpoint, data=data, use_cache=use_cache)
    
    def delete(
        self,
        endpoint: str,
        use_cache: bool = False
    ) -> Dict[str, Any]:
        """DELETE request"""
        return self._make_request('DELETE', endpoint, use_cache=use_cache)


# Singleton instance
api_client = APIClient()

