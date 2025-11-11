"""
Serializers for system monitoring
"""
from rest_framework import serializers
from .models import (
    SystemMetrics, RequestLog, ErrorLog, HealthCheck, PerformanceMetric
)
from django.contrib.auth import get_user_model

User = get_user_model()


class SystemMetricsSerializer(serializers.ModelSerializer):
    """Serializer for SystemMetrics"""
    user_username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = SystemMetrics
        fields = [
            'id', 'metric_type', 'value', 'metadata', 'timestamp',
            'endpoint', 'user', 'user_username'
        ]
        read_only_fields = ['id', 'timestamp']


class RequestLogSerializer(serializers.ModelSerializer):
    """Serializer for RequestLog"""
    user_username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = RequestLog
        fields = [
            'id', 'timestamp', 'method', 'path', 'query_params',
            'status_code', 'response_time', 'user', 'user_username',
            'ip_address', 'user_agent', 'referer', 'response_size',
            'error_message'
        ]
        read_only_fields = ['id', 'timestamp']


class ErrorLogSerializer(serializers.ModelSerializer):
    """Serializer for ErrorLog"""
    user_username = serializers.CharField(source='user.username', read_only=True)
    resolved_by_username = serializers.CharField(source='resolved_by.username', read_only=True)
    
    class Meta:
        model = ErrorLog
        fields = [
            'id', 'timestamp', 'level', 'message', 'exception_type',
            'traceback', 'path', 'method', 'user', 'user_username',
            'ip_address', 'resolved', 'resolved_at', 'resolved_by',
            'resolved_by_username'
        ]
        read_only_fields = ['id', 'timestamp', 'resolved_at']


class HealthCheckSerializer(serializers.ModelSerializer):
    """Serializer for HealthCheck"""
    
    class Meta:
        model = HealthCheck
        fields = [
            'id', 'timestamp', 'status', 'database_status', 'cache_status',
            'redis_status', 'disk_usage', 'memory_usage', 'cpu_usage',
            'response_time', 'details'
        ]
        read_only_fields = ['id', 'timestamp']


class PerformanceMetricSerializer(serializers.ModelSerializer):
    """Serializer for PerformanceMetric"""
    user_username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = PerformanceMetric
        fields = [
            'id', 'endpoint', 'method', 'response_time', 'database_time',
            'query_count', 'cache_hits', 'cache_misses', 'timestamp',
            'user', 'user_username'
        ]
        read_only_fields = ['id', 'timestamp']

