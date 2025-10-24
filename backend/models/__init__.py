"""
Models package for Final Project Management System
"""

from .base import (
    AcademicYearModel,
    TimestampedModel,
    UUIDModel,
    User,
    SoftDeleteModel,
    AuditModel,
    BaseModel
)

__all__ = [
    'AcademicYearModel',
    'TimestampedModel', 
    'UUIDModel',
    'User',
    'SoftDeleteModel',
    'AuditModel',
    'BaseModel'
]
