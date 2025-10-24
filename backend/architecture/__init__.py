"""
Architecture package for the Final Project Management System
"""

from .microservices import service_mesh, health_monitor, distributed_cache
from .performance import performance_optimizer
from .scalability import scalability_manager
from .security import security_manager

__all__ = [
    'service_mesh',
    'health_monitor', 
    'distributed_cache',
    'performance_optimizer',
    'scalability_manager',
    'security_manager'
]
