"""
Project management serializers
"""

from rest_framework import serializers
from django.db import transaction
from .models import Project, ProjectGroup, ProjectStatus, ProjectStudent
from students.models import Student
from advisors.models import Advisor
from milestones.models import Milestone, MilestoneTemplate
from projects.models import LogEntry
from core.utils import generate_project_id


class ProjectSerializer(serializers.ModelSerializer):
    """
    Project serializer for CRUD operations
    """
    # Fields from ProjectGroup
    topic_lao = serializers.SerializerMethodField()
    topic_eng = serializers.SerializerMethodField()
    advisor_name = serializers.SerializerMethodField()
    comment = serializers.SerializerMethodField()
    main_committee = serializers.SerializerMethodField()
    second_committee = serializers.SerializerMethodField()
    third_committee = serializers.SerializerMethodField()
    defense_date = serializers.SerializerMethodField()
    defense_time = serializers.SerializerMethodField()
    defense_room = serializers.SerializerMethodField()
    final_grade = serializers.SerializerMethodField()
    main_advisor_score = serializers.SerializerMethodField()
    main_committee_score = serializers.SerializerMethodField()
    second_committee_score = serializers.SerializerMethodField()
    third_committee_score = serializers.SerializerMethodField()
    detailed_scores = serializers.SerializerMethodField()
    academic_year = serializers.SerializerMethodField()
    
    # Computed fields
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
    
    def _get_project_group(self, obj):
        """Helper to get project group."""
        try:
            return ProjectGroup.objects.get(project_id=obj.project_id)
        except:
            return None
    
    def get_topic_lao(self, obj):
        try:
            pg = self._get_project_group(obj)
            return pg.topic_lao if pg else ''
        except Exception:
            return ''
    
    def get_topic_eng(self, obj):
        try:
            pg = self._get_project_group(obj)
            return pg.topic_eng if pg else (obj.title if hasattr(obj, 'title') else '')
        except Exception:
            return obj.title if hasattr(obj, 'title') else ''
    
    def get_advisor_name(self, obj):
        try:
            pg = self._get_project_group(obj)
            if pg:
                return pg.advisor_name
            if obj.advisor and hasattr(obj.advisor, 'user'):
                return obj.advisor.user.get_full_name()
            return ''
        except Exception:
            return ''
    
    def get_comment(self, obj):
        try:
            pg = self._get_project_group(obj)
            return pg.comment if pg else ''
        except Exception:
            return ''
    
    def get_main_committee(self, obj):
        try:
            pg = self._get_project_group(obj)
            if pg and pg.main_committee_id:
                try:
                    return Advisor.objects.get(advisor_id=pg.main_committee_id).id
                except:
                    pass
        except Exception:
            pass
        return None
    
    def get_second_committee(self, obj):
        try:
            pg = self._get_project_group(obj)
            if pg and pg.second_committee_id:
                try:
                    return Advisor.objects.get(advisor_id=pg.second_committee_id).id
                except:
                    pass
        except Exception:
            pass
        return None
    
    def get_third_committee(self, obj):
        try:
            pg = self._get_project_group(obj)
            if pg and pg.third_committee_id:
                try:
                    return Advisor.objects.get(advisor_id=pg.third_committee_id).id
                except:
                    pass
        except Exception:
            pass
        return None
    
    def get_defense_date(self, obj):
        try:
            pg = self._get_project_group(obj)
            return pg.defense_date if pg else None
        except Exception:
            return None
    
    def get_defense_time(self, obj):
        try:
            pg = self._get_project_group(obj)
            return pg.defense_time if pg else None
        except Exception:
            return None
    
    def get_defense_room(self, obj):
        try:
            pg = self._get_project_group(obj)
            return pg.defense_room if pg else None
        except Exception:
            return None
    
    def get_final_grade(self, obj):
        try:
            pg = self._get_project_group(obj)
            return pg.final_grade if pg else None
        except Exception:
            return None
    
    def get_main_advisor_score(self, obj):
        try:
            pg = self._get_project_group(obj)
            return pg.main_advisor_score if pg else None
        except Exception:
            return None
    
    def get_main_committee_score(self, obj):
        try:
            pg = self._get_project_group(obj)
            return pg.main_committee_score if pg else None
        except Exception:
            return None
    
    def get_second_committee_score(self, obj):
        try:
            pg = self._get_project_group(obj)
            return pg.second_committee_score if pg else None
        except Exception:
            return None
    
    def get_third_committee_score(self, obj):
        try:
            pg = self._get_project_group(obj)
            return pg.third_committee_score if pg else None
        except Exception:
            return None
    
    def get_detailed_scores(self, obj):
        try:
            pg = self._get_project_group(obj)
            if pg:
                return {
                    'main_advisor': pg.main_advisor_score,
                    'main_committee': pg.main_committee_score,
                    'second_committee': pg.second_committee_score,
                    'third_committee': pg.third_committee_score,
                    'final_grade': pg.final_grade
                }
        except Exception:
            pass
        return {}
    
    def get_academic_year(self, obj):
        # Try to extract from project_id or use default
        try:
            # Project ID format might be like "2024-2025-P001"
            parts = obj.project_id.split('-')
            if len(parts) >= 2:
                return f"{parts[0]}-{parts[1]}"
        except:
            pass
        return '2024-2025'

    def get_student_names(self, obj):
        try:
            return obj.get_student_names()
        except:
            return []

    def get_student_count(self, obj):
        try:
            project_group = ProjectGroup.objects.get(project_id=obj.project_id)
            # Use ProjectStudent relationship
            from projects.models import ProjectStudent
            return ProjectStudent.objects.filter(project_group=project_group).count()
        except ProjectGroup.DoesNotExist:
            return 0
        except Exception as e:
            return 0

    def get_committee_member_names(self, obj):
        try:
            members = obj.get_committee_members()
            return {role: advisor.user.get_full_name() if hasattr(advisor, 'user') else str(advisor) for role, advisor in members.items()}
        except:
            return {}

    def get_milestone_count(self, obj):
        return obj.get_milestones().count()

    def get_pending_milestone_count(self, obj):
        return obj.get_pending_milestones().count()

    def get_is_scheduled(self, obj):
        return obj.is_scheduled()

    def get_final_score(self, obj):
        return obj.get_final_score()

    def get_recent_activity(self, obj):
        try:
            recent_logs = obj.get_recent_activity(days=7)
            return [
                {
                    'type': log.type,
                    'author': str(log.author_id),
                    'message': log.content if hasattr(log, 'content') else '',
                    'timestamp': log.created_at
                }
                for log in recent_logs[:5]  # Last 5 activities
            ]
        except:
            return []

    def create(self, validated_data):
        """Create project with auto-generated project ID"""
        # Generate project ID
        request = self.context.get('request')
        academic_year = validated_data.pop('academic_year', None) or (getattr(request.user, 'current_academic_year', '2024-2025') if request and request.user else '2024-2025')
        # Filter by project_id prefix instead of academic_year field
        last_project = Project.objects.filter(project_id__startswith=academic_year).order_by('-id').first()
        if last_project:
            try:
                # Extract sequence from project_id like "2024-2025-P004"
                seq = int(last_project.project_id.split('-P')[-1])
                sequence = seq + 1
            except:
                sequence = 1
        else:
            sequence = 1
        validated_data['project_id'] = generate_project_id(academic_year, sequence)
        
        return super().create(validated_data)


