"""
Student-specific signals for automated workflows.
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


@receiver(post_save, sender='students.Student')
def student_created_handler(sender, instance, created, **kwargs):
    """Handle student creation."""
    if created:
        logger.info(f"New student created: {instance.student_id}")
        
        # Send welcome email to student
        try:
            from final_project_management.utils import EmailUtils
            EmailUtils.send_notification_email(
                instance.user,
                f"Welcome to the Final Project Management System! Your student account has been created successfully. Student ID: {instance.student_id}"
            )
        except Exception as e:
            logger.error(f"Error sending welcome email: {e}")
        
        # Log student creation
        try:
            from analytics.models import AnalyticsMetric
            AnalyticsMetric.objects.create(
                metric_name='student_created',
                value=1,
                description=f"Student created: {instance.student_id} ({instance.major})"
            )
        except Exception as e:
            logger.error(f"Error logging student creation: {e}")


@receiver(pre_save, sender='students.Student')
def student_pre_save_handler(sender, instance, **kwargs):
    """Handle student before save operations."""
    if instance.pk:
        try:
            old_instance = sender.objects.get(pk=instance.pk)
            
            # Check if GPA changed
            if old_instance.gpa != instance.gpa:
                logger.info(f"Student GPA changed: {instance.student_id} from {old_instance.gpa} to {instance.gpa}")
                
                # Send GPA change notification if GPA is low
                if instance.gpa < 2.5:
                    try:
                        from notifications.models import Notification
                        Notification.objects.create(
                            user=instance.user,
                            title='GPA Alert',
                            message=f'Your GPA is now {instance.gpa}. Please contact your advisor for academic support.',
                            notification_type='warning'
                        )
                    except Exception as e:
                        logger.error(f"Error creating GPA notification: {e}")
                
                # Log GPA change
                try:
                    from analytics.models import AnalyticsMetric
                    AnalyticsMetric.objects.create(
                        metric_name='student_gpa_changed',
                        value=1,
                        recorded_at=timezone.now(),
                        description={
                            'student_id': instance.id,
                            'old_gpa': old_instance.gpa,
                            'new_gpa': instance.gpa
                        }
                    )
                except Exception as e:
                    logger.error(f"Error logging GPA change: {e}")
            
            # Check if major changed
            if old_instance.major != instance.major:
                logger.info(f"Student major changed: {instance.student_id} from {old_instance.major} to {instance.major}")
                
                # Send major change notification
                try:
                    from notifications.models import Notification
                    Notification.objects.create(
                        user=instance.user,
                        title='Major Changed',
                        message=f'Your major has been changed to {instance.major}',
                        notification_type='info'
                    )
                except Exception as e:
                    logger.error(f"Error creating major change notification: {e}")
                
                # Log major change
                try:
                    from analytics.models import AnalyticsMetric
                    AnalyticsMetric.objects.create(
                        metric_name='student_major_changed',
                        value=1,
                        recorded_at=timezone.now(),
                        description={
                            'student_id': instance.id,
                            'old_major': old_instance.major,
                            'new_major': instance.major
                        }
                    )
                except Exception as e:
                    logger.error(f"Error logging major change: {e}")
        
        except sender.DoesNotExist:
            pass


@receiver(post_save, sender='students.Student')
def student_updated_handler(sender, instance, created, **kwargs):
    """Handle student updates."""
    if not created:
        logger.info(f"Student updated: {instance.student_id}")
        
        # Log student update
        try:
            from analytics.models import AnalyticsMetric
            AnalyticsMetric.objects.create(
                metric_name='student_updated',
                value=1,
                recorded_at=timezone.now(),
                description={
                    'student_id': instance.id,
                    'student_number': instance.student_id,
                    'gpa': instance.gpa,
                    'major': instance.major
                }
            )
        except Exception as e:
            logger.error(f"Error logging student update: {e}")


@receiver(post_delete, sender='students.Student')
def student_deleted_handler(sender, instance, **kwargs):
    """Handle student deletion."""
    logger.info(f"Student deleted: {instance.student_id}")
    
    # Log student deletion
    try:
        from analytics.models import AnalyticsMetric
        AnalyticsMetric.objects.create(
            metric_name='student_deleted',
            value=1,
            recorded_at=timezone.now(),
            description={
                'student_number': instance.student_id,
                'major': instance.major,
                'gpa': instance.gpa
            }
        )
    except Exception as e:
        logger.error(f"Error logging student deletion: {e}")


# StudentAcademicRecord signals
@receiver(post_save, sender='students.StudentAcademicRecord')
def academic_record_added_handler(sender, instance, created, **kwargs):
    """Handle academic record addition."""
    if created:
        logger.info(f"Academic record added: {instance.course_name} for {instance.student.student_id}")
        
        # Recalculate student GPA
        try:
            from .utils import StudentAcademicUtils
            new_gpa = StudentAcademicUtils.calculate_student_gpa(instance.student)
            instance.student.gpa = new_gpa
            instance.student.save()
            logger.info(f"Student GPA recalculated: {instance.student.student_id} -> {new_gpa}")
        except Exception as e:
            logger.error(f"Error recalculating GPA: {e}")
        
        # Send notification if grade is low
        if instance.grade in ['D+', 'D', 'D-', 'F']:
            try:
                from notifications.models import Notification
                Notification.objects.create(
                    user=instance.student.user,
                    title='Low Grade Alert',
                    message=f'You received a {instance.grade} in {instance.course_name}. Please contact your advisor.',
                    notification_type='warning'
                )
            except Exception as e:
                logger.error(f"Error creating low grade notification: {e}")
        
        # Log academic record
        try:
            from analytics.models import AnalyticsMetric
            AnalyticsMetric.objects.create(
                metric_name='academic_record_added',
                value=1,
                recorded_at=timezone.now(),
                description={
                    'student_id': instance.student.id,
                    'course_name': instance.course_name,
                    'grade': instance.grade,
                    'credits': instance.credits
                }
            )
        except Exception as e:
            logger.error(f"Error logging academic record: {e}")


# StudentSkill signals
@receiver(post_save, sender='students.StudentSkill')
def student_skill_added_handler(sender, instance, created, **kwargs):
    """Handle student skill addition."""
    if created:
        logger.info(f"Student skill added: {instance.skill_name} for {instance.student.student_id}")
        
        # Send notification to student
        try:
            from notifications.models import Notification
            Notification.objects.create(
                user=instance.student.user,
                title='Skill Added',
                message=f'Skill "{instance.skill_name}" has been added to your profile',
                notification_type='info'
            )
        except Exception as e:
            logger.error(f"Error creating skill notification: {e}")
        
        # Log skill addition
        try:
            from analytics.models import AnalyticsMetric
            AnalyticsMetric.objects.create(
                metric_name='student_skill_added',
                value=1,
                recorded_at=timezone.now(),
                description={
                    'student_id': instance.student.id,
                    'skill_name': instance.skill_name,
                    'skill_level': instance.skill_level
                }
            )
        except Exception as e:
            logger.error(f"Error logging skill addition: {e}")


# StudentAchievement signals
@receiver(post_save, sender='students.StudentAchievement')
def student_achievement_added_handler(sender, instance, created, **kwargs):
    """Handle student achievement addition."""
    if created:
        logger.info(f"Student achievement added: {instance.achievement_name} for {instance.student.student_id}")
        
        # Send notification to student
        try:
            from notifications.models import Notification
            Notification.objects.create(
                user=instance.student.user,
                title='Achievement Added',
                message=f'Achievement "{instance.achievement_name}" has been added to your profile',
                notification_type='info'
            )
        except Exception as e:
            logger.error(f"Error creating achievement notification: {e}")
        
        # Log achievement addition
        try:
            from analytics.models import AnalyticsMetric
            AnalyticsMetric.objects.create(
                metric_name='student_achievement_added',
                value=1,
                recorded_at=timezone.now(),
                description={
                    'student_id': instance.student.id,
                    'achievement_name': instance.achievement_name,
                    'achievement_type': instance.achievement_type
                }
            )
        except Exception as e:
            logger.error(f"Error logging achievement addition: {e}")


# StudentAttendance signals
@receiver(post_save, sender='students.StudentAttendance')
def student_attendance_marked_handler(sender, instance, created, **kwargs):
    """Handle student attendance marking."""
    if created:
        logger.info(f"Student attendance marked: {instance.student.student_id} - {instance.date} - {instance.status}")
        
        # Send notification if attendance is poor
        if instance.status == 'absent':
            try:
                from notifications.models import Notification
                Notification.objects.create(
                    user=instance.student.user,
                    title='Absence Recorded',
                    message=f'You were marked absent on {instance.date}. Please contact your advisor if this is an error.',
                    notification_type='warning'
                )
            except Exception as e:
                logger.error(f"Error creating absence notification: {e}")
        
        # Log attendance
        try:
            from analytics.models import AnalyticsMetric
            AnalyticsMetric.objects.create(
                metric_name='student_attendance_marked',
                value=1,
                recorded_at=timezone.now(),
                description={
                    'student_id': instance.student.id,
                    'date': instance.date.isoformat(),
                    'status': instance.status
                }
            )
        except Exception as e:
            logger.error(f"Error logging attendance: {e}")


# StudentNote signals
@receiver(post_save, sender='students.StudentNote')
def student_note_added_handler(sender, instance, created, **kwargs):
    """Handle student note addition."""
    if created:
        logger.info(f"Student note added: {instance.note_title} for {instance.student.student_id}")
        
        # Send notification to student
        try:
            from notifications.models import Notification
            Notification.objects.create(
                user=instance.student.user,
                title='Note Added',
                message=f'A note has been added to your profile: {instance.note_title}',
                notification_type='info'
            )
        except Exception as e:
            logger.error(f"Error creating note notification: {e}")
        
        # Log note addition
        try:
            from analytics.models import AnalyticsMetric
            AnalyticsMetric.objects.create(
                metric_name='student_note_added',
                value=1,
                recorded_at=timezone.now(),
                description={
                    'student_id': instance.student.id,
                    'note_title': instance.note_title,
                    'note_type': instance.note_type,
                    'created_by': instance.created_by.id if instance.created_by else None
                }
            )
        except Exception as e:
            logger.error(f"Error logging note addition: {e}")


# Student progress monitoring
@receiver(post_save, sender='students.Student')
def student_progress_monitor(sender, instance, created, **kwargs):
    """Monitor student progress and send alerts."""
    if not created:
        try:
            # Check if student is at risk
            if instance.gpa < 2.0:
                try:
                    from notifications.models import Notification
                    Notification.objects.create(
                        user=instance.user,
                        title='Academic Risk Alert',
                        message=f'Your GPA is {instance.gpa}. You are at risk of academic probation. Please contact your advisor immediately.',
                        notification_type='error'
                    )
                except Exception as e:
                    logger.error(f"Error creating academic risk notification: {e}")
            
            # Check if student is on probation
            elif instance.gpa < 2.5:
                try:
                    from notifications.models import Notification
                    Notification.objects.create(
                        user=instance.user,
                        title='Academic Warning',
                        message=f'Your GPA is {instance.gpa}. Please improve your academic performance.',
                        notification_type='warning'
                    )
                except Exception as e:
                    logger.error(f"Error creating academic warning notification: {e}")
            
            # Check if student is excelling
            elif instance.gpa >= 3.5:
                try:
                    from notifications.models import Notification
                    Notification.objects.create(
                        user=instance.user,
                        title='Academic Excellence',
                        message=f'Congratulations! Your GPA is {instance.gpa}. Keep up the excellent work!',
                        notification_type='success'
                    )
                except Exception as e:
                    logger.error(f"Error creating excellence notification: {e}")
        
        except Exception as e:
            logger.error(f"Error in student progress monitor: {e}")


# Student graduation monitoring
@receiver(post_save, sender='students.Student')
def student_graduation_monitor(sender, instance, created, **kwargs):
    """Monitor student graduation status."""
    if not created and instance.graduation_year:
        from datetime import datetime
        
        current_year = datetime.now().year
        
        # Check if student is graduating this year
        if instance.graduation_year == current_year:
            try:
                from notifications.models import Notification
                Notification.objects.create(
                    user=instance.user,
                    title='Graduation Year',
                    message=f'This is your graduation year! Make sure you meet all requirements.',
                    notification_type='info'
                )
            except Exception as e:
                logger.error(f"Error creating graduation notification: {e}")
        
        # Check if student is graduating next year
        elif instance.graduation_year == current_year + 1:
            try:
                from notifications.models import Notification
                Notification.objects.create(
                    user=instance.user,
                    title='Graduation Preparation',
                    message=f'You are graduating next year. Start preparing for your final year!',
                    notification_type='info'
                )
            except Exception as e:
                logger.error(f"Error creating graduation preparation notification: {e}")


# Student data validation
@receiver(pre_save, sender='students.Student')
def student_data_validator(sender, instance, **kwargs):
    """Validate student data before saving."""
    try:
        # Validate GPA
        if instance.gpa and not (0.0 <= instance.gpa <= 4.0):
            raise ValueError("GPA must be between 0.0 and 4.0")
        
        # Validate student ID format
        if instance.student_id:
            if len(instance.student_id) < 3:
                raise ValueError("Student ID must be at least 3 characters long")
        
        # Validate graduation date
        if instance.graduation_date:
            from datetime import datetime
            current_year = datetime.now().year
            graduation_year = instance.graduation_date.year
            if graduation_year < current_year or graduation_year > current_year + 10:
                raise ValueError("Graduation year must be between current year and 10 years from now")
        
    except Exception as e:
        logger.error(f"Error in student data validator: {e}")
        raise


# Student cleanup
@receiver(post_delete, sender='students.Student')
def student_cleanup_handler(sender, instance, **kwargs):
    """Handle student cleanup after deletion."""
    try:
        # Clean up academic records
        from .models import StudentAcademicRecord
        StudentAcademicRecord.objects.filter(student=instance).delete()
        
        # Clean up skills
        from .models import StudentSkill
        StudentSkill.objects.filter(student=instance).delete()
        
        # Clean up achievements
        from .models import StudentAchievement
        StudentAchievement.objects.filter(student=instance).delete()
        
        # Clean up attendance records
        from .models import StudentAttendance
        StudentAttendance.objects.filter(student=instance).delete()
        
        # Clean up notes
        from .models import StudentNote
        StudentNote.objects.filter(student=instance).delete()
        
        logger.info(f"Student cleanup completed for: {instance.student_id}")
    except Exception as e:
        logger.error(f"Error in student cleanup: {e}")


# Student academic performance monitoring
@receiver(post_save, sender='students.StudentAcademicRecord')
def academic_performance_monitor(sender, instance, created, **kwargs):
    """Monitor academic performance and send alerts."""
    if created:
        try:
            # Check for failing grades
            if instance.grade == 'F':
                try:
                    from notifications.models import Notification
                    Notification.objects.create(
                        user=instance.student.user,
                        title='Failing Grade',
                        message=f'You received an F in {instance.course_name}. Please contact your advisor immediately.',
                        notification_type='error'
                    )
                except Exception as e:
                    logger.error(f"Error creating failing grade notification: {e}")
            
            # Check for low grades
            elif instance.grade in ['D+', 'D', 'D-']:
                try:
                    from notifications.models import Notification
                    Notification.objects.create(
                        user=instance.student.user,
                        title='Low Grade',
                        message=f'You received a {instance.grade} in {instance.course_name}. Please improve your performance.',
                        notification_type='warning'
                    )
                except Exception as e:
                    logger.error(f"Error creating low grade notification: {e}")
            
            # Check for excellent grades
            elif instance.grade in ['A+', 'A']:
                try:
                    from notifications.models import Notification
                    Notification.objects.create(
                        user=instance.student.user,
                        title='Excellent Grade',
                        message=f'Congratulations! You received an {instance.grade} in {instance.course_name}.',
                        notification_type='success'
                    )
                except Exception as e:
                    logger.error(f"Error creating excellent grade notification: {e}")
        
        except Exception as e:
            logger.error(f"Error in academic performance monitor: {e}")
