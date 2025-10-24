"""
Project-specific signals for automated workflows.
"""

import logging
from django.db.models.signals import post_save, pre_save, post_delete, pre_delete
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.db import transaction

User = get_user_model()
logger = logging.getLogger(__name__)


@receiver(post_save, sender='projects.ProjectGroup')
def project_created_handler(sender, instance, created, **kwargs):
    """Handle project creation."""
    if created:
        logger.info(f"New project created: {instance.name}")
        
        # Create initial status history
        try:
            from .models import StatusHistory
            StatusHistory.objects.create(
                project_group=instance,
                old_status='',
                new_status=instance.status,
                changed_by=instance.advisor,
                change_reason='Project created'
            )
        except Exception as e:
            logger.error(f"Error creating status history: {e}")
        
        # Send notification to advisor
        try:
            from notifications.models import Notification
            if instance.advisor:
                Notification.objects.create(
                    recipient_id=str(instance.advisor.id),
                    recipient_type='user',
                    title='New Project Created',
                    message=f'Project "{instance.name}" has been created and assigned to you',
                    notification_type='info'
                )
        except Exception as e:
            logger.error(f"Error creating project notification: {e}")
        
        # Log project creation
        try:
            from analytics.models import AnalyticsMetric
            AnalyticsMetric.objects.create(
                metric_name='project_created',
                value=1,
                description=f"Project created: {instance.name}"
            )
        except Exception as e:
            logger.error(f"Error logging project creation: {e}")


@receiver(pre_save, sender='projects.ProjectGroup')
def project_pre_save_handler(sender, instance, **kwargs):
    """Handle project before save operations."""
    if instance.pk:
        try:
            old_instance = sender.objects.get(pk=instance.pk)
            
            # Check if status changed
            if old_instance.status != instance.status:
                logger.info(f"Project status changed: {instance.name} from {old_instance.status} to {instance.status}")
                
                # Create status history
                try:
                    from .models import StatusHistory
                    StatusHistory.objects.create(
                        project_group=instance,
                        old_status=old_instance.status,
                        new_status=instance.status,
                        changed_by=instance.advisor,
                        change_reason=f'Status changed from {old_instance.status} to {instance.status}'
                    )
                except Exception as e:
                    logger.error(f"Error creating status history: {e}")
                
                # Send status change notification
                try:
                    from notifications.models import Notification
                    
                    # Notify advisor
                    if instance.advisor:
                        Notification.objects.create(
                            recipient_id=str(instance.advisor.id),
                            recipient_type='user',
                            title='Project Status Changed',
                            message=f'Project "{instance.name}" status changed to {instance.status}',
                            notification_type='info'
                        )
                    
                    # Notify students
                    from .models import ProjectStudent
                    project_students = ProjectStudent.objects.filter(project_group=instance)
                    for project_student in project_students:
                        Notification.objects.create(
                            recipient_id=str(project_student.student.id),
                            recipient_type='user',
                            title='Project Status Changed',
                            message=f'Project "{instance.name}" status changed to {instance.status}',
                            notification_type='info'
                        )
                except Exception as e:
                    logger.error(f"Error creating status change notification: {e}")
            
            # Check if advisor changed
            if old_instance.advisor != instance.advisor:
                logger.info(f"Project advisor changed: {instance.name}")
                
                # Send advisor change notification
                try:
                    from notifications.models import Notification
                    
                    # Notify old advisor
                    if old_instance.advisor:
                        Notification.objects.create(
                            recipient_id=str(old_instance.advisor.id),
                            recipient_type='user',
                            title='Project Reassigned',
                            message=f'Project "{instance.name}" has been reassigned',
                            notification_type='warning'
                        )
                    
                    # Notify new advisor
                    if instance.advisor:
                        Notification.objects.create(
                            recipient_id=str(instance.advisor.id),
                            recipient_type='user',
                            title='Project Assigned',
                            message=f'Project "{instance.name}" has been assigned to you',
                            notification_type='info'
                        )
                except Exception as e:
                    logger.error(f"Error creating advisor change notification: {e}")
        
        except sender.DoesNotExist:
            pass


@receiver(post_save, sender='projects.ProjectGroup')
def project_updated_handler(sender, instance, created, **kwargs):
    """Handle project updates."""
    if not created:
        logger.info(f"Project updated: {instance.name}")
        
        # Log project update
        try:
            from analytics.models import AnalyticsMetric
            AnalyticsMetric.objects.create(
                metric_name='project_updated',
                value=1,
                recorded_at=timezone.now(),
                description={
                    'project_id': instance.id,
                    'project_name': instance.name,
                    'status': instance.status
                }
            )
        except Exception as e:
            logger.error(f"Error logging project update: {e}")


