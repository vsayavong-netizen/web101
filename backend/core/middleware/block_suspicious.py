"""
Block Suspicious Requests Middleware
"""

import re
import logging
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from django.core.cache import cache
from django.conf import settings
from ..utils import get_client_ip

logger = logging.getLogger('core.security')


class BlockSuspiciousRequestsMiddleware(MiddlewareMixin):
    """
    Middleware to block suspicious requests based on patterns
    """
    
    def process_request(self, request):
        """
        Check for suspicious patterns in the request
        """
        client_ip = get_client_ip(request)
        path = request.path
        query_string = request.META.get('QUERY_STRING', '')
        
        # Get suspicious patterns from settings
        suspicious_patterns = getattr(settings, 'ENHANCED_API_SECURITY', {}).get('SUSPICIOUS_PATTERNS', [])
        
        # Check path for suspicious patterns
        for pattern in suspicious_patterns:
            if re.search(pattern, path, re.IGNORECASE):
                self._log_and_block('SUSPICIOUS_PATH', client_ip, path, pattern)
                return JsonResponse({
                    'error': 'Access denied',
                    'code': 'BLOCKED_PATH'
                }, status=403)
        
        # Check query string for suspicious patterns
        for pattern in suspicious_patterns:
            if re.search(pattern, query_string, re.IGNORECASE):
                self._log_and_block('SUSPICIOUS_QUERY', client_ip, query_string, pattern)
                return JsonResponse({
                    'error': 'Access denied',
                    'code': 'BLOCKED_QUERY'
                }, status=403)
        
        # Check for common attack patterns in headers
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        if self._is_suspicious_user_agent(user_agent):
            self._log_and_block('SUSPICIOUS_USER_AGENT', client_ip, user_agent)
            return JsonResponse({
                'error': 'Access denied',
                'code': 'BLOCKED_USER_AGENT'
            }, status=403)
        
        return None
    
    def _is_suspicious_user_agent(self, user_agent):
        """
        Check if user agent is suspicious
        """
        suspicious_agents = [
            'sqlmap',
            'nikto',
            'nmap',
            'masscan',
            'zap',
            'burp',
            'w3af',
            'havij',
            'sqlninja',
            'pangolin',
            'acunetix',
            'nessus',
            'openvas',
            'retina',
            'qualys',
            'rapid7',
            'metasploit',
            'cobalt',
            'immunity',
            'canvas',
            'core',
            'exploit',
            'scanner',
            'crawler',
            'spider',
            'bot',
            'scraper',
            'harvester',
            'extractor',
            'parser',
            'analyzer',
            'monitor',
            'checker',
            'tester',
            'validator',
            'verifier',
            'auditor',
            'inspector',
            'probe',
            'sniffer',
            'listener',
            'receiver',
            'collector',
            'gatherer',
            'aggregator',
            'accumulator',
            'compiler',
            'assembler',
            'builder',
            'generator',
            'creator',
            'maker',
            'producer',
            'manufacturer',
            'fabricator',
            'constructor',
            'developer',
            'programmer',
            'coder',
            'hacker',
            'cracker',
            'breaker',
            'intruder',
            'penetrator',
            'infiltrator',
            'invader',
            'attacker',
            'assailant',
            'aggressor',
            'offender',
            'violator',
            'trespasser',
            'intruder',
            'infiltrator',
            'penetrator',
            'invader',
            'attacker',
            'assailant',
            'aggressor',
            'offender',
            'violator',
            'trespasser',
        ]
        
        user_agent_lower = user_agent.lower()
        for agent in suspicious_agents:
            if agent in user_agent_lower:
                return True
        
        return False
    
    def _log_and_block(self, event_type, ip, data, pattern=None):
        """
        Log security event and block request
        """
        logger.warning(
            f"Security Event: {event_type} from IP: {ip}, "
            f"Data: {data[:100]}..., Pattern: {pattern}"
        )
        
        # Increment block counter for this IP
        block_key = f"blocked_requests_{ip}"
        cache.set(block_key, cache.get(block_key, 0) + 1, 3600)  # 1 hour
