"""
Performance optimization and monitoring for the Final Project Management System
"""

import time
import psutil
import threading
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from django.core.cache import cache
from django.db import connection
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


@dataclass
class PerformanceMetrics:
    """Performance metrics data class"""
    timestamp: float
    response_time: float
    throughput: float
    error_rate: float
    cpu_usage: float
    memory_usage: float
    database_connections: int
    cache_hit_rate: float


class PerformanceMonitor:
    """
    Performance monitoring and optimization
    """
    
    def __init__(self):
        self.metrics_history: List[PerformanceMetrics] = []
        self.max_history = 1000
        self.monitoring_interval = 60  # seconds
        self.is_monitoring = False
        self.monitor_thread = None
    
    def start_monitoring(self):
        """Start performance monitoring"""
        if not self.is_monitoring:
            self.is_monitoring = True
            self.monitor_thread = threading.Thread(target=self._monitor_loop, daemon=True)
            self.monitor_thread.start()
            logger.info("Performance monitoring started")
    
    def stop_monitoring(self):
        """Stop performance monitoring"""
        self.is_monitoring = False
        if self.monitor_thread:
            self.monitor_thread.join()
        logger.info("Performance monitoring stopped")
    
    def _monitor_loop(self):
        """Main monitoring loop"""
        while self.is_monitoring:
            try:
                metrics = self._collect_metrics()
                self._store_metrics(metrics)
                self._analyze_metrics(metrics)
            except Exception as e:
                logger.error(f"Error in performance monitoring: {e}")
            
            time.sleep(self.monitoring_interval)
    
    def _collect_metrics(self) -> PerformanceMetrics:
        """Collect current performance metrics"""
        timestamp = time.time()
        
        # System metrics
        cpu_usage = psutil.cpu_percent(interval=1)
        memory_usage = psutil.virtual_memory().percent
        
        # Database metrics
        db_connections = self._get_database_connections()
        
        # Cache metrics
        cache_hit_rate = self._get_cache_hit_rate()
        
        # Application metrics
        response_time = self._get_average_response_time()
        throughput = self._get_current_throughput()
        error_rate = self._get_error_rate()
        
        return PerformanceMetrics(
            timestamp=timestamp,
            response_time=response_time,
            throughput=throughput,
            error_rate=error_rate,
            cpu_usage=cpu_usage,
            memory_usage=memory_usage,
            database_connections=db_connections,
            cache_hit_rate=cache_hit_rate
        )
    
    def _get_database_connections(self) -> int:
        """Get current database connections"""
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT count(*) FROM pg_stat_activity WHERE state = 'active'")
                return cursor.fetchone()[0]
        except Exception:
            return 0
    
    def _get_cache_hit_rate(self) -> float:
        """Get cache hit rate"""
        try:
            # This would require Redis-specific implementation
            # For now, return a placeholder
            return 0.85
        except Exception:
            return 0.0
    
    def _get_average_response_time(self) -> float:
        """Get average response time"""
        try:
            # Get from cache or calculate
            return cache.get('avg_response_time', 0.0)
        except Exception:
            return 0.0
    
    def _get_current_throughput(self) -> float:
        """Get current throughput (requests per second)"""
        try:
            # Get from cache or calculate
            return cache.get('current_throughput', 0.0)
        except Exception:
            return 0.0
    
    def _get_error_rate(self) -> float:
        """Get current error rate"""
        try:
            # Get from cache or calculate
            return cache.get('error_rate', 0.0)
        except Exception:
            return 0.0
    
    def _store_metrics(self, metrics: PerformanceMetrics):
        """Store metrics in history"""
        self.metrics_history.append(metrics)
        
        # Keep only recent metrics
        if len(self.metrics_history) > self.max_history:
            self.metrics_history = self.metrics_history[-self.max_history:]
        
        # Store in cache for quick access
        cache.set('latest_metrics', metrics, 300)  # 5 minutes
    
    def _analyze_metrics(self, metrics: PerformanceMetrics):
        """Analyze metrics for performance issues"""
        # Check for high CPU usage
        if metrics.cpu_usage > 80:
            logger.warning(f"High CPU usage: {metrics.cpu_usage}%")
        
        # Check for high memory usage
        if metrics.memory_usage > 85:
            logger.warning(f"High memory usage: {metrics.memory_usage}%")
        
        # Check for high response time
        if metrics.response_time > 2.0:
            logger.warning(f"High response time: {metrics.response_time}s")
        
        # Check for high error rate
        if metrics.error_rate > 5.0:
            logger.warning(f"High error rate: {metrics.error_rate}%")
        
        # Check for low cache hit rate
        if metrics.cache_hit_rate < 0.7:
            logger.warning(f"Low cache hit rate: {metrics.cache_hit_rate}")
    
    def get_metrics_summary(self) -> Dict[str, Any]:
        """Get performance metrics summary"""
        if not self.metrics_history:
            return {}
        
        recent_metrics = self.metrics_history[-10:]  # Last 10 measurements
        
        return {
            'current': {
                'cpu_usage': recent_metrics[-1].cpu_usage,
                'memory_usage': recent_metrics[-1].memory_usage,
                'response_time': recent_metrics[-1].response_time,
                'throughput': recent_metrics[-1].throughput,
                'error_rate': recent_metrics[-1].error_rate,
                'cache_hit_rate': recent_metrics[-1].cache_hit_rate
            },
            'averages': {
                'cpu_usage': sum(m.cpu_usage for m in recent_metrics) / len(recent_metrics),
                'memory_usage': sum(m.memory_usage for m in recent_metrics) / len(recent_metrics),
                'response_time': sum(m.response_time for m in recent_metrics) / len(recent_metrics),
                'throughput': sum(m.throughput for m in recent_metrics) / len(recent_metrics),
                'error_rate': sum(m.error_rate for m in recent_metrics) / len(recent_metrics),
                'cache_hit_rate': sum(m.cache_hit_rate for m in recent_metrics) / len(recent_metrics)
            },
            'trends': self._calculate_trends(recent_metrics)
        }
    
    def _calculate_trends(self, metrics: List[PerformanceMetrics]) -> Dict[str, str]:
        """Calculate performance trends"""
        if len(metrics) < 2:
            return {}
        
        trends = {}
        
        # CPU trend
        if metrics[-1].cpu_usage > metrics[0].cpu_usage * 1.1:
            trends['cpu'] = 'increasing'
        elif metrics[-1].cpu_usage < metrics[0].cpu_usage * 0.9:
            trends['cpu'] = 'decreasing'
        else:
            trends['cpu'] = 'stable'
        
        # Memory trend
        if metrics[-1].memory_usage > metrics[0].memory_usage * 1.1:
            trends['memory'] = 'increasing'
        elif metrics[-1].memory_usage < metrics[0].memory_usage * 0.9:
            trends['memory'] = 'decreasing'
        else:
            trends['memory'] = 'stable'
        
        # Response time trend
        if metrics[-1].response_time > metrics[0].response_time * 1.1:
            trends['response_time'] = 'increasing'
        elif metrics[-1].response_time < metrics[0].response_time * 0.9:
            trends['response_time'] = 'decreasing'
        else:
            trends['response_time'] = 'stable'
        
        return trends


