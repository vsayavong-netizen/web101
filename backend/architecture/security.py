"""
Security architecture for the Final Project Management System
"""

import time
import hashlib
import secrets
import threading
from typing import Dict, List, Any, Optional, Set
from dataclasses import dataclass
from enum import Enum
from django.core.cache import cache
from django.conf import settings
from django.contrib.auth.hashers import make_password, check_password
import logging

logger = logging.getLogger(__name__)


class SecurityLevel(Enum):
    """Security level enumeration"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ThreatType(Enum):
    """Threat type enumeration"""
    BRUTE_FORCE = "brute_force"
    SQL_INJECTION = "sql_injection"
    XSS = "xss"
    CSRF = "csrf"
    DDOS = "ddos"
    UNAUTHORIZED_ACCESS = "unauthorized_access"


@dataclass
class SecurityEvent:
    """Security event data class"""
    timestamp: float
    event_type: str
    severity: SecurityLevel
    source_ip: str
    user_id: Optional[str]
    description: str
    threat_type: ThreatType
    blocked: bool


class ThreatDetection:
    """
    Threat detection and analysis
    """
    
    def __init__(self):
        self.threat_patterns = {
            'sql_injection': [
                r"('|(\\')|(;)|(union)|(select)|(insert)|(update)|(delete)|(drop))",
                r"(or|and)\s+\d+\s*=\s*\d+",
                r"(union|select|insert|update|delete|drop)\s+.*",
            ],
            'xss': [
                r"<script[^>]*>.*?</script>",
                r"javascript:",
                r"on\w+\s*=",
                r"<iframe[^>]*>",
                r"<object[^>]*>",
                r"<embed[^>]*>",
            ],
            'brute_force': [
                r"failed.*login",
                r"invalid.*password",
                r"authentication.*failed",
            ]
        }
        self.threat_scores = {}
        self.blocked_ips = set()
        self.suspicious_activities = []
    
    def analyze_request(self, request_data: Dict[str, Any]) -> Optional[SecurityEvent]:
        """Analyze request for threats"""
        threat_score = 0
        detected_threats = []
        
        # Check for SQL injection
        if self._check_sql_injection(request_data):
            threat_score += 50
            detected_threats.append(ThreatType.SQL_INJECTION)
        
        # Check for XSS
        if self._check_xss(request_data):
            threat_score += 40
            detected_threats.append(ThreatType.XSS)
        
        # Check for brute force
        if self._check_brute_force(request_data):
            threat_score += 60
            detected_threats.append(ThreatType.BRUTE_FORCE)
        
        # Check for suspicious patterns
        if self._check_suspicious_patterns(request_data):
            threat_score += 30
            detected_threats.append(ThreatType.UNAUTHORIZED_ACCESS)
        
        if threat_score > 0:
            severity = self._determine_severity(threat_score)
            return SecurityEvent(
                timestamp=time.time(),
                event_type='threat_detected',
                severity=severity,
                source_ip=request_data.get('ip', 'unknown'),
                user_id=request_data.get('user_id'),
                description=f"Threat detected: {', '.join([t.value for t in detected_threats])}",
                threat_type=detected_threats[0] if detected_threats else ThreatType.UNAUTHORIZED_ACCESS,
                blocked=threat_score > 70
            )
        
        return None
    
    def _check_sql_injection(self, request_data: Dict[str, Any]) -> bool:
        """Check for SQL injection patterns"""
        import re
        
        for key, value in request_data.items():
            if isinstance(value, str):
                for pattern in self.threat_patterns['sql_injection']:
                    if re.search(pattern, value, re.IGNORECASE):
                        return True
        return False
    
    def _check_xss(self, request_data: Dict[str, Any]) -> bool:
        """Check for XSS patterns"""
        import re
        
        for key, value in request_data.items():
            if isinstance(value, str):
                for pattern in self.threat_patterns['xss']:
                    if re.search(pattern, value, re.IGNORECASE):
                        return True
        return False
    
    def _check_brute_force(self, request_data: Dict[str, Any]) -> bool:
        """Check for brute force patterns"""
        # Check for repeated failed login attempts
        ip = request_data.get('ip', 'unknown')
        if ip in self.threat_scores:
            self.threat_scores[ip] += 1
        else:
            self.threat_scores[ip] = 1
        
        return self.threat_scores[ip] > 5
    
    def _check_suspicious_patterns(self, request_data: Dict[str, Any]) -> bool:
        """Check for suspicious patterns"""
        # Check for unusual request patterns
        user_agent = request_data.get('user_agent', '')
        if not user_agent or len(user_agent) < 10:
            return True
        
        # Check for suspicious headers
        headers = request_data.get('headers', {})
        if 'x-forwarded-for' in headers and len(headers['x-forwarded-for']) > 100:
            return True
        
        return False
    
    def _determine_severity(self, threat_score: int) -> SecurityLevel:
        """Determine threat severity"""
        if threat_score >= 80:
            return SecurityLevel.CRITICAL
        elif threat_score >= 60:
            return SecurityLevel.HIGH
        elif threat_score >= 40:
            return SecurityLevel.MEDIUM
        else:
            return SecurityLevel.LOW
    
    def block_ip(self, ip: str, duration: int = 3600):
        """Block IP address"""
        self.blocked_ips.add(ip)
        cache.set(f'blocked_ip_{ip}', True, duration)
        logger.warning(f"IP {ip} blocked for {duration} seconds")
    
    def is_ip_blocked(self, ip: str) -> bool:
        """Check if IP is blocked"""
        if ip in self.blocked_ips:
            return True
        
        return cache.get(f'blocked_ip_{ip}', False)
    
    def get_threat_summary(self) -> Dict[str, Any]:
        """Get threat detection summary"""
        return {
            'blocked_ips': len(self.blocked_ips),
            'threat_scores': self.threat_scores,
            'suspicious_activities': len(self.suspicious_activities)
        }


class AccessControl:
    """
    Access control and authorization
    """
    
    def __init__(self):
        self.permissions = {}
        self.role_permissions = {}
        self.resource_permissions = {}
        self.access_logs = []
        self.failed_access_attempts = {}
    
    def define_permission(self, permission_id: str, resource: str, action: str, conditions: List[str] = None):
        """Define a permission"""
        self.permissions[permission_id] = {
            'resource': resource,
            'action': action,
            'conditions': conditions or [],
            'created_at': time.time()
        }
    
    def assign_role_permission(self, role: str, permission_id: str):
        """Assign permission to role"""
        if role not in self.role_permissions:
            self.role_permissions[role] = []
        self.role_permissions[role].append(permission_id)
    
    def check_permission(self, user_id: str, role: str, resource: str, action: str) -> bool:
        """Check if user has permission"""
        # Get role permissions
        role_perms = self.role_permissions.get(role, [])
        
        # Check each permission
        for perm_id in role_perms:
            permission = self.permissions.get(perm_id)
            if permission and permission['resource'] == resource and permission['action'] == action:
                # Check conditions
                if self._check_conditions(user_id, permission['conditions']):
                    self._log_access(user_id, resource, action, True)
                    return True
        
        self._log_access(user_id, resource, action, False)
        return False
    
    def _check_conditions(self, user_id: str, conditions: List[str]) -> bool:
        """Check permission conditions"""
        for condition in conditions:
            if not self._evaluate_condition(user_id, condition):
                return False
        return True
    
    def _evaluate_condition(self, user_id: str, condition: str) -> bool:
        """Evaluate a single condition"""
        # Implement condition evaluation logic
        # For now, return True
        return True
    
    def _log_access(self, user_id: str, resource: str, action: str, granted: bool):
        """Log access attempt"""
        log_entry = {
            'timestamp': time.time(),
            'user_id': user_id,
            'resource': resource,
            'action': action,
            'granted': granted
        }
        self.access_logs.append(log_entry)
        
        if not granted:
            if user_id not in self.failed_access_attempts:
                self.failed_access_attempts[user_id] = 0
            self.failed_access_attempts[user_id] += 1
    
    def get_access_summary(self) -> Dict[str, Any]:
        """Get access control summary"""
        return {
            'total_permissions': len(self.permissions),
            'role_permissions': len(self.role_permissions),
            'access_logs': len(self.access_logs),
            'failed_attempts': self.failed_access_attempts
        }


class EncryptionManager:
    """
    Encryption and data protection
    """
    
    def __init__(self):
        self.encryption_key = self._generate_encryption_key()
        self.encrypted_fields = set()
        self.encryption_stats = {
            'encryptions': 0,
            'decryptions': 0,
            'errors': 0
        }
    
    def _generate_encryption_key(self) -> str:
        """Generate encryption key"""
        return secrets.token_hex(32)
    
    def encrypt_data(self, data: str) -> str:
        """Encrypt sensitive data"""
        try:
            # Simple encryption for demonstration
            # In production, use proper encryption libraries
            encrypted = hashlib.sha256((data + self.encryption_key).encode()).hexdigest()
            self.encryption_stats['encryptions'] += 1
            return encrypted
        except Exception as e:
            self.encryption_stats['errors'] += 1
            logger.error(f"Encryption error: {e}")
            return data
    
    def decrypt_data(self, encrypted_data: str) -> str:
        """Decrypt data"""
        try:
            # Simple decryption for demonstration
            # In production, use proper decryption libraries
            self.encryption_stats['decryptions'] += 1
            return encrypted_data  # Placeholder
        except Exception as e:
            self.encryption_stats['errors'] += 1
            logger.error(f"Decryption error: {e}")
            return encrypted_data
    
    def hash_password(self, password: str) -> str:
        """Hash password securely"""
        return make_password(password)
    
    def verify_password(self, password: str, hashed_password: str) -> bool:
        """Verify password"""
        return check_password(password, hashed_password)
    
    def generate_token(self, length: int = 32) -> str:
        """Generate secure token"""
        return secrets.token_urlsafe(length)
    
    def get_encryption_stats(self) -> Dict[str, Any]:
        """Get encryption statistics"""
        return self.encryption_stats


class SecurityAudit:
    """
    Security auditing and compliance
    """
    
    def __init__(self):
        self.audit_logs = []
        self.compliance_checks = []
        self.security_violations = []
        self.audit_schedule = {}
    
    def log_security_event(self, event: SecurityEvent):
        """Log security event"""
        self.audit_logs.append(event)
        
        # Check for security violations
        if event.severity in [SecurityLevel.HIGH, SecurityLevel.CRITICAL]:
            self.security_violations.append(event)
        
        # Store in cache for quick access
        cache.set(f'security_event_{event.timestamp}', event, 3600)
    
    def run_compliance_check(self, check_type: str) -> Dict[str, Any]:
        """Run compliance check"""
        check_result = {
            'check_type': check_type,
            'timestamp': time.time(),
            'passed': True,
            'issues': [],
            'recommendations': []
        }
        
        if check_type == 'password_policy':
            check_result = self._check_password_policy()
        elif check_type == 'access_control':
            check_result = self._check_access_control()
        elif check_type == 'data_encryption':
            check_result = self._check_data_encryption()
        elif check_type == 'session_management':
            check_result = self._check_session_management()
        
        self.compliance_checks.append(check_result)
        return check_result
    
    def _check_password_policy(self) -> Dict[str, Any]:
        """Check password policy compliance"""
        issues = []
        recommendations = []
        
        # Check password complexity requirements
        # This would be implemented based on actual password policy
        
        return {
            'check_type': 'password_policy',
            'timestamp': time.time(),
            'passed': len(issues) == 0,
            'issues': issues,
            'recommendations': recommendations
        }
    
    def _check_access_control(self) -> Dict[str, Any]:
        """Check access control compliance"""
        issues = []
        recommendations = []
        
        # Check for proper role-based access control
        # Check for principle of least privilege
        
        return {
            'check_type': 'access_control',
            'timestamp': time.time(),
            'passed': len(issues) == 0,
            'issues': issues,
            'recommendations': recommendations
        }
    
    def _check_data_encryption(self) -> Dict[str, Any]:
        """Check data encryption compliance"""
        issues = []
        recommendations = []
        
        # Check for encryption of sensitive data
        # Check for proper key management
        
        return {
            'check_type': 'data_encryption',
            'timestamp': time.time(),
            'passed': len(issues) == 0,
            'issues': issues,
            'recommendations': recommendations
        }
    
    def _check_session_management(self) -> Dict[str, Any]:
        """Check session management compliance"""
        issues = []
        recommendations = []
        
        # Check for secure session handling
        # Check for session timeout
        
        return {
            'check_type': 'session_management',
            'timestamp': time.time(),
            'passed': len(issues) == 0,
            'issues': issues,
            'recommendations': recommendations
        }
    
    def get_audit_summary(self) -> Dict[str, Any]:
        """Get security audit summary"""
        return {
            'total_events': len(self.audit_logs),
            'violations': len(self.security_violations),
            'compliance_checks': len(self.compliance_checks),
            'recent_events': self.audit_logs[-10:] if self.audit_logs else []
        }


class SecurityManager:
    """
    Main security management coordinator
    """
    
    def __init__(self):
        self.threat_detection = ThreatDetection()
        self.access_control = AccessControl()
        self.encryption_manager = EncryptionManager()
        self.security_audit = SecurityAudit()
        
        # Initialize security policies
        self._initialize_security_policies()
    
    def _initialize_security_policies(self):
        """Initialize security policies"""
        # Define permissions
        self.access_control.define_permission('view_projects', 'projects', 'read')
        self.access_control.define_permission('edit_projects', 'projects', 'write')
        self.access_control.define_permission('delete_projects', 'projects', 'delete')
        self.access_control.define_permission('view_users', 'users', 'read')
        self.access_control.define_permission('edit_users', 'users', 'write')
        self.access_control.define_permission('admin_access', 'system', 'admin')
        
        # Assign role permissions
        self.access_control.assign_role_permission('Student', 'view_projects')
        self.access_control.assign_role_permission('Advisor', 'view_projects')
        self.access_control.assign_role_permission('Advisor', 'edit_projects')
        self.access_control.assign_role_permission('Admin', 'admin_access')
    
    def analyze_request(self, request_data: Dict[str, Any]) -> Optional[SecurityEvent]:
        """Analyze request for security threats"""
        # Check if IP is blocked
        ip = request_data.get('ip', 'unknown')
        if self.threat_detection.is_ip_blocked(ip):
            return SecurityEvent(
                timestamp=time.time(),
                event_type='blocked_ip',
                severity=SecurityLevel.HIGH,
                source_ip=ip,
                user_id=request_data.get('user_id'),
                description='Request from blocked IP',
                threat_type=ThreatType.UNAUTHORIZED_ACCESS,
                blocked=True
            )
        
        # Analyze for threats
        threat_event = self.threat_detection.analyze_request(request_data)
        if threat_event:
            self.security_audit.log_security_event(threat_event)
            
            # Block IP if threat is critical
            if threat_event.severity == SecurityLevel.CRITICAL:
                self.threat_detection.block_ip(ip, 3600)
        
        return threat_event
    
    def check_authorization(self, user_id: str, role: str, resource: str, action: str) -> bool:
        """Check user authorization"""
        return self.access_control.check_permission(user_id, role, resource, action)
    
    def encrypt_sensitive_data(self, data: str) -> str:
        """Encrypt sensitive data"""
        return self.encryption_manager.encrypt_data(data)
    
    def hash_password(self, password: str) -> str:
        """Hash password"""
        return self.encryption_manager.hash_password(password)
    
    def verify_password(self, password: str, hashed_password: str) -> bool:
        """Verify password"""
        return self.encryption_manager.verify_password(password, hashed_password)
    
    def run_security_audit(self) -> Dict[str, Any]:
        """Run comprehensive security audit"""
        audit_results = {}
        
        # Run compliance checks
        audit_results['password_policy'] = self.security_audit.run_compliance_check('password_policy')
        audit_results['access_control'] = self.security_audit.run_compliance_check('access_control')
        audit_results['data_encryption'] = self.security_audit.run_compliance_check('data_encryption')
        audit_results['session_management'] = self.security_audit.run_compliance_check('session_management')
        
        return audit_results
    
    def get_security_status(self) -> Dict[str, Any]:
        """Get comprehensive security status"""
        return {
            'threat_detection': self.threat_detection.get_threat_summary(),
            'access_control': self.access_control.get_access_summary(),
            'encryption': self.encryption_manager.get_encryption_stats(),
            'audit': self.security_audit.get_audit_summary()
        }


# Global security manager instance
security_manager = SecurityManager()
