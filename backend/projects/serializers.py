"""
Project management serializers
"""

from rest_framework import serializers
from django.db import transaction
from .models import Project, ProjectGroup, ProjectStatus
from students.models import Student
from advisors.models import Advisor
from milestones.models import Milestone, MilestoneTemplate
from projects.models import LogEntry
from utils.helpers import generate_project_id


class ProjectSerializer(serializers.ModelSerializer):
    """
    Project serializer for CRUD operations
    """
    student_names = serializers.SerializerMethodField()
    student_count = serializers.SerializerMethodField()
    committee_member_names = serializers.SerializerMethodField()
    milestone_count = serializers.SerializerMethodField()
    pending_milestone_count = serializers.SerializerMethodField()
    is_scheduled = serializers.SerializerMethodField()
    final_score = serializers.SerializerMethodField()
    recent_activity = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            'id', 'project_id', 'topic_lao', 'topic_eng', 'advisor_name',
            'advisor', 'comment', 'status', 'main_committee', 'second_committee',
            'third_committee', 'defense_date', 'defense_time', 'defense_room',
            'final_grade', 'main_advisor_score', 'main_committee_score',
            'second_committee_score', 'third_committee_score', 'detailed_scores',
            'student_names', 'student_count', 'committee_member_names',
            'milestone_count', 'pending_milestone_count', 'is_scheduled',
            'final_score', 'recent_activity', 'academic_year',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'project_id', 'academic_year', 'created_at', 'updated_at']

    def get_student_names(self, obj):
        return obj.get_student_names()

    def get_student_count(self, obj):
        return obj.projectgroup.students.count() if hasattr(obj, 'projectgroup') else 0

    def get_committee_member_names(self, obj):
        members = obj.get_committee_members()
        return {role: advisor.name for role, advisor in members}

    def get_milestone_count(self, obj):
        return obj.get_milestones().count()

    def get_pending_milestone_count(self, obj):
        return obj.get_pending_milestones().count()

    def get_is_scheduled(self, obj):
        return obj.is_scheduled()

    def get_final_score(self, obj):
        return obj.get_final_score()

    def get_recent_activity(self, obj):
        recent_logs = obj.get_recent_activity(days=7)
        return [
            {
                'type': log.type,
                'author': log.author_name,
                'message': log.message,
                'timestamp': log.created_at
            }
            for log in recent_logs[:5]  # Last 5 activities
        ]

    def create(self, validated_data):
        """Create project with auto-generated project ID"""
        # Generate project ID
        academic_year = validated_data.get('academic_year', self.context['request'].user.academic_year)
        last_project = Project.objects.filter(academic_year=academic_year).order_by('-id').first()
        sequence = (last_project.id + 1) if last_project else 1
        validated_data['project_id'] = generate_project_id(academic_year, sequence)
        
        return super().create(validated_data)


