"""
Project-specific utility functions and helper classes.
"""

import logging
from typing import Dict, List, Optional, Any
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Q, Count, Avg
from datetime import timedelta

User = get_user_model()
logger = logging.getLogger(__name__)


class ProjectUtils:
    """Utility class for project operations."""
    
    @staticmethod
    def create_project(
        name: str,
        description: str,
        advisor: User,
        academic_year: str,
        start_date: str = None,
        end_date: str = None,
        status: str = 'draft'
    ) -> Optional[Any]:
        """Create a new project."""
        try:
            from .models import ProjectGroup
            
            project = ProjectGroup.objects.create(
                name=name,
                description=description,
                advisor=advisor,
                academic_year=academic_year,
                start_date=start_date,
                end_date=end_date,
                status=status
            )
            logger.info(f"Project created: {project.name}")
            return project
        except Exception as e:
            logger.error(f"Error creating project: {e}")
            return None
    
    @staticmethod
    def get_project_by_id(project_id: int) -> Optional[Any]:
        """Get project by ID."""
        try:
            from .models import ProjectGroup
            return ProjectGroup.objects.get(id=project_id)
        except ProjectGroup.DoesNotExist:
            return None
    
    @staticmethod
    def search_projects(
        query: str = None,
        status: str = None,
        academic_year: str = None,
        advisor: User = None
    ) -> List[Any]:
        """Search projects with filters."""
        try:
            from .models import ProjectGroup
            
            projects = ProjectGroup.objects.all()
            
            if query:
                projects = projects.filter(
                    Q(name__icontains=query) |
                    Q(description__icontains=query)
                )
            
            if status:
                projects = projects.filter(status=status)
            
            if academic_year:
                projects = projects.filter(academic_year=academic_year)
            
            if advisor:
                projects = projects.filter(advisor=advisor)
            
            return projects
        except Exception as e:
            logger.error(f"Error searching projects: {e}")
            return []
    
    @staticmethod
    def get_projects_by_advisor(advisor: User) -> List[Any]:
        """Get projects by advisor."""
        try:
            from .models import ProjectGroup
            return ProjectGroup.objects.filter(advisor=advisor)
        except Exception as e:
            logger.error(f"Error getting projects by advisor: {e}")
            return []
    
    @staticmethod
    def get_projects_by_status(status: str) -> List[Any]:
        """Get projects by status."""
        try:
            from .models import ProjectGroup
            return ProjectGroup.objects.filter(status=status)
        except Exception as e:
            logger.error(f"Error getting projects by status: {e}")
            return []
    
    @staticmethod
    def update_project_status(project: Any, new_status: str, changed_by: User, reason: str = '') -> bool:
        """Update project status."""
        try:
            from .models import StatusHistory
            
            # Create status history
            StatusHistory.objects.create(
                project_group=project,
                old_status=project.status,
                new_status=new_status,
                changed_by=changed_by,
                change_reason=reason
            )
            
            # Update project status
            project.status = new_status
            project.save()
            
            logger.info(f"Project status updated: {project.name} -> {new_status}")
            return True
        except Exception as e:
            logger.error(f"Error updating project status: {e}")
            return False
    
    @staticmethod
    def get_project_progress(project: Any) -> Dict[str, Any]:
        """Get project progress information."""
        try:
            # Calculate progress based on milestones
            from .models import Milestone
            
            milestones = Milestone.objects.filter(project_group=project)
            total_milestones = milestones.count()
            completed_milestones = milestones.filter(status='completed').count()
            
            progress_percentage = 0
            if total_milestones > 0:
                progress_percentage = (completed_milestones / total_milestones) * 100
            
            # Calculate days remaining
            days_remaining = 0
            if project.end_date:
                delta = project.end_date - timezone.now().date()
                days_remaining = max(0, delta.days)
            
            return {
                'progress_percentage': round(progress_percentage, 2),
                'total_milestones': total_milestones,
                'completed_milestones': completed_milestones,
                'days_remaining': days_remaining,
                'is_overdue': days_remaining < 0
            }
        except Exception as e:
            logger.error(f"Error getting project progress: {e}")
            return {}