@receiver(post_delete, sender='projects.ProjectGroup')
def project_deleted_handler(sender, instance, **kwargs):
    """Handle project deletion."""
    logger.info(f"Project deleted: {instance.name}")
    
    # Log project deletion
    try:
        from analytics.models import AnalyticsMetric
        AnalyticsMetric.objects.create(
            metric_name='project_deleted',
            value=1,
            recorded_at=timezone.now(),
            description={
                'project_name': instance.name,
                'advisor_id': instance.advisor.id,
                'academic_year': instance.academic_year
            }
        )
    except Exception as e:
        logger.error(f"Error logging project deletion: {e}")


# ProjectStudent signals
@receiver(post_save, sender='projects.ProjectStudent')
def project_student_added_handler(sender, instance, created, **kwargs):
    """Handle student addition to project."""
    if created:
        logger.info(f"Student added to project: {instance.student.username} -> {instance.project_group.name}")
        
        # Send notification to student
        try:
            from notifications.models import Notification
            Notification.objects.create(
                recipient_id=str(instance.student.id),
                recipient_type='user',
                title='Added to Project',
                message=f'You have been added to project "{instance.project_group.name}"',
                notification_type='info'
            )
        except Exception as e:
            logger.error(f"Error creating student notification: {e}")
        
        # Send notification to advisor
        try:
            from notifications.models import Notification
            if instance.project_group.advisor:
                Notification.objects.create(
                    recipient_id=str(instance.project_group.advisor.id),
                    recipient_type='user',
                    title='Student Added to Project',
                    message=f'Student {instance.student.username} has been added to project "{instance.project_group.name}"',
                    notification_type='info'
                )
        except Exception as e:
            logger.error(f"Error creating advisor notification: {e}")
        
        # Log student addition
        try:
            from analytics.models import AnalyticsMetric
            AnalyticsMetric.objects.create(
                metric_name='student_added_to_project',
                value=1,
                recorded_at=timezone.now(),
                description={
                    'project_id': instance.project_group.id,
                    'student_id': instance.student.id,
                    'is_primary': instance.is_primary
                }
            )
        except Exception as e:
            logger.error(f"Error logging student addition: {e}")


@receiver(post_delete, sender='projects.ProjectStudent')
def project_student_removed_handler(sender, instance, **kwargs):
    """Handle student removal from project."""
    logger.info(f"Student removed from project: {instance.student.username} -> {instance.project_group.name}")
    
    # Send notification to student
    try:
        from notifications.models import Notification
        Notification.objects.create(
            recipient_id=str(instance.student.id),
            recipient_type='user',
            title='Removed from Project',
            message=f'You have been removed from project "{instance.project_group.name}"',
            notification_type='warning'
        )
    except Exception as e:
        logger.error(f"Error creating student notification: {e}")
    
    # Send notification to advisor
    try:
        from notifications.models import Notification
        if instance.project_group.advisor:
            Notification.objects.create(
                recipient_id=str(instance.project_group.advisor.id),
                recipient_type='user',
                title='Student Removed from Project',
                message=f'Student {instance.student.username} has been removed from project "{instance.project_group.name}"',
                notification_type='warning'
            )
    except Exception as e:
        logger.error(f"Error creating advisor notification: {e}")
    
    # Log student removal
    try:
        from analytics.models import AnalyticsMetric
        AnalyticsMetric.objects.create(
            metric_name='student_removed_from_project',
            value=1,
            recorded_at=timezone.now(),
            description={
                'project_id': instance.project_group.id,
                'student_id': instance.student.id
            }
        )
    except Exception as e:
        logger.error(f"Error logging student removal: {e}")


