#!/usr/bin/env python
"""
Django management command to load mock data into the database
"""
import os
import sys
import django
from django.core.management import execute_from_command_line

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')
django.setup()

from django.contrib.auth.models import User
from accounts.models import User as CustomUser
from students.models import Student
from advisors.models import Advisor
from projects.models import ProjectGroup
from majors.models import Major
from classrooms.models import Classroom
from django.db import transaction
import json
from datetime import datetime

def create_mock_data():
    """Create mock data in the database"""
    
    with transaction.atomic():
        # Create Majors
        majors_data = [
            {'id': 'M01', 'name': 'Business Administration (IBM)', 'abbreviation': 'IBM'},
            {'id': 'M02', 'name': 'Business Administration (BM)', 'abbreviation': 'BM'},
            {'id': 'M03', 'name': 'Business Administration (Continuing) (BMC)', 'abbreviation': 'BMC'},
            {'id': 'M04', 'name': 'Marketing (MK)', 'abbreviation': 'MK'},
        ]
        
        for major_data in majors_data:
            major, created = Major.objects.get_or_create(
                id=major_data['id'],
                defaults={
                    'name': major_data['name'],
                    'abbreviation': major_data['abbreviation']
                }
            )
            print(f"Major {'created' if created else 'exists'}: {major.name}")
        
        # Create Classrooms
        classrooms_data = [
            {'id': 'C01', 'name': 'IBM-4A', 'major_id': 'M01'},
            {'id': 'C02', 'name': 'IBM-4B', 'major_id': 'M01'},
            {'id': 'C03', 'name': 'BM-4A', 'major_id': 'M02'},
            {'id': 'C04', 'name': 'BM-4B', 'major_id': 'M02'},
            {'id': 'C05', 'name': 'BMC-2A', 'major_id': 'M03'},
            {'id': 'C06', 'name': 'MK-4A', 'major_id': 'M04'},
            {'id': 'C07', 'name': 'MK-4B', 'major_id': 'M04'},
        ]
        
        for classroom_data in classrooms_data:
            major = Major.objects.get(id=classroom_data['major_id'])
            classroom, created = Classroom.objects.get_or_create(
                id=classroom_data['id'],
                defaults={
                    'name': classroom_data['name'],
                    'major': major
                }
            )
            print(f"Classroom {'created' if created else 'exists'}: {classroom.name}")
        
        # Create Advisors
        advisors_data = [
            {'name': 'Ms. Souphap', 'is_department_admin': True},
            {'name': 'Assoc. Prof. Phayvanh', 'is_department_admin': False},
            {'name': 'Ms. Phetsamone', 'is_department_admin': False},
            {'name': 'Ms. Bounmy', 'is_department_admin': False},
            {'name': 'Assoc. Prof. Phonesavanh', 'is_department_admin': False},
            {'name': 'Assoc. Prof. Bounmy', 'is_department_admin': False},
            {'name': 'Mr. Bounpheng', 'is_department_admin': False},
            {'name': 'Dr. Chanthone', 'is_department_admin': False},
            {'name': 'Ms. Sengdeuane', 'is_department_admin': False},
            {'name': 'Ms. Daovong', 'is_department_admin': False},
            {'name': 'Dr. Bounthavy', 'is_department_admin': False},
            {'name': 'Dr. Somphone', 'is_department_admin': False},
            {'name': 'Mr. Bounmy', 'is_department_admin': False},
            {'name': 'Prof. Phaythoune', 'is_department_admin': True},
            {'name': 'Dr. Malee', 'is_department_admin': False},
            {'name': 'Ms. Khammany', 'is_department_admin': False},
            {'name': 'Dr. Aloun', 'is_department_admin': False},
            {'name': 'Mr. Bounthavy', 'is_department_admin': False},
            {'name': 'Ms. Phayvanh', 'is_department_admin': False},
        ]
        
        for i, advisor_data in enumerate(advisors_data):
            # Create Django User first
            username = f"advisor{i+1:02d}"
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': f"{username}@university.edu",
                    'first_name': advisor_data['name'].split()[-1],
                    'last_name': ' '.join(advisor_data['name'].split()[:-1]),
                    'is_active': True
                }
            )
            
            # Create Custom User
            custom_user, created = CustomUser.objects.get_or_create(
                user=user,
                defaults={
                    'role': 'Advisor',
                    'is_active': True
                }
            )
            
            # Create Advisor
            advisor, created = Advisor.objects.get_or_create(
                user=custom_user,
                defaults={
                    'specialization': 'Business Administration',
                    'max_students': 4 if advisor_data['is_department_admin'] else 3,
                    'current_students': 0
                }
            )
            print(f"Advisor {'created' if created else 'exists'}: {advisor_data['name']}")
        
        # Create Students
        student_first_names = ['Thongchai', 'Soudalath', 'Ketsana', 'Bounthanh', 'Anousone', 'Vilayphone', 'Phonexay', 'Sompasong', 'Latsamy', 'Phouthone']
        student_surnames = ['Vongvilay', 'Phommasone', 'Inthavong', 'Sihalath', 'Chanthavong', 'Douangphachanh', 'Siphanthong', 'Phanthavong', 'Saysanavong', 'Keobounphanh']
        
        for i in range(20):  # Create 20 students
            first_name = student_first_names[i % len(student_first_names)]
            last_name = student_surnames[i % len(student_surnames)]
            username = f"student{i+1:03d}"
            
            # Create Django User
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': f"{username}@university.edu",
                    'first_name': first_name,
                    'last_name': last_name,
                    'is_active': True
                }
            )
            
            # Create Custom User
            custom_user, created = CustomUser.objects.get_or_create(
                user=user,
                defaults={
                    'role': 'Student',
                    'is_active': True
                }
            )
            
            # Get random classroom
            classroom = Classroom.objects.all()[i % Classroom.objects.count()]
            
            # Create Student
            student, created = Student.objects.get_or_create(
                user=custom_user,
                defaults={
                    'student_id': f"155N{1000 + i:04d}/21",
                    'major': classroom.major,
                    'classroom': classroom,
                    'gpa': 3.0 + (i % 20) * 0.1,
                    'academic_year': '2024',
                    'graduation_year': 2025,
                    'progress_percentage': 0
                }
            )
            print(f"Student {'created' if created else 'exists'}: {first_name} {last_name}")
        
        # Create Project Groups
        project_topics_lao = [
            'ການວິເຄາະຍຸດທະສາດຂອງຂະແໜງການຄ້າປອດແບບ SWOT',
            'ການພັດທະນາແຜນທຸລະກິດສໍາລັບອຸດສາຫະກໍາບໍລິການ',
            'ລະບົບ CRM ສໍາລັບທຸລະກິດສົ່ງອອກ',
            'ແຜງທຸລະກິດດິຈິຕອລສໍາລັບ Startup ເຕັກໂນໂລຢີ',
            'ການສຶກສາຄວາມເປັນໄປໄດ້ສໍາລັບອົງກອນສັງຄົມ',
        ]
        
        project_topics_eng = [
            'Strategic Analysis of the Retail Sector using SWOT Analysis',
            'Business Plan Development for the Hospitality Industry with a focus on Social Media',
            'CRM System for an Export Business leveraging E-commerce',
            'Digital Marketing Platform for a Tech Startup based on the BCG Matrix',
            'Feasibility Study for a Social Enterprise targeting Millennial Consumers',
        ]
        
        students = Student.objects.all()
        advisors = Advisor.objects.all()
        
        for i in range(10):  # Create 10 project groups
            student = students[i % students.count()]
            advisor = advisors[i % advisors.count()]
            
            # Create ProjectGroup
            project_group, created = ProjectGroup.objects.get_or_create(
                project_id=f"PG{i+1:03d}",
                defaults={
                    'topic_lao': project_topics_lao[i % len(project_topics_lao)],
                    'topic_eng': project_topics_eng[i % len(project_topics_eng)],
                    'advisor_name': advisor.user.user.get_full_name(),
                    'status': 'Approved',
                    'comment': f'Final project for {student.user.user.first_name} {student.user.user.last_name}',
                }
            )
            
            print(f"Project Group {'created' if created else 'exists'}: {project_group.topic_eng}")
        
        print("\n✅ Mock data loaded successfully!")
        print(f"Created {Major.objects.count()} majors")
        print(f"Created {Classroom.objects.count()} classrooms")
        print(f"Created {Advisor.objects.count()} advisors")
        print(f"Created {Student.objects.count()} students")
        print(f"Created {ProjectGroup.objects.count()} project groups")

if __name__ == '__main__':
    create_mock_data()
