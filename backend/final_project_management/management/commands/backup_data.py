"""
Management command to backup data from the database.
Usage: python manage.py backup_data
"""

import json
import os
from datetime import datetime
from django.core.management.base import BaseCommand, CommandError
from django.core import serializers
from django.conf import settings
from django.contrib.auth import get_user_model

from accounts.models import Profile
from students.models import Student, StudentAcademicRecord, StudentSkill, StudentAchievement, StudentAttendance, StudentNote
from advisors.models import Advisor, AdvisorSpecialization, AdvisorWorkload, AdvisorPerformance, AdvisorAvailability, AdvisorNote
from majors.models import Major, MajorRequirement, MajorCurriculum, MajorNote
from classrooms.models import Classroom, ClassroomSchedule, ClassroomReservation, ClassroomNote
from projects.models import ProjectGroup, Project, ProjectStudent, ProjectFile, CommunicationLog, ProjectHealthCheck, TopicSimilarity, StatusHistory
from committees.models import Committee, CommitteeAssignment, CommitteeEvaluation, CommitteeMeeting, CommitteeMember, CommitteeNote
from milestones.models import MilestoneTemplate, Milestone, MilestoneSubmission, MilestoneFeedback, MilestoneReminder, MilestoneNote
from scoring.models import ScoringRubric, ScoringRubricItem, ProjectScore, ProjectScoreDetail, ScoringSettings, ScoringNote, ScoringAudit
from notifications.models import Notification, NotificationTemplate, NotificationSubscription, NotificationLog, NotificationAnnouncement, NotificationPreference
from ai_services.models import AIAnalysis, AISecurityAudit, AISystemHealth, AICommunicationAnalysis, AIGrammarCheck, AIAdvisorSuggestion, AITopicSimilarity, AIProjectHealth, AIStudentAnalysis, AIAnalysisLog
from analytics.models import AnalyticsDashboard, AnalyticsReport, AnalyticsMetric, AnalyticsNote
from settings.models import AcademicYear, SystemSetting, SystemLog, SystemNote
from reports.models import Report, ReportTemplate, ReportData, ReportNote

User = get_user_model()