class QueryOptimizer:
    """
    Database query optimization
    """
    
    def __init__(self):
        self.slow_queries = []
        self.query_cache = {}
        self.optimization_suggestions = []
    
    def analyze_query(self, query: str, execution_time: float):
        """Analyze query performance"""
        if execution_time > 1.0:  # Queries taking more than 1 second
            self.slow_queries.append({
                'query': query,
                'execution_time': execution_time,
                'timestamp': time.time()
            })
            
            # Generate optimization suggestions
            suggestions = self._generate_suggestions(query)
            if suggestions:
                self.optimization_suggestions.extend(suggestions)
    
    def _generate_suggestions(self, query: str) -> List[str]:
        """Generate optimization suggestions for query"""
        suggestions = []
        
        # Check for missing indexes
        if 'WHERE' in query.upper() and 'ORDER BY' in query.upper():
            suggestions.append("Consider adding composite index for WHERE and ORDER BY columns")
        
        # Check for N+1 queries
        if query.count('SELECT') > 1:
            suggestions.append("Consider using select_related() or prefetch_related() to avoid N+1 queries")
        
        # Check for missing LIMIT
        if 'SELECT' in query.upper() and 'LIMIT' not in query.upper():
            suggestions.append("Consider adding LIMIT clause for large result sets")
        
        return suggestions
    
    def get_optimization_report(self) -> Dict[str, Any]:
        """Get query optimization report"""
        return {
            'slow_queries': self.slow_queries[-10:],  # Last 10 slow queries
            'suggestions': self.optimization_suggestions[-20:],  # Last 20 suggestions
            'total_slow_queries': len(self.slow_queries),
            'total_suggestions': len(self.optimization_suggestions)
        }


