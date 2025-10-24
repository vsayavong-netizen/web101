"""
Microservices architecture implementation for the Final Project Management System
"""

from django.conf import settings
from django.core.cache import cache
import requests
import json
import time
from typing import Dict, Any, Optional
from dataclasses import dataclass
from enum import Enum


class ServiceStatus(Enum):
    """Service status enumeration"""
    HEALTHY = "healthy"
    UNHEALTHY = "unhealthy"
    DEGRADED = "degraded"
    UNKNOWN = "unknown"


@dataclass
class ServiceInfo:
    """Service information data class"""
    name: str
    host: str
    port: int
    status: ServiceStatus
    last_check: float
    response_time: float
    version: str = "1.0.0"


class ServiceRegistry:
    """
    Service registry for microservices architecture
    """
    
    def __init__(self):
        self.services: Dict[str, ServiceInfo] = {}
        self.health_check_interval = 30  # seconds
        self.timeout = 5  # seconds
    
    def register_service(self, name: str, host: str, port: int, version: str = "1.0.0"):
        """Register a new service"""
        service_info = ServiceInfo(
            name=name,
            host=host,
            port=port,
            status=ServiceStatus.UNKNOWN,
            last_check=0,
            response_time=0,
            version=version
        )
        self.services[name] = service_info
        cache.set(f'service_{name}', service_info, 3600)  # Cache for 1 hour
    
    def get_service(self, name: str) -> Optional[ServiceInfo]:
        """Get service information"""
        service = self.services.get(name)
        if not service:
            service = cache.get(f'service_{name}')
        return service
    
    def get_service_url(self, name: str) -> Optional[str]:
        """Get service URL"""
        service = self.get_service(name)
        if service:
            return f"http://{service.host}:{service.port}"
        return None
    
    def health_check(self, name: str) -> bool:
        """Perform health check on service"""
        service = self.get_service(name)
        if not service:
            return False
        
        try:
            start_time = time.time()
            response = requests.get(
                f"http://{service.host}:{service.port}/health/",
                timeout=self.timeout
            )
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                service.status = ServiceStatus.HEALTHY
                service.response_time = response_time
                service.last_check = time.time()
                return True
            else:
                service.status = ServiceStatus.UNHEALTHY
                return False
        except Exception:
            service.status = ServiceStatus.UNHEALTHY
            return False
    
    def get_healthy_services(self) -> Dict[str, ServiceInfo]:
        """Get all healthy services"""
        healthy_services = {}
        for name, service in self.services.items():
            if service.status == ServiceStatus.HEALTHY:
                healthy_services[name] = service
        return healthy_services


class APIGateway:
    """
    API Gateway for routing requests to microservices
    """
    
    def __init__(self, service_registry: ServiceRegistry):
        self.service_registry = service_registry
        self.routes = {
            '/api/auth/': 'auth-service',
            '/api/users/': 'user-service',
            '/api/students/': 'user-service',
            '/api/advisors/': 'user-service',
            '/api/projects/': 'project-service',
            '/api/ai-enhancement/': 'ai-service',
            '/api/files/': 'file-service',
            '/api/notifications/': 'notification-service',
        }
    
    def route_request(self, path: str, method: str, data: Dict[str, Any] = None) -> Dict[str, Any]:
        """Route request to appropriate service"""
        service_name = self.get_service_for_path(path)
        if not service_name:
            return {'error': 'Service not found'}
        
        service = self.service_registry.get_service(service_name)
        if not service:
            return {'error': 'Service unavailable'}
        
        service_url = f"http://{service.host}:{service.port}{path}"
        
        try:
            if method.upper() == 'GET':
                response = requests.get(service_url, timeout=10)
            elif method.upper() == 'POST':
                response = requests.post(service_url, json=data, timeout=10)
            elif method.upper() == 'PUT':
                response = requests.put(service_url, json=data, timeout=10)
            elif method.upper() == 'PATCH':
                response = requests.patch(service_url, json=data, timeout=10)
            elif method.upper() == 'DELETE':
                response = requests.delete(service_url, timeout=10)
            else:
                return {'error': 'Method not allowed'}
            
            return {
                'status_code': response.status_code,
                'data': response.json() if response.content else None
            }
        except requests.exceptions.RequestException as e:
            return {'error': f'Service error: {str(e)}'}
    
    def get_service_for_path(self, path: str) -> Optional[str]:
        """Get service name for given path"""
        for route, service in self.routes.items():
            if path.startswith(route):
                return service
        return None


