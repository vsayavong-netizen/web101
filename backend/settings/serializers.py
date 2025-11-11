"""
Serializers for settings app
"""
from rest_framework import serializers
from .models import AcademicYear, SystemSettings


class AcademicYearSerializer(serializers.ModelSerializer):
    """Serializer for AcademicYear model."""
    
    class Meta:
        model = AcademicYear
        fields = [
            'id', 'year', 'start_date', 'end_date', 
            'is_active', 'description', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_year(self, value):
        """Validate year format."""
        if not value:
            raise serializers.ValidationError("Year is required")
        
        # Accept both "2024" and "2024-2025" formats
        if '-' in value:
            parts = value.split('-')
            if len(parts) != 2 or not all(p.isdigit() and len(p) == 4 for p in parts):
                raise serializers.ValidationError("Year format must be YYYY or YYYY-YYYY")
            if int(parts[1]) != int(parts[0]) + 1:
                raise serializers.ValidationError("Second year must be one year after first year")
        elif not value.isdigit() or len(value) != 4:
            raise serializers.ValidationError("Year must be a 4-digit year (e.g., 2024)")
        
        return value
    
    def validate(self, data):
        """Validate start_date and end_date."""
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        
        if start_date and end_date and start_date >= end_date:
            raise serializers.ValidationError({
                'end_date': 'End date must be after start date'
            })
        
        return data


class AcademicYearListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing academic years."""
    
    class Meta:
        model = AcademicYear
        fields = ['id', 'year', 'is_active', 'start_date', 'end_date']
        read_only_fields = ['id']


class SystemSettingsSerializer(serializers.ModelSerializer):
    """Serializer for SystemSettings model."""
    
    class Meta:
        model = SystemSettings
        fields = [
            'id', 'setting_name', 'setting_value', 'setting_type',
            'description', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

