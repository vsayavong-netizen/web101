"""
Student-specific utility functions and helper classes.
"""

import logging
from typing import Dict, List, Optional, Any
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Q, Count, Avg, Sum
from datetime import timedelta

User = get_user_model()
logger = logging.getLogger(__name__)


class StudentUtils:
    """Utility class for student operations."""
    
    @staticmethod
    def create_student(
        user: User,
        student_id: str,
        major: str = '',
        gpa: float = 0.0,
        academic_year: str = '',
        graduation_year: int = None,
        **kwargs
    ) -> Optional[Any]:
        """Create a new student."""
        try:
            from .models import Student
            
            student = Student.objects.create(
                user=user,
                student_id=student_id,
                major=major,
                gpa=gpa,
                academic_year=academic_year,
                graduation_year=graduation_year,
                **kwargs
            )
            logger.info(f"Student created: {student.student_id}")
            return student
        except Exception as e:
            logger.error(f"Error creating student: {e}")
            return None
    
    @staticmethod
    def get_student_by_id(student_id: str) -> Optional[Any]:
        """Get student by student ID."""
        try:
            from .models import Student
            return Student.objects.get(student_id=student_id)
        except Student.DoesNotExist:
            return None
    
    @staticmethod
    def get_student_by_user(user: User) -> Optional[Any]:
        """Get student by user."""
        try:
            from .models import Student
            return Student.objects.get(user=user)
        except Student.DoesNotExist:
            return None
    
    @staticmethod
    def search_students(
        query: str = None,
        major: str = None,
        academic_year: str = None,
        gpa_min: float = None,
        gpa_max: float = None
    ) -> List[Any]:
        """Search students with filters."""
        try:
            from .models import Student
            
            students = Student.objects.all()
            
            if query:
                students = students.filter(
                    Q(user__first_name__icontains=query) |
                    Q(user__last_name__icontains=query) |
                    Q(user__email__icontains=query) |
                    Q(student_id__icontains=query)
                )
            
            if major:
                students = students.filter(major=major)
            
            if academic_year:
                students = students.filter(academic_year=academic_year)
            
            if gpa_min is not None:
                students = students.filter(gpa__gte=gpa_min)
            
            if gpa_max is not None:
                students = students.filter(gpa__lte=gpa_max)
            
            return students
        except Exception as e:
            logger.error(f"Error searching students: {e}")
            return []
    
    @staticmethod
    def get_students_by_major(major: str) -> List[Any]:
        """Get students by major."""
        try:
            from .models import Student
            return Student.objects.filter(major=major)
        except Exception as e:
            logger.error(f"Error getting students by major: {e}")
            return []
    
    @staticmethod
    def get_students_by_academic_year(academic_year: str) -> List[Any]:
        """Get students by academic year."""
        try:
            from .models import Student
            return Student.objects.filter(academic_year=academic_year)
        except Exception as e:
            logger.error(f"Error getting students by academic year: {e}")
            return []
    
    @staticmethod
    def update_student_gpa(student: Any, new_gpa: float) -> bool:
        """Update student GPA."""
        try:
            student.gpa = new_gpa
            student.save()
            logger.info(f"Student GPA updated: {student.student_id} -> {new_gpa}")
            return True
        except Exception as e:
            logger.error(f"Error updating student GPA: {e}")
            return False


class StudentAcademicUtils:
    """Utility class for student academic operations."""
    
    @staticmethod
    def add_academic_record(
        student: Any,
        course_name: str,
        course_code: str,
        credits: int,
        grade: str,
        semester: str,
        academic_year: str
    ) -> Optional[Any]:
        """Add academic record for student."""
        try:
            from .models import StudentAcademicRecord
            
            record = StudentAcademicRecord.objects.create(
                student=student,
                course_name=course_name,
                course_code=course_code,
                credits=credits,
                grade=grade,
                semester=semester,
                academic_year=academic_year
            )
            
            logger.info(f"Academic record added for student {student.student_id}")
            return record
        except Exception as e:
            logger.error(f"Error adding academic record: {e}")
            return None
    
    @staticmethod
    def get_student_academic_records(student: Any) -> List[Any]:
        """Get academic records for student."""
        try:
            from .models import StudentAcademicRecord
            return StudentAcademicRecord.objects.filter(student=student).order_by('-academic_year', '-semester')
        except Exception as e:
            logger.error(f"Error getting academic records: {e}")
            return []
    
    @staticmethod
    def calculate_student_gpa(student: Any) -> float:
        """Calculate student GPA from academic records."""
        try:
            from .models import StudentAcademicRecord
            
            records = StudentAcademicRecord.objects.filter(student=student)
            if not records.exists():
                return 0.0
            
            # Grade point mapping
            grade_points = {
                'A+': 4.0, 'A': 4.0, 'A-': 3.7,
                'B+': 3.3, 'B': 3.0, 'B-': 2.7,
                'C+': 2.3, 'C': 2.0, 'C-': 1.7,
                'D+': 1.3, 'D': 1.0, 'D-': 0.7,
                'F': 0.0
            }
            
            total_points = 0
            total_credits = 0
            
            for record in records:
                if record.grade in grade_points:
                    total_points += grade_points[record.grade] * record.credits
                    total_credits += record.credits
            
            return round(total_points / total_credits, 2) if total_credits > 0 else 0.0
        except Exception as e:
            logger.error(f"Error calculating student GPA: {e}")
            return 0.0
    
    @staticmethod
    def get_student_credits(student: Any) -> Dict[str, int]:
        """Get student credit information."""
        try:
            from .models import StudentAcademicRecord
            
            records = StudentAcademicRecord.objects.filter(student=student)
            
            total_credits = records.aggregate(total=Sum('credits'))['total'] or 0
            completed_credits = records.filter(grade__in=['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-']).aggregate(total=Sum('credits'))['total'] or 0
            
            return {
                'total_credits': total_credits,
                'completed_credits': completed_credits,
                'remaining_credits': max(0, 120 - completed_credits)  # Assuming 120 credits for graduation
            }
        except Exception as e:
            logger.error(f"Error getting student credits: {e}")
            return {}