class ProjectCreateSerializer(serializers.ModelSerializer):
    """
    Project creation serializer with students
    """
    student_ids = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        help_text="List of student IDs to add to project"
    )
    template_id = serializers.CharField(
        required=False,
        allow_null=True,
        help_text="Milestone template ID to apply"
    )
    
    class Meta:
        model = Project
        fields = [
            'topic_lao', 'topic_eng', 'advisor_name', 'advisor',
            'comment', 'student_ids', 'template_id', 'academic_year'
        ]

    def validate_student_ids(self, value):
        """Validate student IDs"""
        if not value:
            raise serializers.ValidationError("At least one student is required.")
        
        # Check if students exist and are available
        students = Student.objects.filter(student_id__in=value)
        if len(students) != len(value):
            missing = set(value) - set(students.values_list('student_id', flat=True))
            raise serializers.ValidationError(f"Students not found: {', '.join(missing)}")
        
        # Check if students already have projects
        for student in students:
            if not student.can_register_project():
                raise serializers.ValidationError(f"Student {student.student_id} already has an active project.")
        
        return value

    def validate_advisor(self, value):
        """Validate advisor availability"""
        if value and not value.can_supervise_more_projects():
            raise serializers.ValidationError("Advisor has reached their quota limit.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        """Create project with students and milestones"""
        student_ids = validated_data.pop('student_ids')
        template_id = validated_data.pop('template_id', None)
        
        # Create project
        project = Project.objects.create(**validated_data)
        
        # Create project group
        project_group = ProjectGroup.objects.create(
            project=project,
            academic_year=project.academic_year
        )
        
        # Add students to project group
        students = Student.objects.filter(student_id__in=student_ids)
        project_group.students.set(students)
        
        # Apply milestone template if provided
        if template_id:
            try:
                template = MilestoneTemplate.objects.get(id=template_id)
                self._create_milestones_from_template(project, template)
            except MilestoneTemplate.DoesNotExist:
                pass  # Continue without milestones
        
        return project

    def _create_milestones_from_template(self, project, template):
        """Create milestones from template"""
        from django.utils import timezone
        
        milestones = []
        current_date = timezone.now().date()
        
        for task in template.tasks.all():
            due_date = current_date + timezone.timedelta(days=task.duration_days)
            milestone = Milestone.objects.create(
                project=project,
                name=task.name,
                due_date=due_date,
                academic_year=project.academic_year
            )
            milestones.append(milestone)
            current_date = due_date


class ProjectUpdateSerializer(serializers.ModelSerializer):
    """
    Project update serializer
    """
    class Meta:
        model = Project
        fields = [
            'topic_lao', 'topic_eng', 'advisor_name', 'advisor',
            'comment', 'status', 'main_committee', 'second_committee',
            'third_committee', 'defense_date', 'defense_time',
            'defense_room', 'final_grade'
        ]

    def validate_advisor(self, value):
        """Validate advisor availability"""
        if value and not value.can_supervise_more_projects():
            raise serializers.ValidationError("Advisor has reached their quota limit.")
        return value


class ProjectStatusUpdateSerializer(serializers.Serializer):
    """
    Project status update serializer
    """
    status = serializers.ChoiceField(choices=ProjectStatus.choices)
    comment = serializers.CharField(required=False, allow_blank=True)
    template_id = serializers.CharField(required=False, allow_null=True)

    def validate_template_id(self, value):
        """Validate milestone template"""
        if value:
            try:
                MilestoneTemplate.objects.get(id=value)
            except MilestoneTemplate.DoesNotExist:
                raise serializers.ValidationError("Milestone template not found.")
        return value


class ProjectCommitteeUpdateSerializer(serializers.Serializer):
    """
    Project committee update serializer
    """
    committee_type = serializers.ChoiceField(choices=['main', 'second', 'third'])
    advisor_id = serializers.IntegerField(required=False, allow_null=True)

    def validate_advisor_id(self, value):
        """Validate advisor availability for committee"""
        if value:
            try:
                advisor = Advisor.objects.get(id=value)
                # Check if advisor can join committee
                if not advisor.can_join_committee(self.initial_data.get('committee_type')):
                    raise serializers.ValidationError("Advisor has reached committee quota limit.")
            except Advisor.DoesNotExist:
                raise serializers.ValidationError("Advisor not found.")
        return value


class ProjectDefenseScheduleSerializer(serializers.Serializer):
    """
    Project defense schedule serializer
    """
    defense_date = serializers.DateField(required=False, allow_null=True)
    defense_time = serializers.TimeField(required=False, allow_null=True)
    defense_room = serializers.CharField(max_length=100, required=False, allow_blank=True)

    def validate(self, attrs):
        """Validate defense schedule"""
        date = attrs.get('defense_date')
        time = attrs.get('defense_time')
        room = attrs.get('defense_room')
        
        # If any defense field is provided, all should be provided
        if any([date, time, room]) and not all([date, time, room]):
            raise serializers.ValidationError("All defense fields (date, time, room) must be provided together.")
        
        return attrs


class ProjectScoringSerializer(serializers.Serializer):
    """
    Project scoring serializer
    """
    evaluator_id = serializers.IntegerField()
    scores = serializers.DictField(
        child=serializers.DecimalField(max_digits=5, decimal_places=2)
    )

    def validate_evaluator_id(self, value):
        """Validate evaluator"""
        try:
            Advisor.objects.get(id=value)
        except Advisor.DoesNotExist:
            raise serializers.ValidationError("Evaluator not found.")
        return value

    def validate_scores(self, value):
        """Validate scores"""
        if not value:
            raise serializers.ValidationError("Scores cannot be empty.")
        
        # Validate score ranges (0-100)
        for criterion, score in value.items():
            if not (0 <= float(score) <= 100):
                raise serializers.ValidationError(f"Score for {criterion} must be between 0 and 100.")
        
        return value


class ProjectTransferSerializer(serializers.Serializer):
    """
    Project transfer serializer
    """
    new_advisor_id = serializers.IntegerField()
    comment = serializers.CharField()

    def validate_new_advisor_id(self, value):
        """Validate new advisor"""
        try:
            advisor = Advisor.objects.get(id=value)
            if not advisor.can_supervise_more_projects():
                raise serializers.ValidationError("New advisor has reached their quota limit.")
        except Advisor.DoesNotExist:
            raise serializers.ValidationError("Advisor not found.")
        return value


class ProjectLogEntrySerializer(serializers.ModelSerializer):
    """
    Project log entry serializer
    """
    author_name = serializers.CharField(read_only=True)
    author_role = serializers.CharField(read_only=True)
    
    class Meta:
        model = LogEntry
        fields = [
            'id', 'type', 'author_id', 'author_name', 'author_role',
            'message', 'file_id', 'file_name', 'file_type', 'file_size',
            'created_at'
        ]
        read_only_fields = ['id', 'author_id', 'created_at']

    def create(self, validated_data):
        """Create log entry with author information"""
        request = self.context['request']
        validated_data['author_id'] = request.user.id
        validated_data['author_name'] = request.user.get_full_name()
        validated_data['author_role'] = request.user.role
        
        return super().create(validated_data)


class ProjectStatisticsSerializer(serializers.Serializer):
    """
    Project statistics serializer
    """
    total_projects = serializers.IntegerField()
    pending_projects = serializers.IntegerField()
    approved_projects = serializers.IntegerField()
    rejected_projects = serializers.IntegerField()
    scheduled_defenses = serializers.IntegerField()
    unscheduled_defenses = serializers.IntegerField()
    projects_by_status = serializers.DictField()
    projects_by_advisor = serializers.DictField()
    projects_by_major = serializers.DictField()
    average_milestone_completion = serializers.FloatField()
    projects_needing_attention = serializers.IntegerField()


class BulkProjectUpdateSerializer(serializers.Serializer):
    """
    Bulk project update serializer
    """
    project_ids = serializers.ListField(
        child=serializers.CharField(),
        help_text="List of project IDs to update"
    )
    updates = serializers.DictField(
        help_text="Fields to update for all projects"
    )

    def validate_project_ids(self, value):
        """Validate project IDs"""
        existing_ids = Project.objects.filter(
            project_id__in=value
        ).values_list('project_id', flat=True)
        
        missing_ids = set(value) - set(existing_ids)
        if missing_ids:
            raise serializers.ValidationError(
                f"Project IDs not found: {', '.join(missing_ids)}"
            )
        return value

    def validate_updates(self, value):
        """Validate update fields"""
        allowed_fields = [
            'status', 'defense_date', 'defense_time', 'defense_room',
            'final_grade'
        ]
        
        invalid_fields = set(value.keys()) - set(allowed_fields)
        if invalid_fields:
            raise serializers.ValidationError(
                f"Invalid fields: {', '.join(invalid_fields)}"
            )
        return value


class ProjectSearchSerializer(serializers.Serializer):
    """
    Project search serializer
    """
    query = serializers.CharField(required=False)
    status = serializers.CharField(required=False)
    advisor = serializers.CharField(required=False)
    major = serializers.CharField(required=False)
    scheduled = serializers.BooleanField(required=False)
    academic_year = serializers.CharField(required=False)
    ordering = serializers.CharField(required=False)
    page = serializers.IntegerField(required=False, min_value=1)
    page_size = serializers.IntegerField(required=False, min_value=1, max_value=100)