# ProjectFile signals
@receiver(post_save, sender='projects.ProjectFile')
def project_file_uploaded_handler(sender, instance, created, **kwargs):
    """Handle project file upload."""
    if created:
        logger.info(f"Project file uploaded: {instance.file.name} -> {instance.project_group.name}")
        
        # Send notification to project members
        try:
            from notifications.models import Notification
            
            # Notify advisor
            if instance.project_group.advisor:
                Notification.objects.create(
                    recipient_id=str(instance.project_group.advisor.id),
                    recipient_type='user',
                    title='File Uploaded',
                    message=f'New file "{instance.file.name}" uploaded to project "{instance.project_group.name}"',
                    notification_type='info'
                )
            
            # Notify students
            from .models import ProjectStudent
            project_students = ProjectStudent.objects.filter(project_group=instance.project_group)
            for project_student in project_students:
                Notification.objects.create(
                    recipient_id=str(project_student.student.id),
                    recipient_type='user',
                    title='File Uploaded',
                    message=f'New file "{instance.file.name}" uploaded to project "{instance.project_group.name}"',
                    notification_type='info'
                )
        except Exception as e:
            logger.error(f"Error creating file upload notification: {e}")
        
        # Log file upload
        try:
            from analytics.models import AnalyticsMetric
            AnalyticsMetric.objects.create(
                metric_name='project_file_uploaded',
                value=1,
                recorded_at=timezone.now(),
                description={
                    'project_id': instance.project_group.id,
                    'file_name': instance.file.name,
                    'file_type': instance.file_type,
                    'uploaded_by': instance.uploaded_by.id if instance.uploaded_by else None
                }
            )
        except Exception as e:
            logger.error(f"Error logging file upload: {e}")


# CommunicationLog signals
@receiver(post_save, sender='projects.CommunicationLog')
def communication_logged_handler(sender, instance, created, **kwargs):
    """Handle communication logging."""
    if created:
        logger.info(f"Communication logged: {instance.sender.username} -> {instance.recipient.username}")
        
        # Send notification to recipient
        try:
            from notifications.models import Notification
            Notification.objects.create(
                recipient_id=str(instance.recipient.id),
                recipient_type='user',
                title='New Communication',
                message=f'New {instance.communication_type} from {instance.sender.username}: {instance.subject}',
                notification_type='info'
            )
        except Exception as e:
            logger.error(f"Error creating communication notification: {e}")
        
        # Log communication
        try:
            from analytics.models import AnalyticsMetric
            AnalyticsMetric.objects.create(
                metric_name='communication_logged',
                value=1,
                recorded_at=timezone.now(),
                description={
                    'project_id': instance.project_group.id,
                    'sender_id': instance.sender.id,
                    'recipient_id': instance.recipient.id,
                    'communication_type': instance.communication_type
                }
            )
        except Exception as e:
            logger.error(f"Error logging communication: {e}")


# ProjectHealthCheck signals
@receiver(post_save, sender='projects.ProjectHealthCheck')
def project_health_check_handler(sender, instance, created, **kwargs):
    """Handle project health check."""
    if created:
        logger.info(f"Project health check performed: {instance.project_group.name} - {instance.health_status}")
        
        # Send notification if health status is critical
        if instance.health_status == 'critical':
            try:
                from notifications.models import Notification
                
                # Notify advisor
                if instance.project_group.advisor:
                    Notification.objects.create(
                        recipient_id=str(instance.project_group.advisor.id),
                        recipient_type='user',
                        title='Project Health Alert',
                        message=f'Project "{instance.project_group.name}" has critical health issues: {instance.summary}',
                        notification_type='warning'
                    )
                
                # Notify students
                from .models import ProjectStudent
                project_students = ProjectStudent.objects.filter(project_group=instance.project_group)
                for project_student in project_students:
                    Notification.objects.create(
                        recipient_id=str(project_student.student.id),
                        recipient_type='user',
                        title='Project Health Alert',
                        message=f'Project "{instance.project_group.name}" has critical health issues: {instance.summary}',
                        notification_type='warning'
                    )
            except Exception as e:
                logger.error(f"Error creating health check notification: {e}")
        
        # Log health check
        try:
            from analytics.models import AnalyticsMetric
            AnalyticsMetric.objects.create(
                metric_name='project_health_check',
                value=1,
                recorded_at=timezone.now(),
                description={
                    'project_id': instance.project_group.id,
                    'health_status': instance.health_status,
                    'issues_count': len(instance.issues) if instance.issues else 0
                }
            )
        except Exception as e:
            logger.error(f"Error logging health check: {e}")