class StudentSkillUtils:
    """Utility class for student skill operations."""
    
    @staticmethod
    def add_student_skill(
        student: Any,
        skill_name: str,
        skill_level: str,
        description: str = ''
    ) -> Optional[Any]:
        """Add skill to student."""
        try:
            from .models import StudentSkill
            
            skill = StudentSkill.objects.create(
                student=student,
                skill_name=skill_name,
                skill_level=skill_level,
                description=description
            )
            
            logger.info(f"Skill added to student {student.student_id}: {skill_name}")
            return skill
        except Exception as e:
            logger.error(f"Error adding student skill: {e}")
            return None
    
    @staticmethod
    def get_student_skills(student: Any) -> List[Any]:
        """Get skills for student."""
        try:
            from .models import StudentSkill
            return StudentSkill.objects.filter(student=student).order_by('-created_at')
        except Exception as e:
            logger.error(f"Error getting student skills: {e}")
            return []
    
    @staticmethod
    def update_skill_level(skill: Any, new_level: str) -> bool:
        """Update skill level."""
        try:
            skill.skill_level = new_level
            skill.save()
            logger.info(f"Skill level updated: {skill.skill_name} -> {new_level}")
            return True
        except Exception as e:
            logger.error(f"Error updating skill level: {e}")
            return False


class StudentAchievementUtils:
    """Utility class for student achievement operations."""
    
    @staticmethod
    def add_student_achievement(
        student: Any,
        achievement_name: str,
        achievement_type: str,
        description: str = '',
        date_achieved: str = None
    ) -> Optional[Any]:
        """Add achievement to student."""
        try:
            from .models import StudentAchievement
            
            achievement = StudentAchievement.objects.create(
                student=student,
                achievement_name=achievement_name,
                achievement_type=achievement_type,
                description=description,
                date_achieved=date_achieved
            )
            
            logger.info(f"Achievement added to student {student.student_id}: {achievement_name}")
            return achievement
        except Exception as e:
            logger.error(f"Error adding student achievement: {e}")
            return None
    
    @staticmethod
    def get_student_achievements(student: Any) -> List[Any]:
        """Get achievements for student."""
        try:
            from .models import StudentAchievement
            return StudentAchievement.objects.filter(student=student).order_by('-date_achieved')
        except Exception as e:
            logger.error(f"Error getting student achievements: {e}")
            return []


class StudentAttendanceUtils:
    """Utility class for student attendance operations."""
    
    @staticmethod
    def mark_attendance(
        student: Any,
        date: str,
        status: str,
        notes: str = ''
    ) -> Optional[Any]:
        """Mark student attendance."""
        try:
            from .models import StudentAttendance
            
            attendance = StudentAttendance.objects.create(
                student=student,
                date=date,
                status=status,
                notes=notes
            )
            
            logger.info(f"Attendance marked for student {student.student_id}: {date} - {status}")
            return attendance
        except Exception as e:
            logger.error(f"Error marking attendance: {e}")
            return None
    
    @staticmethod
    def get_student_attendance(student: Any, start_date: str = None, end_date: str = None) -> List[Any]:
        """Get student attendance records."""
        try:
            from .models import StudentAttendance
            
            attendance = StudentAttendance.objects.filter(student=student)
            
            if start_date:
                attendance = attendance.filter(date__gte=start_date)
            
            if end_date:
                attendance = attendance.filter(date__lte=end_date)
            
            return attendance.order_by('-date')
        except Exception as e:
            logger.error(f"Error getting student attendance: {e}")
            return []
    
    @staticmethod
    def calculate_attendance_rate(student: Any, start_date: str = None, end_date: str = None) -> float:
        """Calculate student attendance rate."""
        try:
            from .models import StudentAttendance
            
            attendance = StudentAttendance.objects.filter(student=student)
            
            if start_date:
                attendance = attendance.filter(date__gte=start_date)
            
            if end_date:
                attendance = attendance.filter(date__lte=end_date)
            
            total_records = attendance.count()
            if total_records == 0:
                return 0.0
            
            present_records = attendance.filter(status='present').count()
            return round((present_records / total_records) * 100, 2)
        except Exception as e:
            logger.error(f"Error calculating attendance rate: {e}")
            return 0.0


