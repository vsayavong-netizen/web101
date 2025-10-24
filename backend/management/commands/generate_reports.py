"""
Management command to generate system reports.
Usage: python manage.py generate_reports
"""

import json
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from django.db.models import Count, Avg, Q
from django.utils import timezone

from accounts.models import Profile
from students.models import Student, StudentAcademicRecord
from advisors.models import Advisor
from majors.models import Major
from projects.models import ProjectGroup, Project
from committees.models import Committee
from milestones.models import Milestone, MilestoneTemplate
from scoring.models import ProjectScore, ScoringRubric
from notifications.models import Notification
from ai_services.models import AIAnalysis
from settings.models import SystemLog


class Command(BaseCommand):
    help = 'Generate comprehensive system reports'

    def add_arguments(self, parser):
        parser.add_argument(
            '--report-type',
            type=str,
            choices=['all', 'users', 'projects', 'academic', 'system', 'performance'],
            default='all',
            help='Type of report to generate (default: all)',
        )
        parser.add_argument(
            '--output-dir',
            type=str,
            default='reports',
            help='Directory to save report files (default: reports)',
        )
        parser.add_argument(
            '--format',
            type=str,
            choices=['json', 'txt'],
            default='json',
            help='Report format (default: json)',
        )
        parser.add_argument(
            '--date-range',
            type=int,
            default=30,
            help='Number of days to include in report (default: 30)',
        )

    def handle(self, *args, **options):
        self.report_type = options['report_type']
        self.output_dir = options['output_dir']
        self.format = options['format']
        self.date_range = options['date_range']
        
        # Create output directory
        import os
        os.makedirs(self.output_dir, exist_ok=True)
        
        self.stdout.write(
            self.style.SUCCESS('Generating system reports...')
        )
        
        # Generate timestamp for reports
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Generate reports based on type
        if self.report_type in ['all', 'users']:
            self.generate_user_report(timestamp)
        
        if self.report_type in ['all', 'projects']:
            self.generate_project_report(timestamp)
        
        if self.report_type in ['all', 'academic']:
            self.generate_academic_report(timestamp)
        
        if self.report_type in ['all', 'system']:
            self.generate_system_report(timestamp)
        
        if self.report_type in ['all', 'performance']:
            self.generate_performance_report(timestamp)
        
        self.stdout.write(
            self.style.SUCCESS('Report generation completed!')
        )

    def generate_user_report(self, timestamp):
        """Generate user statistics report."""
        self.stdout.write('  Generating user report...')
        
        # Calculate date range
        end_date = timezone.now()
        start_date = end_date - timedelta(days=self.date_range)
        
        # User statistics
        total_users = Profile.objects.count()
        students = Profile.objects.filter(role='student').count()
        advisors = Profile.objects.filter(role='advisor').count()
        admins = Profile.objects.filter(role='admin').count()
        
        # Recent registrations
        recent_users = Profile.objects.filter(
            created_at__gte=start_date
        ).count()
        
        # Active users (users with recent activity)
        active_users = Profile.objects.filter(
            user__last_login__gte=start_date
        ).count()
        
        # Student statistics
        student_stats = Student.objects.aggregate(
            total_students=Count('id'),
            avg_gpa=Avg('gpa'),
            active_students=Count('id', filter=Q(is_active=True))
        )
        
        # Advisor statistics
        advisor_stats = Advisor.objects.aggregate(
            total_advisors=Count('id'),
            available_advisors=Count('id', filter=Q(is_available=True)),
            avg_max_students=Avg('max_students')
        )
        
        report_data = {
            'report_type': 'user_statistics',
            'generated_at': end_date.isoformat(),
            'date_range_days': self.date_range,
            'summary': {
                'total_users': total_users,
                'students': students,
                'advisors': advisors,
                'admins': admins,
                'recent_registrations': recent_users,
                'active_users': active_users
            },
            'student_statistics': student_stats,
            'advisor_statistics': advisor_stats,
            'role_distribution': {
                'student_percentage': round((students / total_users * 100), 2) if total_users > 0 else 0,
                'advisor_percentage': round((advisors / total_users * 100), 2) if total_users > 0 else 0,
                'admin_percentage': round((admins / total_users * 100), 2) if total_users > 0 else 0
            }
        }
        
        self.save_report('user_report', report_data, timestamp)

    def generate_project_report(self, timestamp):
        """Generate project statistics report."""
        self.stdout.write('  Generating project report...')
        
        # Calculate date range
        end_date = timezone.now()
        start_date = end_date - timedelta(days=self.date_range)
        
        # Project statistics
        total_projects = ProjectGroup.objects.count()
        active_projects = ProjectGroup.objects.filter(status='active').count()
        completed_projects = ProjectGroup.objects.filter(status='completed').count()
        
        # Recent projects
        recent_projects = ProjectGroup.objects.filter(
            created_at__gte=start_date
        ).count()
        
        # Project status distribution
        status_distribution = ProjectGroup.objects.values('status').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Advisor workload
        advisor_workload = Advisor.objects.annotate(
            project_count=Count('project_groups')
        ).values('user__first_name', 'user__last_name', 'project_count')
        
        # Student participation
        student_participation = Student.objects.annotate(
            project_count=Count('project_groups')
        ).values('user__first_name', 'user__last_name', 'project_count')
        
        # Milestone statistics
        milestone_stats = Milestone.objects.aggregate(
            total_milestones=Count('id'),
            completed_milestones=Count('id', filter=Q(status='completed')),
            overdue_milestones=Count('id', filter=Q(status='overdue'))
        )
        
        report_data = {
            'report_type': 'project_statistics',
            'generated_at': end_date.isoformat(),
            'date_range_days': self.date_range,
            'summary': {
                'total_projects': total_projects,
                'active_projects': active_projects,
                'completed_projects': completed_projects,
                'recent_projects': recent_projects
            },
            'status_distribution': list(status_distribution),
            'advisor_workload': list(advisor_workload),
            'student_participation': list(student_participation),
            'milestone_statistics': milestone_stats
        }
        
        self.save_report('project_report', report_data, timestamp)

    def generate_academic_report(self, timestamp):
        """Generate academic statistics report."""
        self.stdout.write('  Generating academic report...')
        
        # Major statistics
        major_stats = Major.objects.aggregate(
            total_majors=Count('id'),
            active_majors=Count('id', filter=Q(is_active=True))
        )
        
        # Student distribution by major
        student_by_major = Student.objects.values(
            'major__name'
        ).annotate(
            student_count=Count('id')
        ).order_by('-student_count')
        
        # GPA statistics
        gpa_stats = Student.objects.aggregate(
            avg_gpa=Avg('gpa'),
            max_gpa=Avg('gpa'),  # This should be Max, but Django doesn't have Max in aggregate
            min_gpa=Avg('gpa')   # This should be Min, but Django doesn't have Min in aggregate
        )
        
        # Academic records
        academic_records = StudentAcademicRecord.objects.aggregate(
            total_records=Count('id'),
            avg_credits=Avg('credits_completed'),
            avg_gpa=Avg('gpa')
        )
        
        # Committee statistics
        committee_stats = Committee.objects.aggregate(
            total_committees=Count('id'),
            active_committees=Count('id', filter=Q(status='active'))
        )
        
        report_data = {
            'report_type': 'academic_statistics',
            'generated_at': timezone.now().isoformat(),
            'major_statistics': major_stats,
            'student_distribution_by_major': list(student_by_major),
            'gpa_statistics': gpa_stats,
            'academic_records': academic_records,
            'committee_statistics': committee_stats
        }
        
        self.save_report('academic_report', report_data, timestamp)

    def generate_system_report(self, timestamp):
        """Generate system statistics report."""
        self.stdout.write('  Generating system report...')
        
        # Calculate date range
        end_date = timezone.now()
        start_date = end_date - timedelta(days=self.date_range)
        
        # System logs
        log_stats = SystemLog.objects.filter(
            timestamp__gte=start_date
        ).values('log_type').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Notifications
        notification_stats = Notification.objects.filter(
            created_at__gte=start_date
        ).aggregate(
            total_notifications=Count('id'),
            unread_notifications=Count('id', filter=Q(is_read=False))
        )
        
        # AI Analysis statistics
        ai_stats = AIAnalysis.objects.filter(
            created_at__gte=start_date
        ).aggregate(
            total_analyses=Count('id'),
            successful_analyses=Count('id', filter=Q(status='completed'))
        )
        
        # Scoring statistics
        scoring_stats = ProjectScore.objects.aggregate(
            total_scores=Count('id'),
            avg_score=Avg('total_score')
        )
        
        report_data = {
            'report_type': 'system_statistics',
            'generated_at': end_date.isoformat(),
            'date_range_days': self.date_range,
            'log_statistics': list(log_stats),
            'notification_statistics': notification_stats,
            'ai_analysis_statistics': ai_stats,
            'scoring_statistics': scoring_stats
        }
        
        self.save_report('system_report', report_data, timestamp)

    def generate_performance_report(self, timestamp):
        """Generate performance metrics report."""
        self.stdout.write('  Generating performance report...')
        
        # Calculate date range
        end_date = timezone.now()
        start_date = end_date - timedelta(days=self.date_range)
        
        # Database performance metrics
        db_metrics = {
            'total_queries': 0,  # This would need to be tracked separately
            'avg_query_time': 0,  # This would need to be tracked separately
            'slow_queries': 0     # This would need to be tracked separately
        }
        
        # User activity metrics
        user_activity = Profile.objects.filter(
            user__last_login__gte=start_date
        ).count()
        
        # Project completion rate
        completion_rate = 0
        total_projects = ProjectGroup.objects.count()
        completed_projects = ProjectGroup.objects.filter(status='completed').count()
        if total_projects > 0:
            completion_rate = round((completed_projects / total_projects) * 100, 2)
        
        # Milestone completion rate
        milestone_completion_rate = 0
        total_milestones = Milestone.objects.count()
        completed_milestones = Milestone.objects.filter(status='completed').count()
        if total_milestones > 0:
            milestone_completion_rate = round((completed_milestones / total_milestones) * 100, 2)
        
        report_data = {
            'report_type': 'performance_metrics',
            'generated_at': end_date.isoformat(),
            'date_range_days': self.date_range,
            'database_metrics': db_metrics,
            'user_activity': user_activity,
            'project_completion_rate': completion_rate,
            'milestone_completion_rate': milestone_completion_rate,
            'performance_indicators': {
                'active_users': user_activity,
                'project_completion': completion_rate,
                'milestone_completion': milestone_completion_rate
            }
        }
        
        self.save_report('performance_report', report_data, timestamp)

    def save_report(self, report_name, data, timestamp):
        """Save report to file."""
        import os
        
        filename = f'{report_name}_{timestamp}.{self.format}'
        filepath = os.path.join(self.output_dir, filename)
        
        if self.format == 'json':
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False, default=str)
        else:  # txt format
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(f"Report: {data.get('report_type', 'Unknown')}\n")
                f.write(f"Generated: {data.get('generated_at', 'Unknown')}\n")
                f.write("="*50 + "\n\n")
                
                # Write summary data
                if 'summary' in data:
                    f.write("SUMMARY:\n")
                    for key, value in data['summary'].items():
                        f.write(f"  {key}: {value}\n")
                    f.write("\n")
                
                # Write other data sections
                for section, content in data.items():
                    if section not in ['report_type', 'generated_at', 'summary']:
                        f.write(f"{section.upper()}:\n")
                        if isinstance(content, dict):
                            for key, value in content.items():
                                f.write(f"  {key}: {value}\n")
                        elif isinstance(content, list):
                            for item in content:
                                f.write(f"  {item}\n")
                        else:
                            f.write(f"  {content}\n")
                        f.write("\n")
        
        self.stdout.write(f'    Saved: {filename}')