class ProjectStudentUtils:
    """Utility class for project student operations."""
    
    @staticmethod
    def add_student_to_project(project: Any, student: User, is_primary: bool = False) -> bool:
        """Add student to project."""
        try:
            from .models import ProjectStudent
            
            # Check if student is already in project
            if ProjectStudent.objects.filter(project_group=project, student=student).exists():
                return False
            
            ProjectStudent.objects.create(
                project_group=project,
                student=student,
                is_primary=is_primary
            )
            
            logger.info(f"Student {student.username} added to project {project.name}")
            return True
        except Exception as e:
            logger.error(f"Error adding student to project: {e}")
            return False
    
    @staticmethod
    def remove_student_from_project(project: Any, student: User) -> bool:
        """Remove student from project."""
        try:
            from .models import ProjectStudent
            
            project_student = ProjectStudent.objects.get(
                project_group=project,
                student=student
            )
            project_student.delete()
            
            logger.info(f"Student {student.username} removed from project {project.name}")
            return True
        except ProjectStudent.DoesNotExist:
            return False
        except Exception as e:
            logger.error(f"Error removing student from project: {e}")
            return False
    
    @staticmethod
    def get_project_students(project: Any) -> List[Any]:
        """Get all students in project."""
        try:
            from .models import ProjectStudent
            return ProjectStudent.objects.filter(project_group=project)
        except Exception as e:
            logger.error(f"Error getting project students: {e}")
            return []
    
    @staticmethod
    def get_student_projects(student: User) -> List[Any]:
        """Get all projects for student."""
        try:
            from .models import ProjectStudent
            project_students = ProjectStudent.objects.filter(student=student)
            return [ps.project_group for ps in project_students]
        except Exception as e:
            logger.error(f"Error getting student projects: {e}")
            return []


class ProjectFileUtils:
    """Utility class for project file operations."""
    
    @staticmethod
    def upload_project_file(
        project: Any,
        file,
        file_type: str,
        description: str = '',
        uploaded_by: User = None
    ) -> Optional[Any]:
        """Upload file to project."""
        try:
            from .models import ProjectFile
            
            project_file = ProjectFile.objects.create(
                project_group=project,
                file=file,
                file_type=file_type,
                description=description,
                uploaded_by=uploaded_by
            )
            
            logger.info(f"File uploaded to project {project.name}: {file.name}")
            return project_file
        except Exception as e:
            logger.error(f"Error uploading project file: {e}")
            return None
    
    @staticmethod
    def get_project_files(project: Any) -> List[Any]:
        """Get all files for project."""
        try:
            from .models import ProjectFile
            return ProjectFile.objects.filter(project_group=project).order_by('-uploaded_at')
        except Exception as e:
            logger.error(f"Error getting project files: {e}")
            return []
    
    @staticmethod
    def delete_project_file(file_id: int) -> bool:
        """Delete project file."""
        try:
            from .models import ProjectFile
            
            project_file = ProjectFile.objects.get(id=file_id)
            project_file.delete()
            
            logger.info(f"Project file deleted: {file_id}")
            return True
        except ProjectFile.DoesNotExist:
            return False
        except Exception as e:
            logger.error(f"Error deleting project file: {e}")
            return False


class ProjectCommunicationUtils:
    """Utility class for project communication operations."""
    
    @staticmethod
    def log_communication(
        project: Any,
        sender: User,
        recipient: User,
        communication_type: str,
        subject: str,
        message: str
    ) -> Optional[Any]:
        """Log project communication."""
        try:
            from .models import CommunicationLog
            
            communication = CommunicationLog.objects.create(
                project_group=project,
                sender=sender,
                recipient=recipient,
                communication_type=communication_type,
                subject=subject,
                message=message
            )
            
            logger.info(f"Communication logged for project {project.name}")
            return communication
        except Exception as e:
            logger.error(f"Error logging communication: {e}")
            return None
    
    @staticmethod
    def get_project_communications(project: Any) -> List[Any]:
        """Get all communications for project."""
        try:
            from .models import CommunicationLog
            return CommunicationLog.objects.filter(project_group=project).order_by('-sent_at')
        except Exception as e:
            logger.error(f"Error getting project communications: {e}")
            return []
    
    @staticmethod
    def get_user_communications(user: User) -> List[Any]:
        """Get all communications for user."""
        try:
            from .models import CommunicationLog
            return CommunicationLog.objects.filter(
                Q(sender=user) | Q(recipient=user)
            ).order_by('-sent_at')
        except Exception as e:
            logger.error(f"Error getting user communications: {e}")
            return []


