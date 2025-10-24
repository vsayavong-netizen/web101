from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Committee, CommitteeAssignment, CommitteeEvaluation, CommitteeMeeting,
    CommitteeMember, CommitteeNote
)

User = get_user_model()


class CommitteeSerializer(serializers.ModelSerializer):
    """Serializer for Committee model."""
    
    chairperson_name = serializers.SerializerMethodField()
    members = serializers.SerializerMethodField()
    assignments = serializers.SerializerMethodField()
    recent_meetings = serializers.SerializerMethodField()
    recent_notes = serializers.SerializerMethodField()
    
    class Meta:
        model = Committee
        fields = [
            'id', 'committee_id', 'name', 'committee_type', 'description',
            'chairperson_name', 'members', 'is_active', 'established_date',
            'dissolved_date', 'created_at', 'updated_at', 'assignments',
            'recent_meetings', 'recent_notes'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_chairperson_name(self, obj):
        """Get chairperson's name."""
        return obj.chairperson.get_full_name() if obj.chairperson else None
    
    def get_members(self, obj):
        """Get committee members."""
        members = obj.members.all()
        return [
            {
                'id': member.id,
                'name': member.get_full_name(),
                'email': member.email,
                'role': member.role
            }
            for member in members
        ]
    
    def get_assignments(self, obj):
        """Get recent assignments."""
        assignments = obj.assignments.all()[:10]  # Last 10 assignments
        return [
            {
                'id': assignment.id,
                'project_id': assignment.project_group.project_id,
                'assignment_type': assignment.assignment_type,
                'assigned_date': assignment.assigned_date,
                'is_completed': assignment.is_completed,
                'evaluation_date': assignment.evaluation_date
            }
            for assignment in assignments
        ]
    
    def get_recent_meetings(self, obj):
        """Get recent meetings."""
        meetings = obj.meetings.all()[:5]  # Last 5 meetings
        return [
            {
                'id': meeting.id,
                'meeting_date': meeting.meeting_date,
                'meeting_time': meeting.meeting_time,
                'meeting_room': meeting.meeting_room,
                'agenda': meeting.agenda,
                'is_completed': meeting.is_completed
            }
            for meeting in meetings
        ]
    
    def get_recent_notes(self, obj):
        """Get recent notes."""
        notes = obj.notes.filter(is_private=False).all()[:5]  # Last 5 public notes
        return [
            {
                'id': note.id,
                'note_type': note.note_type,
                'title': note.title,
                'content': note.content,
                'created_by': note.created_by.get_full_name(),
                'created_at': note.created_at
            }
            for note in notes
        ]


class CommitteeCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new committees."""
    
    member_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text="List of user IDs to add as members"
    )
    
    class Meta:
        model = Committee
        fields = [
            'committee_id', 'name', 'committee_type', 'description',
            'chairperson', 'member_ids', 'established_date'
        ]
    
    def create(self, validated_data):
        """Create a new committee."""
        member_ids = validated_data.pop('member_ids', [])
        committee = Committee.objects.create(**validated_data)
        
        # Add members
        for member_id in member_ids:
            try:
                member = User.objects.get(id=member_id)
                committee.members.add(member)
            except User.DoesNotExist:
                continue
        
        return committee


class CommitteeUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating committee information."""
    
    class Meta:
        model = Committee
        fields = [
            'name', 'description', 'chairperson', 'is_active',
            'dissolved_date'
        ]


class CommitteeAssignmentSerializer(serializers.ModelSerializer):
    """Serializer for committee assignments."""
    
    project_info = serializers.SerializerMethodField()
    committee_info = serializers.SerializerMethodField()
    assigned_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = CommitteeAssignment
        fields = [
            'id', 'project_info', 'committee_info', 'assignment_type',
            'assigned_date', 'assigned_by_name', 'evaluation_date',
            'evaluation_time', 'evaluation_room', 'is_completed',
            'completion_date', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_project_info(self, obj):
        """Get project information."""
        return {
            'id': obj.project_group.id,
            'project_id': obj.project_group.project_id,
            'topic_eng': obj.project_group.topic_eng,
            'advisor_name': obj.project_group.advisor_name
        }
    
    def get_committee_info(self, obj):
        """Get committee information."""
        return {
            'id': obj.committee.id,
            'committee_id': obj.committee.committee_id,
            'name': obj.committee.name,
            'committee_type': obj.committee.committee_type
        }
    
    def get_assigned_by_name(self, obj):
        """Get assigner's name."""
        return obj.assigned_by.get_full_name() if obj.assigned_by else None


class CommitteeEvaluationSerializer(serializers.ModelSerializer):
    """Serializer for committee evaluations."""
    
    evaluator_name = serializers.SerializerMethodField()
    project_info = serializers.SerializerMethodField()
    
    class Meta:
        model = CommitteeEvaluation
        fields = [
            'id', 'evaluator_name', 'project_info', 'technical_score',
            'presentation_score', 'documentation_score', 'innovation_score',
            'total_score', 'strengths', 'weaknesses', 'recommendations',
            'overall_comments', 'decision', 'decision_reason',
            'evaluated_at', 'updated_at'
        ]
        read_only_fields = ['id', 'evaluated_at', 'updated_at']
    
    def get_evaluator_name(self, obj):
        """Get evaluator's name."""
        return obj.evaluator.get_full_name()
    
    def get_project_info(self, obj):
        """Get project information."""
        return {
            'id': obj.assignment.project_group.id,
            'project_id': obj.assignment.project_group.project_id,
            'topic_eng': obj.assignment.project_group.topic_eng
        }


class CommitteeMeetingSerializer(serializers.ModelSerializer):
    """Serializer for committee meetings."""
    
    attendees = serializers.SerializerMethodField()
    chairperson_name = serializers.SerializerMethodField()
    
    class Meta:
        model = CommitteeMeeting
        fields = [
            'id', 'meeting_date', 'meeting_time', 'meeting_room',
            'agenda', 'attendees', 'chairperson_name', 'minutes',
            'decisions', 'action_items', 'is_completed', 'completion_date',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_attendees(self, obj):
        """Get meeting attendees."""
        attendees = obj.attendees.all()
        return [
            {
                'id': attendee.id,
                'name': attendee.get_full_name(),
                'email': attendee.email,
                'role': attendee.role
            }
            for attendee in attendees
        ]
    
    def get_chairperson_name(self, obj):
        """Get chairperson's name."""
        return obj.chairperson.get_full_name() if obj.chairperson else None


class CommitteeMemberSerializer(serializers.ModelSerializer):
    """Serializer for committee members."""
    
    member_name = serializers.SerializerMethodField()
    
    class Meta:
        model = CommitteeMember
        fields = [
            'id', 'member_name', 'role', 'joined_date', 'left_date',
            'is_active', 'responsibilities', 'expertise_areas',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_member_name(self, obj):
        """Get member's name."""
        return obj.member.get_full_name()


class CommitteeNoteSerializer(serializers.ModelSerializer):
    """Serializer for committee notes."""
    
    created_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = CommitteeNote
        fields = [
            'id', 'note_type', 'title', 'content', 'is_private',
            'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_created_by_name(self, obj):
        """Get creator's name."""
        return obj.created_by.get_full_name()


class CommitteeBulkUpdateSerializer(serializers.Serializer):
    """Serializer for bulk updating committees."""
    
    committee_ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="List of committee IDs to update"
    )
    updates = serializers.DictField(
        help_text="Dictionary of fields to update"
    )
    
    def validate_updates(self, value):
        """Validate update fields."""
        allowed_fields = [
            'is_active', 'chairperson', 'dissolved_date'
        ]
        
        for field in value.keys():
            if field not in allowed_fields:
                raise serializers.ValidationError(f"Field '{field}' is not allowed for bulk update.")
        
        return value


class CommitteeSearchSerializer(serializers.Serializer):
    """Serializer for committee search parameters."""
    
    query = serializers.CharField(required=False, help_text="Search query")
    committee_type = serializers.CharField(required=False, help_text="Filter by committee type")
    is_active = serializers.BooleanField(required=False, help_text="Filter by active status")
    chairperson = serializers.CharField(required=False, help_text="Filter by chairperson")


class CommitteeStatisticsSerializer(serializers.Serializer):
    """Serializer for committee statistics."""
    
    total_committees = serializers.IntegerField()
    active_committees = serializers.IntegerField()
    inactive_committees = serializers.IntegerField()
    total_assignments = serializers.IntegerField()
    completed_assignments = serializers.IntegerField()
    pending_assignments = serializers.IntegerField()
    total_meetings = serializers.IntegerField()
    upcoming_meetings = serializers.IntegerField()
    committee_type_distribution = serializers.DictField()
    average_evaluation_score = serializers.FloatField()