class LoadBalancer:
    """
    Load balancer for distributing requests across service instances
    """
    
    def __init__(self, service_registry: ServiceRegistry):
        self.service_registry = service_registry
        self.algorithm = 'round_robin'  # or 'least_connections', 'weighted'
        self.current_index = 0
    
    def get_service_instance(self, service_name: str) -> Optional[ServiceInfo]:
        """Get service instance using load balancing algorithm"""
        healthy_services = self.service_registry.get_healthy_services()
        service_instances = [s for s in healthy_services.values() if s.name == service_name]
        
        if not service_instances:
            return None
        
        if self.algorithm == 'round_robin':
            instance = service_instances[self.current_index % len(service_instances)]
            self.current_index += 1
            return instance
        elif self.algorithm == 'least_connections':
            return min(service_instances, key=lambda x: x.response_time)
        else:
            return service_instances[0]


class CircuitBreaker:
    """
    Circuit breaker pattern for fault tolerance
    """
    
    def __init__(self, failure_threshold: int = 5, timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.failure_count = 0
        self.last_failure_time = 0
        self.state = 'closed'  # closed, open, half_open
    
    def can_execute(self) -> bool:
        """Check if request can be executed"""
        if self.state == 'closed':
            return True
        elif self.state == 'open':
            if time.time() - self.last_failure_time > self.timeout:
                self.state = 'half_open'
                return True
            return False
        else:  # half_open
            return True
    
    def record_success(self):
        """Record successful execution"""
        self.failure_count = 0
        self.state = 'closed'
    
    def record_failure(self):
        """Record failed execution"""
        self.failure_count += 1
        self.last_failure_time = time.time()
        
        if self.failure_count >= self.failure_threshold:
            self.state = 'open'


class ServiceDiscovery:
    """
    Service discovery for dynamic service registration
    """
    
    def __init__(self):
        self.discovery_url = getattr(settings, 'SERVICE_DISCOVERY_URL', 'http://localhost:8500')
        self.service_name = getattr(settings, 'SERVICE_NAME', 'fpm-backend')
        self.service_port = getattr(settings, 'SERVICE_PORT', 8000)
        self.service_host = getattr(settings, 'SERVICE_HOST', 'localhost')
    
    def register_service(self):
        """Register service with discovery service"""
        service_data = {
            'ID': f'{self.service_name}-{self.service_port}',
            'Name': self.service_name,
            'Address': self.service_host,
            'Port': self.service_port,
            'Check': {
                'HTTP': f'http://{self.service_host}:{self.service_port}/health/',
                'Interval': '10s',
                'Timeout': '3s'
            }
        }
        
        try:
            response = requests.put(
                f'{self.discovery_url}/v1/agent/service/register',
                json=service_data,
                timeout=5
            )
            return response.status_code == 200
        except Exception:
            return False
    
    def discover_services(self) -> Dict[str, list]:
        """Discover available services"""
        try:
            response = requests.get(
                f'{self.discovery_url}/v1/catalog/services',
                timeout=5
            )
            if response.status_code == 200:
                return response.json()
            return {}
        except Exception:
            return {}


class EventBus:
    """
    Event bus for inter-service communication
    """
    
    def __init__(self):
        self.subscribers = {}
        self.event_queue = []
    
    def subscribe(self, event_type: str, handler):
        """Subscribe to event type"""
        if event_type not in self.subscribers:
            self.subscribers[event_type] = []
        self.subscribers[event_type].append(handler)
    
    def publish(self, event_type: str, data: Dict[str, Any]):
        """Publish event"""
        event = {
            'type': event_type,
            'data': data,
            'timestamp': time.time()
        }
        
        self.event_queue.append(event)
        
        if event_type in self.subscribers:
            for handler in self.subscribers[event_type]:
                try:
                    handler(event)
                except Exception as e:
                    print(f"Error in event handler: {e}")
    
    def process_events(self):
        """Process queued events"""
        while self.event_queue:
            event = self.event_queue.pop(0)
            # Process event asynchronously
            pass


class ServiceMesh:
    """
    Service mesh for microservices communication
    """
    
    def __init__(self):
        self.service_registry = ServiceRegistry()
        self.api_gateway = APIGateway(self.service_registry)
        self.load_balancer = LoadBalancer(self.service_registry)
        self.circuit_breaker = CircuitBreaker()
        self.event_bus = EventBus()
    
    def initialize_services(self):
        """Initialize all services"""
        # Register core services
        self.service_registry.register_service('auth-service', 'localhost', 8001)
        self.service_registry.register_service('user-service', 'localhost', 8002)
        self.service_registry.register_service('project-service', 'localhost', 8003)
        self.service_registry.register_service('ai-service', 'localhost', 8004)
        self.service_registry.register_service('file-service', 'localhost', 8005)
        self.service_registry.register_service('notification-service', 'localhost', 8006)
        
        # Set up event handlers
        self.event_bus.subscribe('user.created', self.handle_user_created)
        self.event_bus.subscribe('project.created', self.handle_project_created)
        self.event_bus.subscribe('notification.sent', self.handle_notification_sent)
    
    def handle_user_created(self, event):
        """Handle user created event"""
        print(f"User created: {event['data']}")
    
    def handle_project_created(self, event):
        """Handle project created event"""
        print(f"Project created: {event['data']}")
    
    def handle_notification_sent(self, event):
        """Handle notification sent event"""
        print(f"Notification sent: {event['data']}")
    
    def route_request(self, path: str, method: str, data: Dict[str, Any] = None) -> Dict[str, Any]:
        """Route request through service mesh"""
        if not self.circuit_breaker.can_execute():
            return {'error': 'Service temporarily unavailable'}
        
        try:
            result = self.api_gateway.route_request(path, method, data)
            self.circuit_breaker.record_success()
            return result
        except Exception as e:
            self.circuit_breaker.record_failure()
            return {'error': f'Service error: {str(e)}'}


class DistributedCache:
    """
    Distributed cache for microservices
    """
    
    def __init__(self, redis_url: str = 'redis://localhost:6379/0'):
        self.redis_url = redis_url
        self.cache_prefix = 'fpm:'
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        try:
            value = cache.get(f'{self.cache_prefix}{key}')
            return value
        except Exception:
            return None
    
    def set(self, key: str, value: Any, timeout: int = 3600):
        """Set value in cache"""
        try:
            cache.set(f'{self.cache_prefix}{key}', value, timeout)
            return True
        except Exception:
            return False
    
    def delete(self, key: str):
        """Delete value from cache"""
        try:
            cache.delete(f'{self.cache_prefix}{key}')
            return True
        except Exception:
            return False
    
    def invalidate_pattern(self, pattern: str):
        """Invalidate cache by pattern"""
        try:
            # This would require Redis-specific implementation
            pass
        except Exception:
            pass


class ServiceHealthMonitor:
    """
    Service health monitoring
    """
    
    def __init__(self, service_registry: ServiceRegistry):
        self.service_registry = service_registry
        self.monitoring_interval = 30  # seconds
        self.health_checks = {}
    
    def start_monitoring(self):
        """Start health monitoring"""
        import threading
        
        def monitor():
            while True:
                self.check_all_services()
                time.sleep(self.monitoring_interval)
        
        monitor_thread = threading.Thread(target=monitor, daemon=True)
        monitor_thread.start()
    
    def check_all_services(self):
        """Check health of all services"""
        for service_name in self.service_registry.services:
            self.check_service_health(service_name)
    
    def check_service_health(self, service_name: str):
        """Check health of specific service"""
        is_healthy = self.service_registry.health_check(service_name)
        
        if is_healthy:
            self.health_checks[service_name] = {
                'status': 'healthy',
                'last_check': time.time()
            }
        else:
            self.health_checks[service_name] = {
                'status': 'unhealthy',
                'last_check': time.time()
            }
    
    def get_health_status(self) -> Dict[str, Any]:
        """Get health status of all services"""
        return self.health_checks


# Global service mesh instance
service_mesh = ServiceMesh()
service_mesh.initialize_services()

# Health monitor
health_monitor = ServiceHealthMonitor(service_mesh.service_registry)
health_monitor.start_monitoring()

# Distributed cache
distributed_cache = DistributedCache()