class CacheOptimizer:
    """
    Cache optimization and management
    """
    
    def __init__(self):
        self.cache_stats = {
            'hits': 0,
            'misses': 0,
            'sets': 0,
            'deletes': 0
        }
        self.cache_patterns = {}
    
    def record_cache_hit(self, key: str):
        """Record cache hit"""
        self.cache_stats['hits'] += 1
        self._analyze_cache_pattern(key)
    
    def record_cache_miss(self, key: str):
        """Record cache miss"""
        self.cache_stats['misses'] += 1
        self._analyze_cache_pattern(key)
    
    def record_cache_set(self, key: str):
        """Record cache set"""
        self.cache_stats['sets'] += 1
    
    def record_cache_delete(self, key: str):
        """Record cache delete"""
        self.cache_stats['deletes'] += 1
    
    def _analyze_cache_pattern(self, key: str):
        """Analyze cache access patterns"""
        pattern = self._extract_pattern(key)
        if pattern not in self.cache_patterns:
            self.cache_patterns[pattern] = {'hits': 0, 'misses': 0}
        
        if 'hit' in key.lower():
            self.cache_patterns[pattern]['hits'] += 1
        else:
            self.cache_patterns[pattern]['misses'] += 1
    
    def _extract_pattern(self, key: str) -> str:
        """Extract pattern from cache key"""
        # Extract common patterns like user:123, project:456, etc.
        if ':' in key:
            return key.split(':')[0]
        return 'other'
    
    def get_cache_efficiency(self) -> Dict[str, Any]:
        """Get cache efficiency metrics"""
        total_requests = self.cache_stats['hits'] + self.cache_stats['misses']
        hit_rate = (self.cache_stats['hits'] / total_requests * 100) if total_requests > 0 else 0
        
        return {
            'hit_rate': hit_rate,
            'total_hits': self.cache_stats['hits'],
            'total_misses': self.cache_stats['misses'],
            'total_sets': self.cache_stats['sets'],
            'total_deletes': self.cache_stats['deletes'],
            'patterns': self.cache_patterns
        }
    
    def get_optimization_suggestions(self) -> List[str]:
        """Get cache optimization suggestions"""
        suggestions = []
        
        hit_rate = self.get_cache_efficiency()['hit_rate']
        
        if hit_rate < 70:
            suggestions.append("Consider increasing cache TTL for frequently accessed data")
        
        if hit_rate < 50:
            suggestions.append("Review cache key patterns and consider preloading frequently accessed data")
        
        # Analyze patterns
        for pattern, stats in self.cache_patterns.items():
            pattern_hit_rate = (stats['hits'] / (stats['hits'] + stats['misses']) * 100) if (stats['hits'] + stats['misses']) > 0 else 0
            if pattern_hit_rate < 60:
                suggestions.append(f"Consider optimizing cache strategy for pattern: {pattern}")
        
        return suggestions