class StudentNoteUtils:
    """Utility class for student note operations."""
    
    @staticmethod
    def add_student_note(
        student: Any,
        note_title: str,
        note_content: str,
        note_type: str = 'general',
        created_by: User = None
    ) -> Optional[Any]:
        """Add note to student."""
        try:
            from .models import StudentNote
            
            note = StudentNote.objects.create(
                student=student,
                note_title=note_title,
                note_content=note_content,
                note_type=note_type,
                created_by=created_by
            )
            
            logger.info(f"Note added to student {student.student_id}: {note_title}")
            return note
        except Exception as e:
            logger.error(f"Error adding student note: {e}")
            return None
    
    @staticmethod
    def get_student_notes(student: Any, note_type: str = None) -> List[Any]:
        """Get notes for student."""
        try:
            from .models import StudentNote
            
            notes = StudentNote.objects.filter(student=student)
            
            if note_type:
                notes = notes.filter(note_type=note_type)
            
            return notes.order_by('-created_at')
        except Exception as e:
            logger.error(f"Error getting student notes: {e}")
            return []


class StudentStatisticsUtils:
    """Utility class for student statistics."""
    
    @staticmethod
    def get_student_statistics() -> Dict[str, Any]:
        """Get student statistics."""
        try:
            from .models import Student
            
            total_students = Student.objects.count()
            
            # Students by major
            students_by_major = {}
            majors = Student.objects.values_list('major', flat=True).distinct()
            for major in majors:
                if major:  # Skip empty majors
                    students_by_major[major] = Student.objects.filter(major=major).count()
            
            # Students by academic year
            students_by_academic_year = {}
            academic_years = Student.objects.values_list('academic_year', flat=True).distinct()
            for year in academic_years:
                if year:  # Skip empty years
                    students_by_academic_year[year] = Student.objects.filter(academic_year=year).count()
            
            # GPA statistics
            gpa_stats = Student.objects.aggregate(
                avg_gpa=Avg('gpa'),
                max_gpa=models.Max('gpa'),
                min_gpa=models.Min('gpa')
            )
            
            # Students by GPA range
            gpa_ranges = {
                '3.5-4.0': Student.objects.filter(gpa__gte=3.5).count(),
                '3.0-3.4': Student.objects.filter(gpa__gte=3.0, gpa__lt=3.5).count(),
                '2.5-2.9': Student.objects.filter(gpa__gte=2.5, gpa__lt=3.0).count(),
                '2.0-2.4': Student.objects.filter(gpa__gte=2.0, gpa__lt=2.5).count(),
                'Below 2.0': Student.objects.filter(gpa__lt=2.0).count()
            }
            
            return {
                'total_students': total_students,
                'students_by_major': students_by_major,
                'students_by_academic_year': students_by_academic_year,
                'gpa_statistics': gpa_stats,
                'gpa_ranges': gpa_ranges
            }
        except Exception as e:
            logger.error(f"Error getting student statistics: {e}")
            return {}
    
    @staticmethod
    def get_student_progress(student: Any) -> Dict[str, Any]:
        """Get student progress information."""
        try:
            # Get academic records
            academic_records = StudentAcademicUtils.get_student_academic_records(student)
            
            # Get skills
            skills = StudentSkillUtils.get_student_skills(student)
            
            # Get achievements
            achievements = StudentAchievementUtils.get_student_achievements(student)
            
            # Get attendance
            attendance = StudentAttendanceUtils.get_student_attendance(student)
            attendance_rate = StudentAttendanceUtils.calculate_attendance_rate(student)
            
            # Calculate progress metrics
            total_courses = academic_records.count()
            completed_courses = academic_records.filter(grade__in=['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-']).count()
            
            return {
                'gpa': student.gpa,
                'total_courses': total_courses,
                'completed_courses': completed_courses,
                'skills_count': skills.count(),
                'achievements_count': achievements.count(),
                'attendance_rate': attendance_rate,
                'academic_year': student.academic_year,
                'graduation_year': student.graduation_year
            }
        except Exception as e:
            logger.error(f"Error getting student progress: {e}")
            return {}
