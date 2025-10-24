"""
Management command to clear all data from the database.
Usage: python manage.py clear_data
"""

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
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
    help = 'Clear all data from the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm that you want to clear all data',
        )
        parser.add_argument(
            '--keep-users',
            action='store_true',
            help='Keep user accounts and only clear application data',
        )

    def handle(self, *args, **options):
        if not options['confirm']:
            self.stdout.write(
                self.style.ERROR(
                    'This command will delete ALL data from the database!\n'
                    'Use --confirm to proceed.'
                )
            )
            return

        self.stdout.write(
            self.style.WARNING('Starting database cleanup...')
        )

        with transaction.atomic():
            if options['keep_users']:
                self.clear_application_data()
            else:
                self.clear_all_data()

        self.stdout.write(
            self.style.SUCCESS('Database cleanup completed successfully!')
        )

    def clear_all_data(self):
        """Clear all data including users."""
        self.stdout.write('Clearing all data...')
        
        # Clear in reverse dependency order
        self.clear_models([
            # Analytics
            AnalyticsNote, AnalyticsMetric, AnalyticsReport, AnalyticsDashboard,
            
            # Reports
            ReportNote, ReportData, ReportTemplate, Report,
            
            # System
            SystemNote, SystemLog, SystemSetting, AcademicYear,
            
            # AI Services
            AIAnalysisLog, AIStudentAnalysis, AIProjectHealth, AITopicSimilarity,
            AIAdvisorSuggestion, AIGrammarCheck, AICommunicationAnalysis,
            AISystemHealth, AISecurityAudit, AIAnalysis,
            
            # Notifications
            NotificationPreference, NotificationAnnouncement, NotificationLog,
            NotificationSubscription, NotificationTemplate, Notification,
            
            # Scoring
            ScoringAudit, ScoringNote, ProjectScoreDetail, ProjectScore,
            ScoringSettings, ScoringRubricItem, ScoringRubric,
            
            # Milestones
            MilestoneNote, MilestoneReminder, MilestoneFeedback, MilestoneSubmission,
            Milestone, MilestoneTemplate,
            
            # Committees
            CommitteeNote, CommitteeMember, CommitteeMeeting, CommitteeEvaluation,
            CommitteeAssignment, Committee,
            
            # Projects
            TopicSimilarity, ProjectHealthCheck, CommunicationLog, ProjectFile,
            ProjectStudent, StatusHistory, Project, ProjectGroup,
            
            # Classrooms
            ClassroomNote, ClassroomReservation, ClassroomSchedule, Classroom,
            
            # Majors
            MajorNote, MajorCurriculum, MajorRequirement, Major,
            
            # Advisors
            AdvisorNote, AdvisorAvailability, AdvisorPerformance, AdvisorWorkload,
            AdvisorSpecialization, Advisor,
            
            # Students
            StudentNote, StudentAttendance, StudentAchievement, StudentSkill,
            StudentAcademicRecord, Student,
            
            # Accounts
            Profile, User,
        ])

    def clear_application_data(self):
        """Clear application data but keep users."""
        self.stdout.write('Clearing application data (keeping users)...')
        
        # Clear in reverse dependency order
        self.clear_models([
            # Analytics
            AnalyticsNote, AnalyticsMetric, AnalyticsReport, AnalyticsDashboard,
            
            # Reports
            ReportNote, ReportData, ReportTemplate, Report,
            
            # System
            SystemNote, SystemLog, SystemSetting, AcademicYear,
            
            # AI Services
            AIAnalysisLog, AIStudentAnalysis, AIProjectHealth, AITopicSimilarity,
            AIAdvisorSuggestion, AIGrammarCheck, AICommunicationAnalysis,
            AISystemHealth, AISecurityAudit, AIAnalysis,
            
            # Notifications
            NotificationPreference, NotificationAnnouncement, NotificationLog,
            NotificationSubscription, NotificationTemplate, Notification,
            
            # Scoring
            ScoringAudit, ScoringNote, ProjectScoreDetail, ProjectScore,
            ScoringSettings, ScoringRubricItem, ScoringRubric,
            
            # Milestones
            MilestoneNote, MilestoneReminder, MilestoneFeedback, MilestoneSubmission,
            Milestone, MilestoneTemplate,
            
            # Committees
            CommitteeNote, CommitteeMember, CommitteeMeeting, CommitteeEvaluation,
            CommitteeAssignment, Committee,
            
            # Projects
            TopicSimilarity, ProjectHealthCheck, CommunicationLog, ProjectFile,
            ProjectStudent, StatusHistory, Project, ProjectGroup,
            
            # Classrooms
            ClassroomNote, ClassroomReservation, ClassroomSchedule, Classroom,
            
            # Majors
            MajorNote, MajorCurriculum, MajorRequirement, Major,
            
            # Advisors
            AdvisorNote, AdvisorAvailability, AdvisorPerformance, AdvisorWorkload,
            AdvisorSpecialization, Advisor,
            
            # Students
            StudentNote, StudentAttendance, StudentAchievement, StudentSkill,
            StudentAcademicRecord, Student,
        ])

    def clear_models(self, models):
        """Clear data from a list of models."""
        for model in models:
            try:
                count = model.objects.count()
                if count > 0:
                    model.objects.all().delete()
                    self.stdout.write(f'  Cleared {count} {model._meta.verbose_name_plural}')
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'  Error clearing {model._meta.verbose_name}: {e}')
                )