# TopicSimilarity signals
@receiver(post_save, sender='projects.TopicSimilarity')
def topic_similarity_handler(sender, instance, created, **kwargs):
    """Handle topic similarity detection."""
    if created:
        logger.info(f"Topic similarity detected: {instance.project_group.name} - {instance.similarity_percentage}%")
        
        # Send notification if similarity is high
        if instance.similarity_percentage > 80:
            try:
                from notifications.models import Notification
                
                # Notify advisor
                if instance.project_group.advisor:
                    Notification.objects.create(
                        recipient_id=str(instance.project_group.advisor.id),
                        recipient_type='user',
                        title='High Topic Similarity Detected',
                        message=f'Project "{instance.project_group.name}" has {instance.similarity_percentage}% similarity with another project',
                        notification_type='warning'
                    )
            except Exception as e:
                logger.error(f"Error creating similarity notification: {e}")
        
        # Log similarity detection
        try:
            from analytics.models import AnalyticsMetric
            AnalyticsMetric.objects.create(
                metric_name='topic_similarity_detected',
                value=1,
                recorded_at=timezone.now(),
                description={
                    'project_id': instance.project_group.id,
                    'similarity_percentage': instance.similarity_percentage,
                    'similar_project_id': instance.similar_project.id if instance.similar_project else None
                }
            )
        except Exception as e:
            logger.error(f"Error logging similarity detection: {e}")


# Project milestone completion
@receiver(post_save, sender='milestones.Milestone')
def milestone_completion_handler(sender, instance, created, **kwargs):
    """Handle milestone completion."""
    if not created and instance.status == 'completed':
        logger.info(f"Milestone completed: {instance.title}")
        
        # Send notification to project members
        try:
            from notifications.models import Notification
            
            # Notify advisor
            if instance.project_group.advisor:
                Notification.objects.create(
                    recipient_id=str(instance.project_group.advisor.id),
                    recipient_type='user',
                    title='Milestone Completed',
                    message=f'Milestone "{instance.title}" has been completed for project "{instance.project_group.name}"',
                    notification_type='info'
                )
            
            # Notify students
            from projects.models import ProjectStudent
            project_students = ProjectStudent.objects.filter(project_group=instance.project_group)
            for project_student in project_students:
                Notification.objects.create(
                    recipient_id=str(project_student.student.id),
                    recipient_type='user',
                    title='Milestone Completed',
                    message=f'Milestone "{instance.title}" has been completed for project "{instance.project_group.name}"',
                    notification_type='info'
                )
        except Exception as e:
            logger.error(f"Error creating milestone completion notification: {e}")
        
        # Log milestone completion
        try:
            from analytics.models import AnalyticsMetric
            AnalyticsMetric.objects.create(
                metric_name='milestone_completed',
                value=1,
                recorded_at=timezone.now(),
                description={
                    'project_id': instance.project_group.id,
                    'milestone_id': instance.id,
                    'milestone_title': instance.title
                }
            )
        except Exception as e:
            logger.error(f"Error logging milestone completion: {e}")


# Project deadline monitoring
@receiver(post_save, sender='projects.ProjectGroup')
def project_deadline_monitor(sender, instance, created, **kwargs):
    """Monitor project deadlines."""
    if not created and instance.end_date:
        from datetime import timedelta
        
        # Check if project is approaching deadline
        days_remaining = (instance.end_date - timezone.now().date()).days
        
        if days_remaining <= 7 and days_remaining > 0:  # 7 days or less
            try:
                from notifications.models import Notification
                
                # Notify advisor
                if instance.advisor:
                    Notification.objects.create(
                        recipient_id=str(instance.advisor.id),
                        recipient_type='user',
                        title='Project Deadline Approaching',
                        message=f'Project "{instance.name}" deadline is in {days_remaining} days',
                        notification_type='warning'
                    )
                
                # Notify students
                from .models import ProjectStudent
                project_students = ProjectStudent.objects.filter(project_group=instance)
                for project_student in project_students:
                    Notification.objects.create(
                        recipient_id=str(project_student.student.id),
                        recipient_type='user',
                        title='Project Deadline Approaching',
                        message=f'Project "{instance.name}" deadline is in {days_remaining} days',
                        notification_type='warning'
                    )
            except Exception as e:
                logger.error(f"Error creating deadline notification: {e}")
        
        elif days_remaining < 0:  # Overdue
            try:
                from notifications.models import Notification
                
                # Notify advisor
                if instance.advisor:
                    Notification.objects.create(
                        recipient_id=str(instance.advisor.id),
                        recipient_type='user',
                        title='Project Overdue',
                        message=f'Project "{instance.name}" is overdue by {abs(days_remaining)} days',
                        notification_type='error'
                    )
                
                # Notify students
                from .models import ProjectStudent
                project_students = ProjectStudent.objects.filter(project_group=instance)
                for project_student in project_students:
                    Notification.objects.create(
                        recipient_id=str(project_student.student.id),
                        recipient_type='user',
                        title='Project Overdue',
                        message=f'Project "{instance.name}" is overdue by {abs(days_remaining)} days',
                        notification_type='error'
                    )
            except Exception as e:
                logger.error(f"Error creating overdue notification: {e}")
