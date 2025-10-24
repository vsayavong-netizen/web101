from rest_framework import serializers
from .models import (
    DefenseSchedule, DefenseSession, DefenseEvaluation, DefenseResult,
    DefenseRoom, DefenseSettings, DefenseLog
)
from accounts.models import User
from projects.models import ProjectGroup


class DefenseScheduleSerializer(serializers.ModelSerializer):
    """Serializer for DefenseSchedule model."""
    
    project_id = serializers.CharField(source='project.project_id', read_only=True)
    main_committee_name = serializers.CharField(source='main_committee.get_full_name', read_only=True)
    second_committee_name = serializers.CharField(source='second_committee.get_full_name', read_only=True)
    third_committee_name = serializers.CharField(source='third_committee.get_full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = DefenseSchedule
        fields = [
            'id', 'project', 'project_id', 'defense_date', 'defense_time',
            'defense_room', 'defense_duration', 'main_committee', 'main_committee_name',
            'second_committee', 'second_committee_name', 'third_committee', 'third_committee_name',
            'status', 'notes', 'special_requirements', 'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class DefenseScheduleCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating DefenseSchedule."""
    
    class Meta:
        model = DefenseSchedule
        fields = [
            'project', 'defense_date', 'defense_time', 'defense_room',
            'defense_duration', 'main_committee', 'second_committee', 'third_committee',
            'notes', 'special_requirements'
        ]


class DefenseSessionSerializer(serializers.ModelSerializer):
    """Serializer for DefenseSession model."""
    
    defense_schedule_id = serializers.UUIDField(source='defense_schedule.id', read_only=True)
    project_id = serializers.CharField(source='defense_schedule.project.project_id', read_only=True)
    
    class Meta:
        model = DefenseSession
        fields = [
            'id', 'defense_schedule', 'defense_schedule_id', 'project_id',
            'session_type', 'status', 'start_time', 'end_time', 'actual_duration',
            'session_notes', 'committee_notes', 'student_notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class DefenseSessionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating DefenseSession."""
    
    class Meta:
        model = DefenseSession
        fields = [
            'defense_schedule', 'session_type', 'session_notes',
            'committee_notes', 'student_notes'
        ]


class DefenseEvaluationSerializer(serializers.ModelSerializer):
    """Serializer for DefenseEvaluation model."""
    
    evaluator_name = serializers.CharField(source='evaluator.get_full_name', read_only=True)
    defense_session_id = serializers.UUIDField(source='defense_session.id', read_only=True)
    project_id = serializers.CharField(source='defense_session.defense_schedule.project.project_id', read_only=True)
    
    class Meta:
        model = DefenseEvaluation
        fields = [
            'id', 'defense_session', 'defense_session_id', 'project_id',
            'evaluator', 'evaluator_name', 'evaluation_type', 'score', 'max_score',
            'comments', 'strengths', 'weaknesses', 'recommendations',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class DefenseEvaluationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating DefenseEvaluation."""
    
    class Meta:
        model = DefenseEvaluation
        fields = [
            'defense_session', 'evaluation_type', 'score', 'max_score',
            'comments', 'strengths', 'weaknesses', 'recommendations'
        ]


class DefenseResultSerializer(serializers.ModelSerializer):
    """Serializer for DefenseResult model."""
    
    defense_session_id = serializers.UUIDField(source='defense_session.id', read_only=True)
    project_id = serializers.CharField(source='defense_session.defense_schedule.project.project_id', read_only=True)
    final_decision_by_name = serializers.CharField(source='final_decision_by.get_full_name', read_only=True)
    
    class Meta:
        model = DefenseResult
        fields = [
            'id', 'defense_session', 'defense_session_id', 'project_id',
            'result_type', 'total_score', 'max_possible_score',
            'committee_decision', 'committee_recommendations', 'revision_requirements',
            'final_decision', 'final_decision_by', 'final_decision_by_name',
            'final_decision_notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class DefenseResultCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating DefenseResult."""
    
    class Meta:
        model = DefenseResult
        fields = [
            'defense_session', 'result_type', 'total_score', 'max_possible_score',
            'committee_decision', 'committee_recommendations', 'revision_requirements',
            'final_decision', 'final_decision_notes'
        ]


class DefenseRoomSerializer(serializers.ModelSerializer):
    """Serializer for DefenseRoom model."""
    
    class Meta:
        model = DefenseRoom
        fields = [
            'id', 'name', 'room_type', 'capacity', 'location',
            'equipment', 'is_available', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class DefenseRoomCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating DefenseRoom."""
    
    class Meta:
        model = DefenseRoom
        fields = [
            'name', 'room_type', 'capacity', 'location', 'equipment', 'is_available'
        ]


class DefenseSettingsSerializer(serializers.ModelSerializer):
    """Serializer for DefenseSettings model."""
    
    class Meta:
        model = DefenseSettings
        fields = [
            'id', 'name', 'description', 'default_duration', 'max_duration',
            'min_duration', 'pass_threshold', 'conditional_pass_threshold',
            'send_reminders', 'reminder_days', 'send_notifications',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class DefenseSettingsCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating DefenseSettings."""
    
    class Meta:
        model = DefenseSettings
        fields = [
            'name', 'description', 'default_duration', 'max_duration',
            'min_duration', 'pass_threshold', 'conditional_pass_threshold',
            'send_reminders', 'reminder_days', 'send_notifications'
        ]


class DefenseLogSerializer(serializers.ModelSerializer):
    """Serializer for DefenseLog model."""
    
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    project_id = serializers.CharField(source='defense_schedule.project.project_id', read_only=True)
    
    class Meta:
        model = DefenseLog
        fields = [
            'id', 'defense_schedule', 'project_id', 'log_type', 'user', 'user_name',
            'message', 'metadata', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class DefenseLogCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating DefenseLog."""
    
    class Meta:
        model = DefenseLog
        fields = [
            'defense_schedule', 'log_type', 'message', 'metadata'
        ]


class DefenseScheduleSearchSerializer(serializers.Serializer):
    """Serializer for defense schedule search."""
    
    query = serializers.CharField(required=False)
    project_id = serializers.CharField(required=False)
    status = serializers.ChoiceField(choices=DefenseSchedule.STATUS_CHOICES, required=False)
    defense_date_from = serializers.DateTimeField(required=False)
    defense_date_to = serializers.DateTimeField(required=False)
    committee_member_id = serializers.IntegerField(required=False)
    room = serializers.CharField(required=False)


class DefenseStatisticsSerializer(serializers.Serializer):
    """Serializer for defense statistics."""
    
    total_schedules = serializers.IntegerField()
    completed_defenses = serializers.IntegerField()
    pending_defenses = serializers.IntegerField()
    cancelled_defenses = serializers.IntegerField()
    average_score = serializers.FloatField()
    pass_rate = serializers.FloatField()
    conditional_pass_rate = serializers.FloatField()
    fail_rate = serializers.FloatField()
    defenses_by_month = serializers.DictField()
    top_evaluators = serializers.ListField()
    room_usage = serializers.DictField()
    recent_defenses = serializers.ListField()


class DefenseReminderSerializer(serializers.Serializer):
    """Serializer for defense reminders."""
    
    defense_schedule_id = serializers.UUIDField()
    reminder_type = serializers.ChoiceField(choices=[
        ('upcoming', 'Upcoming Defense'),
        ('reminder', 'Reminder'),
        ('cancellation', 'Cancellation'),
    ])
    message = serializers.CharField()
    send_to = serializers.ListField(child=serializers.IntegerField())


class DefenseEvaluationSummarySerializer(serializers.Serializer):
    """Serializer for defense evaluation summary."""
    
    defense_session_id = serializers.UUIDField()
    total_evaluations = serializers.IntegerField()
    average_score = serializers.FloatField()
    highest_score = serializers.FloatField()
    lowest_score = serializers.FloatField()
    evaluation_types = serializers.DictField()
    evaluator_scores = serializers.DictField()
    overall_rating = serializers.CharField()


class DefenseRoomAvailabilitySerializer(serializers.Serializer):
    """Serializer for defense room availability."""
    
    room_id = serializers.UUIDField()
    date = serializers.DateField()
    available_slots = serializers.ListField()
    booked_slots = serializers.ListField()
    conflicts = serializers.ListField()
