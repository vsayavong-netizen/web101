"""
Management command to seed the database with initial data.
Usage: python manage.py seed_data
"""

from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import date, timedelta
import random

from accounts.models import Profile
from students.models import Student, StudentAcademicRecord
from advisors.models import Advisor, AdvisorSpecialization
from majors.models import Major, MajorRequirement, MajorCurriculum
from classrooms.models import Classroom
from projects.models import ProjectGroup, Project, Milestone
from committees.models import Committee, CommitteeMember
from milestones.models import MilestoneTemplate
from scoring.models import ScoringRubric, ScoringRubricItem
from notifications.models import NotificationTemplate
from settings.models import AcademicYear, SystemSetting

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed the database with initial data for development and testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before seeding',
        )
        parser.add_argument(
            '--users',
            type=int,
            default=50,
            help='Number of users to create (default: 50)',
        )
        parser.add_argument(
            '--projects',
            type=int,
            default=20,
            help='Number of projects to create (default: 20)',
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('Starting database seeding...')
        )

        if options['clear']:
            self.clear_data()

        # Create academic year
        self.create_academic_year()
        
        # Create system settings
        self.create_system_settings()
        
        # Create majors
        self.create_majors()
        
        # Create users (students, advisors, admins)
        self.create_users(options['users'])
        
        # Create classrooms
        self.create_classrooms()
        
        # Create projects
        self.create_projects(options['projects'])
        
        # Create committees
        self.create_committees()
        
        # Create milestone templates
        self.create_milestone_templates()
        
        # Create scoring rubrics
        self.create_scoring_rubrics()
        
        # Create notification templates
        self.create_notification_templates()

        self.stdout.write(
            self.style.SUCCESS('Database seeding completed successfully!')
        )

    def clear_data(self):
        """Clear existing data."""
        self.stdout.write('Clearing existing data...')
        
        # Clear in reverse dependency order
        Project.objects.all().delete()
        ProjectGroup.objects.all().delete()
        CommitteeMember.objects.all().delete()
        Committee.objects.all().delete()
        Milestone.objects.all().delete()
        MilestoneTemplate.objects.all().delete()
        Student.objects.all().delete()
        Advisor.objects.all().delete()
        Classroom.objects.all().delete()
        MajorCurriculum.objects.all().delete()
        MajorRequirement.objects.all().delete()
        Major.objects.all().delete()
        Profile.objects.all().delete()
        User.objects.all().delete()
        AcademicYear.objects.all().delete()
        SystemSetting.objects.all().delete()

    def create_academic_year(self):
        """Create academic year."""
        self.stdout.write('Creating academic year...')
        
        academic_year, created = AcademicYear.objects.get_or_create(
            year='2024-2025',
            defaults={
                'start_date': date(2024, 8, 1),
                'end_date': date(2025, 7, 31),
                'is_current': True
            }
        )
        
        if created:
            self.stdout.write(f'  Created academic year: {academic_year.year}')

    def create_system_settings(self):
        """Create system settings."""
        self.stdout.write('Creating system settings...')
        
        settings_data = [
            ('site_name', 'Final Project Management System', 'Name of the system'),
            ('site_description', 'A comprehensive system for managing final projects', 'System description'),
            ('max_students_per_group', '4', 'Maximum students per project group'),
            ('min_students_per_group', '2', 'Minimum students per project group'),
            ('default_project_duration_days', '120', 'Default project duration in days'),
            ('notification_email_enabled', 'true', 'Enable email notifications'),
            ('ai_analysis_enabled', 'true', 'Enable AI analysis features'),
            ('backup_enabled', 'true', 'Enable automatic backups'),
        ]
        
        for key, value, description in settings_data:
            setting, created = SystemSetting.objects.get_or_create(
                key=key,
                defaults={
                    'value': value,
                    'description': description,
                    'is_public': True
                }
            )
            if created:
                self.stdout.write(f'  Created setting: {key}')

    def create_majors(self):
        """Create majors and related data."""
        self.stdout.write('Creating majors...')
        
        majors_data = [
            {
                'name': 'Computer Science',
                'abbreviation': 'CS',
                'description': 'Computer Science and Software Engineering',
                'degree_level': 'Bachelor',
                'duration_years': 4,
                'total_credits': 120,
                'department': 'Computer Science Department',
                'faculty': 'Faculty of Engineering',
                'head_of_department': 'Dr. John Smith',
                'office_location': 'Engineering Building, Room 201',
                'phone': '+1-555-0123',
                'email': 'cs@university.edu'
            },
            {
                'name': 'Information Technology',
                'abbreviation': 'IT',
                'description': 'Information Technology and Systems',
                'degree_level': 'Bachelor',
                'duration_years': 4,
                'total_credits': 120,
                'department': 'Information Technology Department',
                'faculty': 'Faculty of Engineering',
                'head_of_department': 'Dr. Jane Doe',
                'office_location': 'Engineering Building, Room 202',
                'phone': '+1-555-0124',
                'email': 'it@university.edu'
            },
            {
                'name': 'Data Science',
                'abbreviation': 'DS',
                'description': 'Data Science and Analytics',
                'degree_level': 'Master',
                'duration_years': 2,
                'total_credits': 60,
                'department': 'Data Science Department',
                'faculty': 'Faculty of Science',
                'head_of_department': 'Dr. Bob Johnson',
                'office_location': 'Science Building, Room 301',
                'phone': '+1-555-0125',
                'email': 'ds@university.edu'
            }
        ]
        
        for major_data in majors_data:
            major, created = Major.objects.get_or_create(
                abbreviation=major_data['abbreviation'],
                defaults=major_data
            )
            if created:
                self.stdout.write(f'  Created major: {major.name}')
                
                # Create requirements for this major
                self.create_major_requirements(major)
                
                # Create curriculum for this major
                self.create_major_curriculum(major)

    def create_major_requirements(self, major):
        """Create requirements for a major."""
        requirements_data = [
            ('prerequisite', 'High School Diploma or Equivalent', 0, True),
            ('core', 'Programming Fundamentals', 3, True),
            ('core', 'Data Structures and Algorithms', 3, True),
            ('core', 'Database Systems', 3, True),
            ('core', 'Software Engineering', 3, True),
            ('elective', 'Web Development', 3, False),
            ('elective', 'Mobile App Development', 3, False),
            ('elective', 'Machine Learning', 3, False),
        ]
        
        for req_type, description, credits, is_mandatory in requirements_data:
            MajorRequirement.objects.get_or_create(
                major=major,
                requirement_type=req_type,
                description=description,
                defaults={
                    'credits': credits,
                    'is_mandatory': is_mandatory
                }
            )

    def create_major_curriculum(self, major):
        """Create curriculum for a major."""
        curriculum_data = [
            ('2024-2025', 'Fall', 'CS101', 'Introduction to Programming', 3, True),
            ('2024-2025', 'Fall', 'CS102', 'Data Structures', 3, True),
            ('2024-2025', 'Spring', 'CS201', 'Algorithms', 3, True),
            ('2024-2025', 'Spring', 'CS202', 'Database Systems', 3, True),
            ('2024-2025', 'Fall', 'CS301', 'Software Engineering', 3, True),
            ('2024-2025', 'Spring', 'CS302', 'Web Development', 3, False),
            ('2024-2025', 'Fall', 'CS303', 'Mobile App Development', 3, False),
        ]
        
        for year, semester, code, name, credits, is_mandatory in curriculum_data:
            MajorCurriculum.objects.get_or_create(
                major=major,
                academic_year=year,
                semester=semester,
                course_code=code,
                defaults={
                    'course_name': name,
                    'credits': credits,
                    'is_mandatory': is_mandatory
                }
            )

    def create_users(self, num_users):
        """Create users (students, advisors, admins)."""
        self.stdout.write(f'Creating {num_users} users...')
        
        # Create admin user
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@university.edu',
                'first_name': 'System',
                'last_name': 'Administrator',
                'is_staff': True,
                'is_superuser': True
            }
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            Profile.objects.create(
                user=admin_user,
                role='admin',
                phone='+1-555-0000',
                address='University Administration Building'
            )
            self.stdout.write('  Created admin user')
        
        # Create advisor users
        advisors_data = [
            ('advisor1', 'Dr. Alice Johnson', 'alice@university.edu', 'Computer Science'),
            ('advisor2', 'Dr. Bob Smith', 'bob@university.edu', 'Information Technology'),
            ('advisor3', 'Dr. Carol Davis', 'carol@university.edu', 'Data Science'),
            ('advisor4', 'Dr. David Wilson', 'david@university.edu', 'Computer Science'),
            ('advisor5', 'Dr. Eve Brown', 'eve@university.edu', 'Information Technology'),
        ]
        
        for username, full_name, email, specialization in advisors_data:
            first_name, last_name = full_name.split(' ', 1)
            advisor_user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': email,
                    'first_name': first_name,
                    'last_name': last_name,
                    'is_staff': True
                }
            )
            if created:
                advisor_user.set_password('advisor123')
                advisor_user.save()
                
                profile = Profile.objects.create(
                    user=advisor_user,
                    role='advisor',
                    phone=f'+1-555-{random.randint(1000, 9999)}',
                    address='Faculty Office Building'
                )
                
                # Create advisor record
                advisor = Advisor.objects.create(
                    user=advisor_user,
                    employee_id=f'ADV{random.randint(1000, 9999)}',
                    department=specialization,
                    specialization=specialization,
                    max_students=10,
                    is_available=True
                )
                
                # Create specialization
                AdvisorSpecialization.objects.create(
                    advisor=advisor,
                    specialization=specialization,
                    proficiency_level='expert'
                )
                
                self.stdout.write(f'  Created advisor: {full_name}')
        
        # Create student users
        for i in range(1, num_users - len(advisors_data) - 1):  # -1 for admin
            student_id = f'STU{i:04d}'
            username = f'student{i}'
            first_name = random.choice(['John', 'Jane', 'Mike', 'Sarah', 'David', 'Lisa', 'Tom', 'Amy'])
            last_name = random.choice(['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'])
            email = f'{username}@university.edu'
            
            student_user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': email,
                    'first_name': first_name,
                    'last_name': last_name
                }
            )
            if created:
                student_user.set_password('student123')
                student_user.save()
                
                profile = Profile.objects.create(
                    user=student_user,
                    role='student',
                    phone=f'+1-555-{random.randint(1000, 9999)}',
                    address='Student Housing'
                )
                
                # Create student record
                major = random.choice(Major.objects.all())
                student = Student.objects.create(
                    user=student_user,
                    student_id=student_id,
                    major=major,
                    enrollment_year=2024,
                    expected_graduation_year=2028,
                    gpa=round(random.uniform(2.0, 4.0), 2),
                    is_active=True
                )
                
                # Create academic record
                StudentAcademicRecord.objects.create(
                    student=student,
                    semester='Fall 2024',
                    credits_completed=random.randint(0, 30),
                    gpa=round(random.uniform(2.0, 4.0), 2)
                )
                
                if i % 10 == 0:  # Progress indicator
                    self.stdout.write(f'  Created {i} students...')

    def create_classrooms(self):
        """Create classrooms."""
        self.stdout.write('Creating classrooms...')
        
        classroom_data = [
            ('CS Lab 1', 'Computer Science', '2024-2025', 'EN101', 30, 'Computers, Projector'),
            ('CS Lab 2', 'Computer Science', '2024-2025', 'EN102', 25, 'Computers, Whiteboard'),
            ('IT Lab 1', 'Information Technology', '2024-2025', 'EN201', 35, 'Computers, Network Equipment'),
            ('DS Lab 1', 'Data Science', '2024-2025', 'SC301', 20, 'Computers, Data Visualization Tools'),
            ('General Lab', 'Computer Science', '2024-2025', 'EN103', 40, 'Basic Equipment'),
        ]
        
        for name, major_name, year, room, capacity, equipment in classroom_data:
            try:
                major = Major.objects.get(name__icontains=major_name.split()[0])
                Classroom.objects.get_or_create(
                    name=name,
                    defaults={
                        'major': major,
                        'academic_year': year,
                        'room_number': room,
                        'capacity': capacity,
                        'equipment': equipment,
                        'is_active': True
                    }
                )
                self.stdout.write(f'  Created classroom: {name}')
            except Major.DoesNotExist:
                self.stdout.write(f'  Skipped classroom {name} - major not found')

    def create_projects(self, num_projects):
        """Create projects and project groups."""
        self.stdout.write(f'Creating {num_projects} projects...')
        
        project_titles = [
            'E-commerce Website Development',
            'Mobile Health Monitoring App',
            'AI-Powered Chatbot System',
            'Blockchain Voting System',
            'IoT Smart Home Controller',
            'Machine Learning Recommendation Engine',
            'Cloud-Based File Storage System',
            'Real-time Collaboration Platform',
            'Automated Testing Framework',
            'Data Analytics Dashboard',
            'Cybersecurity Monitoring Tool',
            'Virtual Reality Learning Environment',
            'Social Media Analytics Platform',
            'Smart City Traffic Management',
            'Online Learning Management System',
            'Digital Wallet Application',
            'Predictive Maintenance System',
            'Augmented Reality Shopping App',
            'Automated Code Review Tool',
            'Smart Agriculture Monitoring System'
        ]
        
        advisors = list(Advisor.objects.all())
        students = list(Student.objects.all())
        
        for i in range(num_projects):
            if not advisors or not students:
                break
                
            # Create project group
            project_id = f'PROJ{i+1:04d}'
            title = random.choice(project_titles)
            advisor = random.choice(advisors)
            
            project_group = ProjectGroup.objects.create(
                project_id=project_id,
                title=title,
                description=f'Final project: {title}',
                advisor=advisor,
                academic_year='2024-2025',
                start_date=date.today(),
                end_date=date.today() + timedelta(days=120),
                status='active'
            )
            
            # Create project
            project = Project.objects.create(
                project_group=project_group,
                title=title,
                description=f'Comprehensive final project focusing on {title.lower()}',
                status='in_progress',
                priority='medium'
            )
            
            # Assign students to project group (2-4 students)
            num_students = random.randint(2, 4)
            selected_students = random.sample(students, min(num_students, len(students)))
            
            for student in selected_students:
                project_group.students.add(student)
            
            if i % 5 == 0:  # Progress indicator
                self.stdout.write(f'  Created {i+1} projects...')

    def create_committees(self):
        """Create committees."""
        self.stdout.write('Creating committees...')
        
        committee_data = [
            ('Final Project Committee 1', 'Committee for evaluating final projects', 'active'),
            ('Final Project Committee 2', 'Secondary committee for project evaluation', 'active'),
            ('Thesis Defense Committee', 'Committee for thesis defense sessions', 'active'),
        ]
        
        advisors = list(Advisor.objects.all())
        
        for name, description, status in committee_data:
            committee = Committee.objects.create(
                name=name,
                description=description,
                status=status,
                academic_year='2024-2025'
            )
            
            # Add members to committee
            num_members = min(3, len(advisors))
            selected_advisors = random.sample(advisors, num_members)
            
            for i, advisor in enumerate(selected_advisors):
                role = 'chair' if i == 0 else 'member'
                CommitteeMember.objects.create(
                    committee=committee,
                    member=advisor.user,
                    role=role,
                    is_active=True
                )
            
            self.stdout.write(f'  Created committee: {name}')

    def create_milestone_templates(self):
        """Create milestone templates."""
        self.stdout.write('Creating milestone templates...')
        
        templates_data = [
            ('Project Proposal', 'Submit initial project proposal', 7, True),
            ('Literature Review', 'Complete literature review', 14, True),
            ('System Design', 'Submit system design document', 21, True),
            ('Implementation Phase 1', 'Complete first implementation phase', 30, True),
            ('Implementation Phase 2', 'Complete second implementation phase', 45, True),
            ('Testing and Debugging', 'Complete testing and debugging', 60, True),
            ('Documentation', 'Complete project documentation', 75, True),
            ('Final Presentation', 'Prepare and deliver final presentation', 90, True),
            ('Project Submission', 'Submit final project deliverables', 120, True),
        ]
        
        for name, description, duration_days, is_mandatory in templates_data:
            MilestoneTemplate.objects.get_or_create(
                name=name,
                defaults={
                    'description': description,
                    'duration_days': duration_days,
                    'is_mandatory': is_mandatory,
                    'order': duration_days // 15  # Order by duration
                }
            )
            self.stdout.write(f'  Created template: {name}')

    def create_scoring_rubrics(self):
        """Create scoring rubrics."""
        self.stdout.write('Creating scoring rubrics...')
        
        # Create main rubric
        rubric = ScoringRubric.objects.create(
            name='Final Project Evaluation Rubric',
            description='Comprehensive rubric for evaluating final projects',
            rubric_type='final_project',
            is_active=True
        )
        
        # Create rubric items
        rubric_items = [
            ('Technical Implementation', 'Quality of technical implementation', 30),
            ('Documentation', 'Quality and completeness of documentation', 20),
            ('Presentation', 'Quality of final presentation', 15),
            ('Innovation', 'Level of innovation and creativity', 15),
            ('Problem Solving', 'Effectiveness of problem-solving approach', 10),
            ('Teamwork', 'Quality of teamwork and collaboration', 10),
        ]
        
        for category, description, max_score in rubric_items:
            ScoringRubricItem.objects.create(
                rubric=rubric,
                category=category,
                description=description,
                max_score=max_score,
                order=len(ScoringRubricItem.objects.filter(rubric=rubric)) + 1
            )
        
        self.stdout.write(f'  Created rubric: {rubric.name}')

    def create_notification_templates(self):
        """Create notification templates."""
        self.stdout.write('Creating notification templates...')
        
        templates_data = [
            ('milestone_reminder', 'Milestone Reminder', 'Your milestone "{milestone_name}" is due on {due_date}'),
            ('project_deadline', 'Project Deadline', 'Your project "{project_title}" deadline is approaching'),
            ('advisor_feedback', 'Advisor Feedback', 'You have received feedback from your advisor'),
            ('committee_assignment', 'Committee Assignment', 'You have been assigned to a project committee'),
            ('system_announcement', 'System Announcement', 'Important system announcement: {message}'),
        ]
        
        for template_type, subject, body in templates_data:
            NotificationTemplate.objects.get_or_create(
                name=subject,
                defaults={
                    'template_type': template_type,
                    'subject': subject,
                    'body': body,
                    'is_active': True
                }
            )
            self.stdout.write(f'  Created template: {subject}')