class ProjectCreateSerializer(serializers.ModelSerializer):
    """
    Project creation serializer with students
    """
    # Additional fields for ProjectGroup
    topic_lao = serializers.CharField(required=False, allow_blank=True)
    topic_eng = serializers.CharField(required=False, allow_blank=True)
    advisor_name = serializers.CharField(required=False, allow_blank=True)
    comment = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    student_ids = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False,
        help_text="List of student IDs to add to project"
    )
    template_id = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Milestone template ID to apply"
    )
    academic_year = serializers.CharField(required=False, default='2024-2025')
    
    class Meta:
        model = Project
        fields = [
            'title', 'description', 'status', 'advisor',
            'topic_lao', 'topic_eng', 'advisor_name', 'comment',
            'student_ids', 'template_id', 'academic_year'
        ]

    def validate_student_ids(self, value):
        """Validate student IDs"""
        if not value:
            return []
        
        # Check if students exist
        students = Student.objects.filter(student_id__in=value)
        if len(students) != len(value):
            missing = set(value) - set(students.values_list('student_id', flat=True))
            raise serializers.ValidationError(f"Students not found: {', '.join(missing)}")
        
        return value

    def validate_advisor(self, value):
        """Validate advisor"""
        if value:
            return value
        return None

    @transaction.atomic
    def create(self, validated_data):
        """Create project with students and milestones"""
        # Extract additional data
        student_ids = validated_data.pop('student_ids', [])
        template_id = validated_data.pop('template_id', None)
        topic_lao = validated_data.pop('topic_lao', '')
        topic_eng = validated_data.pop('topic_eng', validated_data.get('title', ''))
        advisor_name = validated_data.pop('advisor_name', '')
        comment = validated_data.pop('comment', '')
        academic_year = validated_data.pop('academic_year', '2024-2025')
        
        # Generate project ID
        from core.utils import generate_project_id
        try:
            last_project = Project.objects.filter(project_id__startswith=academic_year).order_by('-id').first()
            if last_project:
                # Extract sequence from project_id like "2024-2025-P004"
                try:
                    seq = int(last_project.project_id.split('-P')[-1])
                    sequence = seq + 1
                except:
                    sequence = 1
            else:
                sequence = 1
            project_id = generate_project_id(academic_year, sequence)
        except:
            # Fallback if generate_project_id doesn't work
            project_id = f"{academic_year}-P{Project.objects.count() + 1:03d}"
        
        # Set project_id
        validated_data['project_id'] = project_id
        
        # Create project
        project = Project.objects.create(**validated_data)
        
        # Get advisor name if not provided
        if not advisor_name and project.advisor:
            advisor_name = project.advisor.user.get_full_name()
        
        # Create project group
        project_group = ProjectGroup.objects.create(
            project_id=project_id,
            topic_lao=topic_lao or topic_eng,
            topic_eng=topic_eng or project.title,
            advisor_name=advisor_name or (project.advisor.user.get_full_name() if project.advisor else ''),
            comment=comment,
            status=project.status
        )
        
        # Add students to project group
        if student_ids:
            students = Student.objects.filter(student_id__in=student_ids)
            for idx, student in enumerate(students):
                ProjectStudent.objects.get_or_create(
                    project_group=project_group,
                    student=student.user,
                    defaults={'is_primary': idx == 0}
                )
        
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
    author_name = serializers.SerializerMethodField()
    author_role = serializers.SerializerMethodField()
    message = serializers.CharField(source='content', required=False)
    
    class Meta:
        model = LogEntry
        fields = [
            'id', 'type', 'author_id', 'author_name', 'author_role',
            'message', 'content', 'metadata',
            'created_at'
        ]
        read_only_fields = ['id', 'author_id', 'created_at']

    def get_author_name(self, obj):
        """Get author name from user"""
        try:
            from accounts.models import User
            user = User.objects.get(id=obj.author_id)
            return user.get_full_name()
        except:
            return str(obj.author_id)

    def get_author_role(self, obj):
        """Get author role from user"""
        try:
            from accounts.models import User
            user = User.objects.get(id=obj.author_id)
            return user.role
        except:
            return 'Unknown'

    def create(self, validated_data):
        """Create log entry with author information"""
        request = self.context.get('request')
        if request:
            validated_data['author_id'] = request.user.id
        # Extract content from message if provided
        if 'content' in validated_data and not validated_data['content']:
            validated_data['content'] = validated_data.pop('message', '')
        elif 'message' in validated_data:
            validated_data['content'] = validated_data.pop('message', '')
        
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
    Advanced project search serializer with comprehensive filtering options
    """
    # Text search
    query = serializers.CharField(required=False, help_text="Search in project ID, topics, advisor, student names")
    
    # Status filters
    status = serializers.CharField(required=False, help_text="Filter by project status")
    statuses = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        help_text="Filter by multiple statuses"
    )
    
    # Advisor filters
    advisor = serializers.CharField(required=False, help_text="Filter by advisor name")
    advisor_ids = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        help_text="Filter by multiple advisor IDs"
    )
    
    # Major filters
    major = serializers.CharField(required=False, help_text="Filter by major name")
    majors = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        help_text="Filter by multiple majors"
    )
    
    # Student filters
    student_id = serializers.CharField(required=False, help_text="Filter by student ID")
    student_name = serializers.CharField(required=False, help_text="Filter by student name")
    gender = serializers.CharField(required=False, help_text="Filter by student gender")
    
    # Date filters
    created_after = serializers.DateField(required=False, help_text="Filter projects created after this date")
    created_before = serializers.DateField(required=False, help_text="Filter projects created before this date")
    defense_after = serializers.DateField(required=False, help_text="Filter defenses scheduled after this date")
    defense_before = serializers.DateField(required=False, help_text="Filter defenses scheduled before this date")
    
    # Defense filters
    scheduled = serializers.BooleanField(required=False, help_text="Filter by scheduled status")
    has_defense_date = serializers.BooleanField(required=False, help_text="Filter projects with/without defense date")
    defense_room = serializers.CharField(required=False, help_text="Filter by defense room")
    
    # Score filters
    min_score = serializers.FloatField(required=False, min_value=0, max_value=100, help_text="Minimum final score")
    max_score = serializers.FloatField(required=False, min_value=0, max_value=100, help_text="Maximum final score")
    has_grade = serializers.BooleanField(required=False, help_text="Filter projects with/without final grade")
    
    # Milestone filters
    has_pending_milestones = serializers.BooleanField(required=False, help_text="Filter projects with pending milestones")
    milestone_count_min = serializers.IntegerField(required=False, min_value=0, help_text="Minimum milestone count")
    milestone_count_max = serializers.IntegerField(required=False, min_value=0, help_text="Maximum milestone count")
    
    # Committee filters
    has_committee = serializers.BooleanField(required=False, help_text="Filter projects with/without committee")
    committee_member = serializers.CharField(required=False, help_text="Filter by committee member name")
    
    # Academic year
    academic_year = serializers.CharField(required=False, help_text="Filter by academic year")
    
    # Similarity filter
    has_similarity_issues = serializers.BooleanField(required=False, help_text="Filter projects with similarity issues")
    
    # Sorting and pagination
    ordering = serializers.CharField(required=False, help_text="Order by field (prefix with - for descending)")
    page = serializers.IntegerField(required=False, min_value=1, default=1)
    page_size = serializers.IntegerField(required=False, min_value=1, max_value=100, default=20)