class Command(BaseCommand):
    help = 'Backup data from the database to JSON files'

    def add_arguments(self, parser):
        parser.add_argument(
            '--output-dir',
            type=str,
            default='backups',
            help='Directory to save backup files (default: backups)',
        )
        parser.add_argument(
            '--format',
            type=str,
            choices=['json', 'xml'],
            default='json',
            help='Backup format (default: json)',
        )
        parser.add_argument(
            '--models',
            nargs='+',
            help='Specific models to backup (default: all models)',
        )
        parser.add_argument(
            '--exclude-users',
            action='store_true',
            help='Exclude user data from backup',
        )

    def handle(self, *args, **options):
        self.output_dir = options['output_dir']
        self.format = options['format']
        self.models = options['models']
        self.exclude_users = options['exclude_users']
        
        # Create output directory
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Generate timestamp for backup files
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        self.stdout.write(
            self.style.SUCCESS(f'Starting backup to {self.output_dir}/...')
        )

        # Define models to backup
        models_to_backup = self.get_models_to_backup()
        
        # Create backup files
        for model in models_to_backup:
            self.backup_model(model, timestamp)
        
        # Create backup summary
        self.create_backup_summary(timestamp, models_to_backup)
        
        self.stdout.write(
            self.style.SUCCESS('Backup completed successfully!')
        )

    def get_models_to_backup(self):
        """Get list of models to backup."""
        all_models = [
            # System settings and academic data
            (AcademicYear, 'academic_years'),
            (SystemSetting, 'system_settings'),
            (SystemLog, 'system_logs'),
            (SystemNote, 'system_notes'),
            
            # Majors and curriculum
            (Major, 'majors'),
            (MajorRequirement, 'major_requirements'),
            (MajorCurriculum, 'major_curriculums'),
            (MajorNote, 'major_notes'),
            
            # Classrooms
            (Classroom, 'classrooms'),
            (ClassroomSchedule, 'classroom_schedules'),
            (ClassroomReservation, 'classroom_reservations'),
            (ClassroomNote, 'classroom_notes'),
            
            # Users and profiles
            (User, 'users'),
            (Profile, 'profiles'),
            
            # Students
            (Student, 'students'),
            (StudentAcademicRecord, 'student_academic_records'),
            (StudentSkill, 'student_skills'),
            (StudentAchievement, 'student_achievements'),
            (StudentAttendance, 'student_attendance'),
            (StudentNote, 'student_notes'),
            
            # Advisors
            (Advisor, 'advisors'),
            (AdvisorSpecialization, 'advisor_specializations'),
            (AdvisorWorkload, 'advisor_workloads'),
            (AdvisorPerformance, 'advisor_performance'),
            (AdvisorAvailability, 'advisor_availability'),
            (AdvisorNote, 'advisor_notes'),
            
            # Projects
            (ProjectGroup, 'project_groups'),
            (Project, 'projects'),
            (ProjectStudent, 'project_students'),
            (ProjectFile, 'project_files'),
            (CommunicationLog, 'communication_logs'),
            (ProjectHealthCheck, 'project_health_checks'),
            (TopicSimilarity, 'topic_similarities'),
            (StatusHistory, 'status_histories'),
            
            # Committees
            (Committee, 'committees'),
            (CommitteeMember, 'committee_members'),
            (CommitteeAssignment, 'committee_assignments'),
            (CommitteeEvaluation, 'committee_evaluations'),
            (CommitteeMeeting, 'committee_meetings'),
            (CommitteeNote, 'committee_notes'),
            
            # Milestones
            (MilestoneTemplate, 'milestone_templates'),
            (Milestone, 'milestones'),
            (MilestoneSubmission, 'milestone_submissions'),
            (MilestoneFeedback, 'milestone_feedback'),
            (MilestoneReminder, 'milestone_reminders'),
            (MilestoneNote, 'milestone_notes'),
            
            # Scoring
            (ScoringRubric, 'scoring_rubrics'),
            (ScoringRubricItem, 'scoring_rubric_items'),
            (ProjectScore, 'project_scores'),
            (ProjectScoreDetail, 'project_score_details'),
            (ScoringSettings, 'scoring_settings'),
            (ScoringNote, 'scoring_notes'),
            (ScoringAudit, 'scoring_audits'),
            
            # Notifications
            (Notification, 'notifications'),
            (NotificationTemplate, 'notification_templates'),
            (NotificationSubscription, 'notification_subscriptions'),
            (NotificationLog, 'notification_logs'),
            (NotificationAnnouncement, 'notification_announcements'),
            (NotificationPreference, 'notification_preferences'),
            
            # AI Services
            (AIAnalysis, 'ai_analyses'),
            (AISecurityAudit, 'ai_security_audits'),
            (AISystemHealth, 'ai_system_health'),
            (AICommunicationAnalysis, 'ai_communication_analyses'),
            (AIGrammarCheck, 'ai_grammar_checks'),
            (AIAdvisorSuggestion, 'ai_advisor_suggestions'),
            (AITopicSimilarity, 'ai_topic_similarities'),
            (AIProjectHealth, 'ai_project_health'),
            (AIStudentAnalysis, 'ai_student_analyses'),
            (AIAnalysisLog, 'ai_analysis_logs'),
            
            # Analytics
            (AnalyticsDashboard, 'analytics_dashboards'),
            (AnalyticsReport, 'analytics_reports'),
            (AnalyticsMetric, 'analytics_metrics'),
            (AnalyticsNote, 'analytics_notes'),
            
            # Reports
            (Report, 'reports'),
            (ReportTemplate, 'report_templates'),
            (ReportData, 'report_data'),
            (ReportNote, 'report_notes'),
        ]
        
        if self.exclude_users:
            # Filter out user-related models
            user_models = [User, Profile, Student, Advisor]
            models_to_backup = [(model, name) for model, name in all_models 
                               if model not in user_models]
        elif self.models:
            # Filter to specific models
            model_names = [model.__name__ for model, _ in all_models]
            models_to_backup = [(model, name) for model, name in all_models 
                               if model.__name__ in self.models]
        else:
            models_to_backup = all_models
        
        return models_to_backup

    def backup_model(self, model_info, timestamp):
        """Backup a specific model to file."""
        model, filename = model_info
        
        try:
            # Get all objects for this model
            objects = model.objects.all()
            count = objects.count()
            
            if count == 0:
                self.stdout.write(f'  Skipping {model._meta.verbose_name_plural} (no data)')
                return
            
            # Serialize data
            if self.format == 'json':
                data = serializers.serialize('json', objects, indent=2)
                file_extension = 'json'
            else:  # xml
                data = serializers.serialize('xml', objects, indent=2)
                file_extension = 'xml'
            
            # Write to file
            backup_filename = f'{filename}_{timestamp}.{file_extension}'
            backup_path = os.path.join(self.output_dir, backup_filename)
            
            with open(backup_path, 'w', encoding='utf-8') as f:
                f.write(data)
            
            self.stdout.write(f'  Backed up {count} {model._meta.verbose_name_plural} to {backup_filename}')
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'  Error backing up {model._meta.verbose_name}: {e}')
            )

    def create_backup_summary(self, timestamp, models_to_backup):
        """Create a summary file for the backup."""
        summary = {
            'backup_timestamp': timestamp,
            'backup_format': self.format,
            'models_backed_up': len(models_to_backup),
            'models': []
        }
        
        for model, filename in models_to_backup:
            try:
                count = model.objects.count()
                summary['models'].append({
                    'model_name': model._meta.verbose_name,
                    'model_name_plural': model._meta.verbose_name_plural,
                    'filename': f'{filename}_{timestamp}.{self.format}',
                    'record_count': count
                })
            except Exception as e:
                summary['models'].append({
                    'model_name': model._meta.verbose_name,
                    'error': str(e)
                })
        
        # Write summary file
        summary_filename = f'backup_summary_{timestamp}.json'
        summary_path = os.path.join(self.output_dir, summary_filename)
        
        with open(summary_path, 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
        
        self.stdout.write(f'  Created backup summary: {summary_filename}')
