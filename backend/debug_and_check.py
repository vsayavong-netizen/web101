#!/usr/bin/env python
"""
Script to debug and check system issues
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
from projects.models import Project, ProjectGroup
from django.db import connection

def check_database_connection():
    """Check database connection"""
    print("=" * 60)
    print("1. Checking Database Connection...")
    print("=" * 60)
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            if result:
                print("[OK] Database connection: OK")
                return True
    except Exception as e:
        print(f"[ERROR] Database connection failed: {e}")
        return False

def check_models():
    """Check all models for data integrity"""
    print("\n" + "=" * 60)
    print("2. Checking Models...")
    print("=" * 60)
    
    issues = []
    
    # Check Users
    try:
        user_count = User.objects.count()
        print(f"[OK] Users: {user_count}")
        
        # Check for users without roles
        users_without_role = User.objects.filter(role__isnull=True).count()
        if users_without_role > 0:
            issues.append(f"[WARNING] Found {users_without_role} users without role")
    except Exception as e:
        issues.append(f"[ERROR] Error checking Users: {e}")
    
    # Check Majors
    try:
        major_count = Major.objects.count()
        print(f"[OK] Majors: {major_count}")
    except Exception as e:
        issues.append(f"[ERROR] Error checking Majors: {e}")
    
    # Check Students
    try:
        student_count = Student.objects.count()
        print(f"[OK] Students: {student_count}")
        
        # Check for students without users
        students_without_user = Student.objects.filter(user__isnull=True).count()
        if students_without_user > 0:
            issues.append(f"[WARNING] Found {students_without_user} students without user")
    except Exception as e:
        issues.append(f"[ERROR] Error checking Students: {e}")
    
    # Check Advisors
    try:
        advisor_count = Advisor.objects.count()
        print(f"[OK] Advisors: {advisor_count}")
        
        # Check for advisors without users
        advisors_without_user = Advisor.objects.filter(user__isnull=True).count()
        if advisors_without_user > 0:
            issues.append(f"[WARNING] Found {advisors_without_user} advisors without user")
    except Exception as e:
        issues.append(f"[ERROR] Error checking Advisors: {e}")
    
    # Check Projects
    try:
        project_count = Project.objects.count()
        print(f"[OK] Projects: {project_count}")
        
        project_group_count = ProjectGroup.objects.count()
        print(f"[OK] Project Groups: {project_group_count}")
    except Exception as e:
        issues.append(f"[ERROR] Error checking Projects: {e}")
    
    # Check Classrooms
    try:
        classroom_count = Classroom.objects.count()
        print(f"[OK] Classrooms: {classroom_count}")
    except Exception as e:
        issues.append(f"[ERROR] Error checking Classrooms: {e}")
    
    if issues:
        print("\n[WARNING] Issues Found:")
        for issue in issues:
            print(f"   {issue}")
    else:
        print("\n[OK] No issues found!")
    
    return len(issues) == 0

def check_relationships():
    """Check model relationships"""
    print("\n" + "=" * 60)
    print("3. Checking Relationships...")
    print("=" * 60)
    
    issues = []
    
    # Check Student-User relationships
    try:
        students = Student.objects.all()
        for student in students:
            if not student.user:
                issues.append(f"[WARNING] Student {student.student_id} has no user")
            elif not student.user.is_active:
                issues.append(f"[WARNING] Student {student.student_id} has inactive user")
    except Exception as e:
        issues.append(f"[ERROR] Error checking Student-User relationships: {e}")
    
    # Check Advisor-User relationships
    try:
        advisors = Advisor.objects.all()
        for advisor in advisors:
            if not advisor.user:
                issues.append(f"[WARNING] Advisor {advisor.advisor_id} has no user")
            elif not advisor.user.is_active:
                issues.append(f"[WARNING] Advisor {advisor.advisor_id} has inactive user")
    except Exception as e:
        issues.append(f"[ERROR] Error checking Advisor-User relationships: {e}")
    
    # Check Project-Advisor relationships
    try:
        projects = Project.objects.all()
        for project in projects:
            if not project.advisor:
                issues.append(f"[WARNING] Project {project.project_id} has no advisor")
    except Exception as e:
        issues.append(f"[ERROR] Error checking Project-Advisor relationships: {e}")
    
    if issues:
        print("[WARNING] Relationship Issues Found:")
        for issue in issues:
            print(f"   {issue}")
    else:
        print("[OK] All relationships are valid!")
    
    return len(issues) == 0

def check_duplicates():
    """Check for duplicate data"""
    print("\n" + "=" * 60)
    print("4. Checking for Duplicates...")
    print("=" * 60)
    
    issues = []
    
    # Check duplicate student IDs
    try:
        from django.db.models import Count
        duplicate_students = Student.objects.values('student_id').annotate(
            count=Count('student_id')
        ).filter(count__gt=1)
        
        if duplicate_students:
            for dup in duplicate_students:
                issues.append(f"[WARNING] Duplicate student_id: {dup['student_id']}")
    except Exception as e:
        issues.append(f"[ERROR] Error checking duplicate students: {e}")
    
    # Check duplicate usernames
    try:
        duplicate_users = User.objects.values('username').annotate(
            count=Count('username')
        ).filter(count__gt=1)
        
        if duplicate_users:
            for dup in duplicate_users:
                issues.append(f"[WARNING] Duplicate username: {dup['username']}")
    except Exception as e:
        issues.append(f"[ERROR] Error checking duplicate users: {e}")
    
    if issues:
        print("[WARNING] Duplicates Found:")
        for issue in issues:
            print(f"   {issue}")
    else:
        print("[OK] No duplicates found!")
    
    return len(issues) == 0

def check_settings():
    """Check Django settings"""
    print("\n" + "=" * 60)
    print("5. Checking Settings...")
    print("=" * 60)
    
    from django.conf import settings
    
    checks = [
        ("DEBUG", settings.DEBUG, "Should be True in development"),
        ("ALLOWED_HOSTS", settings.ALLOWED_HOSTS, "Should include localhost"),
        ("DATABASES", settings.DATABASES['default']['ENGINE'], "Should be configured"),
    ]
    
    for name, value, note in checks:
        print(f"[OK] {name}: {value} ({note})")
    
    return True

def main():
    """Main debug function"""
    print("\n" + "=" * 60)
    print("BM23 System Debug & Check")
    print("=" * 60 + "\n")
    
    results = []
    
    results.append(("Database Connection", check_database_connection()))
    results.append(("Models", check_models()))
    results.append(("Relationships", check_relationships()))
    results.append(("Duplicates", check_duplicates()))
    results.append(("Settings", check_settings()))
    
    # Summary
    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)
    
    all_ok = True
    for name, result in results:
        status = "[OK] PASS" if result else "[ERROR] FAIL"
        print(f"{status} - {name}")
        if not result:
            all_ok = False
    
    if all_ok:
        print("\n[SUCCESS] All checks passed! System is healthy.")
    else:
        print("\n[WARNING] Some issues were found. Please review above.")
    
    return all_ok

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)

