"""
Project management views
"""

from rest_framework import viewsets, status, filters, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Avg
from django.db import transaction
from django.utils import timezone

from .models import Project, ProjectGroup
from students.models import Student
from advisors.models import Advisor
from milestones.models import Milestone, MilestoneTemplate
from projects.models import LogEntry
from core.permissions import (
    CanManageProject, CanViewProject, IsProjectParticipant,
    AcademicYearPermission, IsAdvisorOrAdmin
)
from .serializers import (
    ProjectSerializer, ProjectCreateSerializer, ProjectUpdateSerializer,
    ProjectStatusUpdateSerializer, ProjectCommitteeUpdateSerializer,
    ProjectDefenseScheduleSerializer, ProjectScoringSerializer,
    ProjectTransferSerializer, ProjectLogEntrySerializer,
    ProjectStatisticsSerializer, BulkProjectUpdateSerializer,
    ProjectSearchSerializer
)


class ProjectViewSet(viewsets.ModelViewSet):
    """
    Project management viewset
    """
    queryset = Project.objects.select_related(
        'advisor'
    ).prefetch_related(
        'milestones', 'log_entries'
    )
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]  # Temporarily simplified to debug 500 error
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'advisor']  # Removed 'academic_year' - not a model field
    search_fields = ['project_id', 'topic_lao', 'topic_eng', 'advisor_name']
    ordering_fields = ['project_id', 'topic_eng', 'created_at', 'defense_date']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return ProjectCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ProjectUpdateSerializer
        return ProjectSerializer

    def get_queryset(self):
        """Filter queryset based on user permissions"""
        queryset = super().get_queryset()
        user = self.request.user
        
        # Admins can see all projects
        if user.is_admin():
            pass  # No filtering
        # Students can only see their own projects
        elif user.is_student():
            try:
                if hasattr(user, 'student_profile') and user.student_profile:
                    student = user.student_profile
                    # Filter by ProjectStudent relationship
                    from projects.models import ProjectStudent
                    project_students = ProjectStudent.objects.filter(student=user)
                    project_groups = [ps.project_group for ps in project_students]
                    project_ids = [pg.project_id for pg in project_groups]
                    queryset = queryset.filter(project_id__in=project_ids)
                else:
                    queryset = queryset.none()  # No projects if no student profile
            except Exception as e:
                queryset = queryset.none()  # No projects if error
        
        # Advisors can see their supervised projects and committee projects
        elif user.is_advisor():
            try:
                if hasattr(user, 'advisor_profile') and user.advisor_profile:
                    advisor = user.advisor_profile
                    queryset = queryset.filter(
                        Q(advisor=advisor) |
                        Q(main_committee=advisor) |
                        Q(second_committee=advisor) |
                        Q(third_committee=advisor)
                    )
                else:
                    queryset = queryset.none()  # No projects if no advisor profile
            except Exception as e:
                queryset = queryset.none()  # No projects if error
        
        # Department admins can see projects in their departments
        elif user.is_department_admin():
            try:
                if hasattr(user, 'advisor_profile') and user.advisor_profile:
                    advisor = user.advisor_profile
                    managed_majors = advisor.get_managed_majors() if hasattr(advisor, 'get_managed_majors') else []
                    if managed_majors:
                        queryset = queryset.filter(
                            projectgroup__students__major__in=managed_majors
                        ).distinct()
            except Exception as e:
                pass  # Show all if can't determine managed majors
        
        # Filter by academic year if specified (extract from project_id)
        academic_year = self.request.query_params.get('academic_year')
        if academic_year:
            # Project model doesn't have academic_year field, filter by project_id prefix
            queryset = queryset.filter(project_id__startswith=academic_year)
        
        return queryset

    def perform_create(self, serializer):
        """Set academic year and create project group"""
        academic_year = self.request.data.get('academic_year') or getattr(self.request.user, 'current_academic_year', '2024-2025')
        serializer.save(academic_year=academic_year)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update project status"""
        project = self.get_object()
        serializer = ProjectStatusUpdateSerializer(data=request.data)
        
        if serializer.is_valid():
            new_status = serializer.validated_data['status']
            comment = serializer.validated_data.get('comment', '')
            template_id = serializer.validated_data.get('template_id')
            
            # Update project status
            project.status = new_status
            project.save()
            
            # Create log entry
            LogEntry.objects.create(
                project=project,
                type='event',
                author_id=request.user.id,
                author_name=request.user.get_full_name(),
                author_role=request.user.role,
                message=f"Project status changed to {new_status}. {comment}",
                academic_year=project.academic_year
            )
            
            # Apply milestone template if provided and status is approved
            if new_status == 'Approved' and template_id:
                try:
                    template = MilestoneTemplate.objects.get(id=template_id)
                    self._create_milestones_from_template(project, template)
                except MilestoneTemplate.DoesNotExist:
                    pass
            
            return Response({
                'message': f'Project status updated to {new_status}'
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def update_committee(self, request, pk=None):
        """Update project committee"""
        project = self.get_object()
        serializer = ProjectCommitteeUpdateSerializer(data=request.data)
        
        if serializer.is_valid():
            committee_type = serializer.validated_data['committee_type']
            advisor_id = serializer.validated_data.get('advisor_id')
            
            # Update committee member
            field_map = {
                'main': 'main_committee',
                'second': 'second_committee',
                'third': 'third_committee'
            }
            
            setattr(project, field_map[committee_type], 
                   Advisor.objects.get(id=advisor_id) if advisor_id else None)
            project.save()
            
            # Create log entry
            advisor_name = Advisor.objects.get(id=advisor_id).name if advisor_id else 'None'
            LogEntry.objects.create(
                project=project,
                type='event',
                author_id=request.user.id,
                author_name=request.user.get_full_name(),
                author_role=request.user.role,
                message=f"{committee_type.title()} committee member set to {advisor_name}",
                academic_year=project.academic_year
            )
            
            return Response({
                'message': f'{committee_type.title()} committee member updated'
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def schedule_defense(self, request, pk=None):
        """Schedule project defense"""
        project = self.get_object()
        serializer = ProjectDefenseScheduleSerializer(data=request.data)
        
        if serializer.is_valid():
            project.defense_date = serializer.validated_data.get('defense_date')
            project.defense_time = serializer.validated_data.get('defense_time')
            project.defense_room = serializer.validated_data.get('defense_room')
            project.save()
            
            # Create log entry
            LogEntry.objects.create(
                project=project,
                type='event',
                author_id=request.user.id,
                author_name=request.user.get_full_name(),
                author_role=request.user.role,
                message=f"Defense scheduled for {project.defense_date} at {project.defense_time} in {project.defense_room}",
                academic_year=project.academic_year
            )
            
            return Response({
                'message': 'Defense scheduled successfully'
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def submit_score(self, request, pk=None):
        """Submit project score"""
        project = self.get_object()
        serializer = ProjectScoringSerializer(data=request.data)
        
        if serializer.is_valid():
            evaluator_id = serializer.validated_data['evaluator_id']
            scores = serializer.validated_data['scores']
            
            # Update detailed scores
            if not project.detailed_scores:
                project.detailed_scores = {}
            
            project.detailed_scores[str(evaluator_id)] = scores
            project.save()
            
            # Create log entry
            LogEntry.objects.create(
                project=project,
                type='event',
                author_id=request.user.id,
                author_name=request.user.get_full_name(),
                author_role=request.user.role,
                message=f"Scores submitted by evaluator {evaluator_id}",
                academic_year=project.academic_year
            )
            
            return Response({
                'message': 'Scores submitted successfully'
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def transfer(self, request, pk=None):
        """Transfer project to another advisor"""
        project = self.get_object()
        serializer = ProjectTransferSerializer(data=request.data)
        
        if serializer.is_valid():
            new_advisor_id = serializer.validated_data['new_advisor_id']
            comment = serializer.validated_data['comment']
            
            old_advisor_name = project.advisor_name
            new_advisor = Advisor.objects.get(id=new_advisor_id)
            
            # Update project advisor
            project.advisor = new_advisor
            project.advisor_name = new_advisor.name
            project.save()
            
            # Create log entry
            LogEntry.objects.create(
                project=project,
                type='event',
                author_id=request.user.id,
                author_name=request.user.get_full_name(),
                author_role=request.user.role,
                message=f"Project transferred from {old_advisor_name} to {new_advisor.name}. Reason: {comment}",
                academic_year=project.academic_year
            )
            
            return Response({
                'message': f'Project transferred to {new_advisor.name}'
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def milestones(self, request, pk=None):
        """Get project milestones"""
        project = self.get_object()
        milestones = project.get_milestones()
        
        return Response([
            {
                'id': milestone.id,
                'name': milestone.name,
                'status': milestone.status,
                'due_date': milestone.due_date,
                'submitted_date': milestone.submitted_date,
                'feedback': milestone.feedback
            }
            for milestone in milestones
        ])

    @action(detail=True, methods=['get'])
    def log_entries(self, request, pk=None):
        """Get project log entries"""
        project = self.get_object()
        log_entries = project.get_log_entries()
        
        return Response([
            {
                'id': str(entry.id),
                'type': entry.type,
                'author_name': entry.author_name,
                'author_role': entry.author_role,
                'message': entry.message,
                'file_name': entry.file_name,
                'created_at': entry.created_at
            }
            for entry in log_entries
        ])

    @action(detail=True, methods=['post'])
    def add_log_entry(self, request, pk=None):
        """Add log entry to project"""
        project = self.get_object()
        serializer = ProjectLogEntrySerializer(data=request.data)
        
        if serializer.is_valid():
            log_entry = serializer.save(
                project=project,
                academic_year=project.academic_year
            )
            
            return Response({
                'message': 'Log entry added successfully',
                'log_entry': {
                    'id': str(log_entry.id),
                    'type': log_entry.type,
                    'author_name': log_entry.author_name,
                    'message': log_entry.message,
                    'created_at': log_entry.created_at
                }
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """Bulk update projects"""
        serializer = BulkProjectUpdateSerializer(data=request.data)
        if serializer.is_valid():
            project_ids = serializer.validated_data['project_ids']
            updates = serializer.validated_data['updates']
            
            updated_count = Project.objects.filter(
                project_id__in=project_ids
            ).update(**updates)
            
            return Response({
                'message': f'{updated_count} projects updated successfully'
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get project statistics"""
        queryset = self.get_queryset()
        
        # Calculate statistics
        total_projects = queryset.count()
        pending_projects = queryset.filter(status='Pending').count()
        approved_projects = queryset.filter(status='Approved').count()
        rejected_projects = queryset.filter(status='Rejected').count()
        
        scheduled_defenses = queryset.filter(
            defense_date__isnull=False,
            defense_time__isnull=False,
            defense_room__isnull=False
        ).count()
        unscheduled_defenses = total_projects - scheduled_defenses
        
        # Projects by status
        projects_by_status = dict(
            queryset.values('status').annotate(count=Count('id')).values_list('status', 'count')
        )
        
        # Projects by advisor
        projects_by_advisor = dict(
            queryset.values('advisor_name').annotate(count=Count('id')).values_list('advisor_name', 'count')
        )
        
        # Projects by major
        projects_by_major = dict(
            queryset.values('projectgroup__students__major__name')
            .annotate(count=Count('id'))
            .values_list('projectgroup__students__major__name', 'count')
        )
        
        # Average milestone completion
        milestone_completion = queryset.aggregate(
            avg_completion=Avg('milestones__status')
        )['avg_completion'] or 0
        
        # Projects needing attention (overdue milestones)
        projects_needing_attention = queryset.filter(
            milestones__due_date__lt=timezone.now().date(),
            milestones__status='Pending'
        ).distinct().count()
        
        stats = {
            'total_projects': total_projects,
            'pending_projects': pending_projects,
            'approved_projects': approved_projects,
            'rejected_projects': rejected_projects,
            'scheduled_defenses': scheduled_defenses,
            'unscheduled_defenses': unscheduled_defenses,
            'projects_by_status': projects_by_status,
            'projects_by_advisor': projects_by_advisor,
            'projects_by_major': projects_by_major,
            'average_milestone_completion': round(milestone_completion, 2),
            'projects_needing_attention': projects_needing_attention,
        }
        
        serializer = ProjectStatisticsSerializer(stats)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search projects with advanced filters"""
        serializer = ProjectSearchSerializer(data=request.query_params)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        queryset = self.get_queryset()
        
        # Apply search filters
        if data.get('query'):
            queryset = queryset.filter(
                Q(project_id__icontains=data['query']) |
                Q(topic_lao__icontains=data['query']) |
                Q(topic_eng__icontains=data['query']) |
                Q(advisor_name__icontains=data['query'])
            )
        
        if data.get('status'):
            queryset = queryset.filter(status=data['status'])
        
        if data.get('advisor'):
            queryset = queryset.filter(advisor_name=data['advisor'])
        
        if data.get('major'):
            queryset = queryset.filter(projectgroup__students__major__name=data['major'])
        
        if data.get('scheduled') is not None:
            if data['scheduled']:
                queryset = queryset.filter(
                    defense_date__isnull=False,
                    defense_time__isnull=False,
                    defense_room__isnull=False
                )
            else:
                queryset = queryset.filter(
                    Q(defense_date__isnull=True) |
                    Q(defense_time__isnull=True) |
                    Q(defense_room__isnull=True)
                )
        
        if data.get('academic_year'):
            queryset = queryset.filter(academic_year=data['academic_year'])
        
        # Apply ordering
        if data.get('ordering'):
            queryset = queryset.order_by(data['ordering'])
        
        # Apply pagination
        page = data.get('page', 1)
        page_size = data.get('page_size', 20)
        start = (page - 1) * page_size
        end = start + page_size
        
        projects = queryset[start:end]
        total_count = queryset.count()
        
        return Response({
            'results': ProjectSerializer(projects, many=True).data,
            'count': total_count,
            'page': page,
            'page_size': page_size,
            'total_pages': (total_count + page_size - 1) // page_size
        })

    def _create_milestones_from_template(self, project, template):
        """Create milestones from template"""
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
        
        return milestones