class ResourceManager:
    """
    System resource management and optimization
    """
    
    def __init__(self):
        self.resource_limits = {
            'max_memory': 80,  # 80% memory usage
            'max_cpu': 85,     # 85% CPU usage
            'max_connections': 100
        }
        self.resource_alerts = []
    
    def check_resource_usage(self) -> Dict[str, Any]:
        """Check current resource usage"""
        memory = psutil.virtual_memory()
        cpu = psutil.cpu_percent(interval=1)
        
        # Get database connections
        db_connections = self._get_database_connections()
        
        usage = {
            'memory': {
                'used': memory.percent,
                'available': memory.available,
                'total': memory.total,
                'limit': self.resource_limits['max_memory']
            },
            'cpu': {
                'usage': cpu,
                'limit': self.resource_limits['max_cpu']
            },
            'database_connections': {
                'current': db_connections,
                'limit': self.resource_limits['max_connections']
            }
        }
        
        # Check for resource alerts
        self._check_resource_alerts(usage)
        
        return usage
    
    def _get_database_connections(self) -> int:
        """Get current database connections"""
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT count(*) FROM pg_stat_activity")
                return cursor.fetchone()[0]
        except Exception:
            return 0
    
    def _check_resource_alerts(self, usage: Dict[str, Any]):
        """Check for resource usage alerts"""
        alerts = []
        
        if usage['memory']['used'] > self.resource_limits['max_memory']:
            alerts.append(f"High memory usage: {usage['memory']['used']}%")
        
        if usage['cpu']['usage'] > self.resource_limits['max_cpu']:
            alerts.append(f"High CPU usage: {usage['cpu']['usage']}%")
        
        if usage['database_connections']['current'] > self.resource_limits['max_connections']:
            alerts.append(f"High database connections: {usage['database_connections']['current']}")
        
        if alerts:
            self.resource_alerts.extend(alerts)
            logger.warning(f"Resource alerts: {alerts}")
    
    def get_optimization_recommendations(self) -> List[str]:
        """Get resource optimization recommendations"""
        recommendations = []
        usage = self.check_resource_usage()
        
        # Memory recommendations
        if usage['memory']['used'] > 70:
            recommendations.append("Consider increasing server memory or optimizing memory usage")
            recommendations.append("Review and optimize large data structures")
        
        # CPU recommendations
        if usage['cpu']['usage'] > 70:
            recommendations.append("Consider CPU optimization or scaling horizontally")
            recommendations.append("Review and optimize CPU-intensive operations")
        
        # Database recommendations
        if usage['database_connections']['current'] > 80:
            recommendations.append("Consider connection pooling optimization")
            recommendations.append("Review database query efficiency")
        
        return recommendations


class PerformanceOptimizer:
    """
    Main performance optimization coordinator
    """
    
    def __init__(self):
        self.monitor = PerformanceMonitor()
        self.query_optimizer = QueryOptimizer()
        self.cache_optimizer = CacheOptimizer()
        self.resource_manager = ResourceManager()
        
        # Start monitoring
        self.monitor.start_monitoring()
    
    def get_performance_report(self) -> Dict[str, Any]:
        """Get comprehensive performance report"""
        return {
            'metrics': self.monitor.get_metrics_summary(),
            'query_optimization': self.query_optimizer.get_optimization_report(),
            'cache_efficiency': self.cache_optimizer.get_cache_efficiency(),
            'resource_usage': self.resource_manager.check_resource_usage(),
            'recommendations': {
                'cache': self.cache_optimizer.get_optimization_suggestions(),
                'resources': self.resource_manager.get_optimization_recommendations()
            }
        }
    
    def optimize_performance(self):
        """Apply performance optimizations"""
        # Clear old cache entries
        self._clear_old_cache_entries()
        
        # Optimize database connections
        self._optimize_database_connections()
        
        # Apply cache optimizations
        self._apply_cache_optimizations()
    
    def _clear_old_cache_entries(self):
        """Clear old cache entries"""
        try:
            # This would require Redis-specific implementation
            pass
        except Exception as e:
            logger.error(f"Error clearing old cache entries: {e}")
    
    def _optimize_database_connections(self):
        """Optimize database connections"""
        try:
            # Close idle connections
            with connection.cursor() as cursor:
                cursor.execute("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND state_change < now() - interval '5 minutes'")
        except Exception as e:
            logger.error(f"Error optimizing database connections: {e}")
    
    def _apply_cache_optimizations(self):
        """Apply cache optimizations"""
        try:
            # Implement cache optimization strategies
            pass
        except Exception as e:
            logger.error(f"Error applying cache optimizations: {e}")


# Global performance optimizer instance
performance_optimizer = PerformanceOptimizer()
