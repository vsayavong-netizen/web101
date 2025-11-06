#!/usr/bin/env python
"""
Script to create initial data for the system
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')
django.setup()

from accounts.models import User
from majors.models import Major
from classrooms.models import Classroom
from students.models import Student
from advisors.models import Advisor

def create_initial_data():
    print("Creating initial data...")
    
    # Create Majors
    print("\n1. Creating Majors...")
    majors_data = [
        {'name': 'Business Administration (IBM)', 'abbreviation': 'IBM'},
        {'name': 'Business Administration (BM)', 'abbreviation': 'BM'},
        {'name': 'Business Administration (Continuing) (BMC)', 'abbreviation': 'BMC'},
        {'name': 'Marketing (MK)', 'abbreviation': 'MK'},
    ]
    
    created_majors = {}
    for major_data in majors_data:
        major, created = Major.objects.get_or_create(
            abbreviation=major_data['abbreviation'],
            defaults=major_data
        )
        created_majors[major_data['abbreviation']] = major
        if created:
            print(f"   Created major: {major.name}")
        else:
            print(f"   Major already exists: {major.name}")
    
    # Create Classrooms
    print("\n2. Creating Classrooms...")
    classrooms_data = [
        {'name': 'IBM-4A', 'major_abbr': 'IBM'},
        {'name': 'IBM-4B', 'major_abbr': 'IBM'},
        {'name': 'BM-4A', 'major_abbr': 'BM'},
        {'name': 'BM-4B', 'major_abbr': 'BM'},
        {'name': 'BMC-2A', 'major_abbr': 'BMC'},
        {'name': 'MK-4A', 'major_abbr': 'MK'},
        {'name': 'MK-4B', 'major_abbr': 'MK'},
    ]
    
    for classroom_data in classrooms_data:
        major = created_majors.get(classroom_data['major_abbr'])
        if major:
            classroom, created = Classroom.objects.get_or_create(
                name=classroom_data['name'],
                academic_year='2024',
                semester='1',
                defaults={
                    'major': major,
                    'capacity': 30,
                    'is_active': True
                }
            )
            if created:
                print(f"   Created classroom: {classroom.name}")
            else:
                print(f"   Classroom already exists: {classroom.name}")
    
    # Create Advisor Users
    print("\n3. Creating Advisors...")
    advisors_data = [
        {'username': 'souphap', 'name': 'Ms. Souphap', 'email': 'souphap@university.edu', 'is_dept_admin': True},
        {'username': 'phayvanh', 'name': 'Assoc. Prof. Phayvanh', 'email': 'phayvanh@university.edu', 'is_dept_admin': False},
        {'username': 'phetsamone', 'name': 'Ms. Phetsamone', 'email': 'phetsamone@university.edu', 'is_dept_admin': False},
    ]
    
    for adv_data in advisors_data:
        name_parts = adv_data['name'].split()
        first_name = name_parts[0] if len(name_parts) > 0 else adv_data['name']
        last_name = ' '.join(name_parts[1:]) if len(name_parts) > 1 else ''
        
        user, created = User.objects.get_or_create(
            username=adv_data['username'],
            defaults={
                'email': adv_data['email'],
                'first_name': first_name,
                'last_name': last_name,
                'role': 'DepartmentAdmin' if adv_data['is_dept_admin'] else 'Advisor',
                'is_staff': True,
                'is_active': True
            }
        )
        if created:
            user.set_password('password123')
            user.save()
            print(f"   Created advisor user: {adv_data['name']}")
        else:
            print(f"   Advisor user already exists: {adv_data['name']}")
        
        # Create Advisor record
        advisor, adv_created = Advisor.objects.get_or_create(
            user=user,
            defaults={
                'advisor_id': f'ADV{adv_data["username"].upper()}',
                'employee_id': f'EMP{adv_data["username"].upper()}',
                'max_students': 10,
                'quota': 10,
                'is_active': True,
                'is_department_admin': adv_data['is_dept_admin']
            }
        )
        if adv_created:
            print(f"   Created advisor record: {adv_data['name']}")
    
    # Create Sample Students
    print("\n4. Creating Sample Students...")
    students_data = [
        {'student_id': '155N1001/21', 'name': 'Thongchai Vongvilay', 'major': 'IBM', 'classroom': 'IBM-4A', 'email': 'student1@university.edu'},
        {'student_id': '155N1002/21', 'name': 'Soudalath Phommasone', 'major': 'IBM', 'classroom': 'IBM-4A', 'email': 'student2@university.edu'},
        {'student_id': '155N1003/21', 'name': 'Ketsana Inthavong', 'major': 'IBM', 'classroom': 'IBM-4B', 'email': 'student3@university.edu'},
        {'student_id': '155N1004/21', 'name': 'Bounthanh Chanthavong', 'major': 'BM', 'classroom': 'BM-4A', 'email': 'student4@university.edu'},
        {'student_id': '155N1005/21', 'name': 'Anousone Douangphachanh', 'major': 'BM', 'classroom': 'BM-4B', 'email': 'student5@university.edu'},
        {'student_id': '155N1006/21', 'name': 'Vilayphone Siphanthong', 'major': 'BMC', 'classroom': 'BMC-2A', 'email': 'student6@university.edu'},
        {'student_id': '155N1007/21', 'name': 'Phonexay Phanthavong', 'major': 'MK', 'classroom': 'MK-4A', 'email': 'student7@university.edu'},
        {'student_id': '155N1008/21', 'name': 'Sompasong Saysanavong', 'major': 'MK', 'classroom': 'MK-4B', 'email': 'student8@university.edu'},
    ]
    
    for std_data in students_data:
        name_parts = std_data['name'].split()
        first_name = name_parts[0] if len(name_parts) > 0 else std_data['name']
        last_name = ' '.join(name_parts[1:]) if len(name_parts) > 1 else ''
        username = std_data['student_id'].lower().replace('/', '_')
        
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'email': std_data['email'],
                'first_name': first_name,
                'last_name': last_name,
                'role': 'Student',
                'is_active': True
            }
        )
        if created:
            user.set_password('password123')
            user.save()
            print(f"   Created student user: {std_data['name']}")
        else:
            print(f"   Student user already exists: {std_data['name']}")
        
        # Get major name
        try:
            major = Major.objects.get(abbreviation=std_data['major'])
            major_name = major.name
        except Major.DoesNotExist:
            major_name = std_data['major']
        
        # Create Student record
        student, std_created = Student.objects.get_or_create(
            user=user,
            defaults={
                'student_id': std_data['student_id'],
                'major': major_name,
                'classroom': std_data['classroom'],
                'enrollment_year': 2021,
                'expected_graduation_year': 2025,
                'is_active': True
            }
        )
        if std_created:
            print(f"   Created student record: {std_data['student_id']}")
    
    # Create Sample Projects
    print("\n5. Creating Sample Projects...")
    from projects.models import Project, ProjectGroup, ProjectStudent
    from datetime import date
    
    projects_data = [
        {
            'project_id': '2024-2025-P001',
            'topic_lao': 'ການພັດທະນາລະບົບຈັດການຂໍ້ມູນສໍາລັບບໍລິສັດນ້ອຍ',
            'topic_eng': 'Development of Information Management System for Small Businesses',
            'advisor_username': 'souphap',
            'student_ids': ['155N1001/21', '155N1002/21'],
            'status': 'Pending'
        },
        {
            'project_id': '2024-2025-P002',
            'topic_lao': 'ການວິເຄາະການຕັດສິນໃຈຊື້ສິນຄ້າອອນລາຍ',
            'topic_eng': 'Analysis of Online Shopping Decision Making',
            'advisor_username': 'phayvanh',
            'student_ids': ['155N1003/21'],
            'status': 'Approved'
        },
        {
            'project_id': '2024-2025-P003',
            'topic_lao': 'ການສ້າງແອັບພລິເຄຊັນສໍາລັບການຈັດການສິນຄ້າ',
            'topic_eng': 'Mobile Application for Inventory Management',
            'advisor_username': 'phetsamone',
            'student_ids': ['155N1004/21', '155N1005/21'],
            'status': 'Pending'
        },
    ]
    
    for proj_data in projects_data:
        try:
            # Get advisor
            advisor_user = User.objects.get(username=proj_data['advisor_username'])
            advisor = Advisor.objects.get(user=advisor_user)
            
            # Create Project
            project, proj_created = Project.objects.get_or_create(
                project_id=proj_data['project_id'],
                defaults={
                    'title': proj_data['topic_eng'],
                    'description': f"Project: {proj_data['topic_eng']}",
                    'status': proj_data['status'],
                    'advisor': advisor
                }
            )
            
            if proj_created:
                print(f"   Created project: {proj_data['project_id']}")
            
            # Create ProjectGroup
            project_group, pg_created = ProjectGroup.objects.get_or_create(
                project_id=proj_data['project_id'],
                defaults={
                    'topic_lao': proj_data['topic_lao'],
                    'topic_eng': proj_data['topic_eng'],
                    'advisor_name': advisor_user.get_full_name(),
                    'status': proj_data['status']
                }
            )
            
            if pg_created:
                print(f"   Created project group: {proj_data['project_id']}")
            
            # Link students to project
            for student_id in proj_data['student_ids']:
                try:
                    student = Student.objects.get(student_id=student_id)
                    project_student, ps_created = ProjectStudent.objects.get_or_create(
                        project_group=project_group,
                        student=student.user,
                        defaults={'is_primary': proj_data['student_ids'].index(student_id) == 0}
                    )
                    if ps_created:
                        print(f"   Linked student {student_id} to project {proj_data['project_id']}")
                except Student.DoesNotExist:
                    print(f"   Student {student_id} not found for project {proj_data['project_id']}")
        
        except Exception as e:
            print(f"   Error creating project {proj_data['project_id']}: {e}")
    
    print("\n[SUCCESS] Initial data creation completed!")
    print("\nSummary:")
    print(f"   Majors: {Major.objects.count()}")
    print(f"   Classrooms: {Classroom.objects.count()}")
    print(f"   Users: {User.objects.count()}")
    print(f"   Students: {Student.objects.count()}")
    print(f"   Advisors: {Advisor.objects.count()}")
    print(f"   Projects: {Project.objects.count()}")
    print(f"   Project Groups: {ProjectGroup.objects.count()}")

if __name__ == '__main__':
    create_initial_data()

