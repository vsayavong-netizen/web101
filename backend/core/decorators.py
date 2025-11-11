"""
Caching decorators for API views
"""
from django.core.cache import cache
from functools import wraps
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
import hashlib
import json


def cache_api_response(timeout=300, key_prefix='api', vary_on_user=False):
    """
    Decorator to cache API responses.
    
    Args:
        timeout: Cache timeout in seconds (default: 5 minutes)
        key_prefix: Prefix for cache key
        vary_on_user: If True, cache key includes user ID
    
    Usage:
        @cache_api_response(timeout=600, vary_on_user=False)
        def my_view(request):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            request = args[0] if args else None
            
            # Generate cache key
            if vary_on_user and request and hasattr(request, 'user'):
                user_id = request.user.id if request.user.is_authenticated else 'anonymous'
                cache_key = f"{key_prefix}:{func.__name__}:user_{user_id}"
            else:
                # Include query params in cache key
                query_params = request.GET.urlencode() if request else ''
                params_hash = hashlib.md5(query_params.encode()).hexdigest()[:8]
                cache_key = f"{key_prefix}:{func.__name__}:{params_hash}"
            
            # Try to get from cache
            cached_response = cache.get(cache_key)
            if cached_response is not None:
                return cached_response
            
            # Call original function
            response = func(*args, **kwargs)
            
            # Only cache successful responses
            if hasattr(response, 'status_code') and response.status_code == 200:
                cache.set(cache_key, response, timeout)
            
            return response
        return wrapper
    return decorator


def cache_method_result(timeout=300, key_prefix='method'):
    """
    Decorator to cache method results.
    
    Usage:
        @cache_method_result(timeout=600)
        def expensive_calculation(self, param1, param2):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key from function name and arguments
            key_parts = [key_prefix, func.__name__]
            if args:
                key_parts.append(str(hash(str(args))))
            if kwargs:
                key_parts.append(str(hash(json.dumps(kwargs, sort_keys=True))))
            
            cache_key = ':'.join(key_parts)
            
            # Try to get from cache
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            # Call original function
            result = func(*args, **kwargs)
            
            # Cache the result
            cache.set(cache_key, result, timeout)
            
            return result
        return wrapper
    return decorator


def invalidate_cache(pattern):
    """
    Decorator to invalidate cache entries matching a pattern.
    
    Usage:
        @invalidate_cache('api:academic_years:*')
        def update_academic_year(request, pk):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Call original function
            result = func(*args, **kwargs)
            
            # Invalidate cache (requires django-redis or similar)
            try:
                from django.core.cache import cache
                # For Redis, we can use pattern matching
                if hasattr(cache, 'delete_pattern'):
                    cache.delete_pattern(pattern)
                else:
                    # Fallback: clear entire cache (not ideal)
                    cache.clear()
            except Exception:
                pass  # Ignore cache errors
            
            return result
        return wrapper
    return decorator