class ProjectHealthUtils:
    """Utility class for project health operations."""
    
    @staticmethod
    def perform_health_check(project: Any) -> Dict[str, Any]:
        """Perform project health check."""
        try:
            from .models import ProjectHealthCheck
            
            # Calculate health metrics
            progress = ProjectUtils.get_project_progress(project)
            issues = []
            recommendations = []
            
            # Check for issues
            if progress['is_overdue']:
                issues.append("Project is overdue")
                recommendations.append("Review project timeline and adjust deadlines")
            
            if progress['progress_percentage'] < 25:
                issues.append("Low progress percentage")
                recommendations.append("Increase project activity and milestone completion")
            
            # Check for missing students
            students = ProjectStudentUtils.get_project_students(project)
            if len(students) == 0:
                issues.append("No students assigned to project")
                recommendations.append("Assign students to the project")
            
            # Determine health status
            if len(issues) == 0:
                health_status = "healthy"
            elif len(issues) <= 2:
                health_status = "warning"
            else:
                health_status = "critical"
            
            # Create health check record
            health_check = ProjectHealthCheck.objects.create(
                project_group=project,
                health_status=health_status,
                summary=f"Found {len(issues)} issues",
                issues=issues,
                recommendations=recommendations,
                analyzed_by_ai=True
            )
            
            return {
                'health_status': health_status,
                'issues': issues,
                'recommendations': recommendations,
                'progress': progress
            }
        except Exception as e:
            logger.error(f"Error performing health check: {e}")
            return {}


class ProjectStatisticsUtils:
    """Utility class for project statistics."""
    
    @staticmethod
    def get_project_statistics() -> Dict[str, Any]:
        """Get project statistics."""
        try:
            from .models import ProjectGroup
            
            total_projects = ProjectGroup.objects.count()
            
            # Projects by status
            projects_by_status = {}
            for status in ['draft', 'active', 'in_progress', 'completed', 'archived']:
                projects_by_status[status] = ProjectGroup.objects.filter(status=status).count()
            
            # Projects by academic year
            projects_by_academic_year = {}
            academic_years = ProjectGroup.objects.values_list('academic_year', flat=True).distinct()
            for year in academic_years:
                projects_by_academic_year[year] = ProjectGroup.objects.filter(academic_year=year).count()
            
            # Average students per project
            from .models import ProjectStudent
            avg_students_per_project = ProjectStudent.objects.values('project_group').annotate(
                num_students=Count('student')
            ).aggregate(avg=Avg('num_students'))['avg'] or 0
            
            # Completion rate
            completed_projects = ProjectGroup.objects.filter(status='completed').count()
            completion_rate = (completed_projects / total_projects * 100) if total_projects > 0 else 0
            
            # Recent projects (last 30 days)
            recent_projects = ProjectGroup.objects.filter(
                created_at__gte=timezone.now() - timedelta(days=30)
            ).count()
            
            return {
                'total_projects': total_projects,
                'projects_by_status': projects_by_status,
                'projects_by_academic_year': projects_by_academic_year,
                'average_students_per_project': round(avg_students_per_project, 2),
                'completion_rate': round(completion_rate, 2),
                'recent_projects': recent_projects
            }
        except Exception as e:
            logger.error(f"Error getting project statistics: {e}")
            return {}
    
    @staticmethod
    def get_advisor_project_statistics(advisor: User) -> Dict[str, Any]:
        """Get project statistics for advisor."""
        try:
            from .models import ProjectGroup
            
            advisor_projects = ProjectGroup.objects.filter(advisor=advisor)
            
            return {
                'total_projects': advisor_projects.count(),
                'active_projects': advisor_projects.filter(status='active').count(),
                'completed_projects': advisor_projects.filter(status='completed').count(),
                'overdue_projects': advisor_projects.filter(
                    end_date__lt=timezone.now().date(),
                    status__in=['active', 'in_progress']
                ).count()
            }
        except Exception as e:
            logger.error(f"Error getting advisor project statistics: {e}")
            return {}
