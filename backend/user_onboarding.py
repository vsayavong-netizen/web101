"""
User Onboarding System
Automated user onboarding and training system
"""

import os
import django
from pathlib import Path
from datetime import datetime, timedelta

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings

User = get_user_model()

def create_welcome_email_template():
    """Create welcome email template"""
    print("=" * 60)
    print("USER ONBOARDING SYSTEM")
    print("=" * 60)
    
    # 1. Create email templates
    print("\n1. Creating Email Templates...")
    
    welcome_template = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Welcome to University Final Project Management System</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { background: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
        .footer { background: #34495e; color: white; padding: 20px; text-align: center; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎓 Welcome to University Final Project Management System</h1>
        </div>
        <div class="content">
            <h2>Hello {{ user_name }}!</h2>
            <p>Welcome to the University Final Project Management System! We're excited to have you on board.</p>
            
            <h3>Your Account Details:</h3>
            <ul>
                <li><strong>Email:</strong> {{ user_email }}</li>
                <li><strong>Role:</strong> {{ user_role }}</li>
                <li><strong>Login URL:</strong> <a href="{{ login_url }}">{{ login_url }}</a></li>
            </ul>
            
            <h3>Getting Started:</h3>
            <ol>
                <li>Click the login link above to access your account</li>
                <li>Complete your profile setup</li>
                <li>Explore the system features</li>
                <li>Join our training program</li>
            </ol>
            
            <h3>Training Program:</h3>
            <p>We've prepared a comprehensive training program to help you master the system:</p>
            <ul>
                <li>📚 <strong>User Manual:</strong> Complete system guide</li>
                <li>🎥 <strong>Video Tutorials:</strong> Step-by-step guides</li>
                <li>🎓 <strong>Training Modules:</strong> Interactive learning</li>
                <li>🏆 <strong>Certification:</strong> User certification program</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{ training_url }}" class="button">Start Training Program</a>
            </div>
            
            <h3>Support & Help:</h3>
            <p>If you need any assistance, please don't hesitate to contact us:</p>
            <ul>
                <li>📧 <strong>Email:</strong> support@university.edu</li>
                <li>📞 <strong>Phone:</strong> +1-555-UNIV-HELP</li>
                <li>💬 <strong>Live Chat:</strong> Available 24/7</li>
                <li>📖 <strong>Documentation:</strong> <a href="{{ docs_url }}">docs.university.edu</a></li>
            </ul>
        </div>
        <div class="footer">
            <p>© 2024 University Final Project Management System. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
"""
    
    with open('templates/emails/welcome.html', 'w') as f:
        f.write(welcome_template)
    print("OK Welcome email template created")
    
    # 2. Create training email template
    training_template = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Training Program Invitation</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #27ae60; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .module { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #27ae60; }
        .button { background: #27ae60; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
        .footer { background: #2c3e50; color: white; padding: 20px; text-align: center; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎓 Training Program Invitation</h1>
        </div>
        <div class="content">
            <h2>Hello {{ user_name }}!</h2>
            <p>You've been invited to join our comprehensive training program for the University Final Project Management System.</p>
            
            <h3>Training Program Overview:</h3>
            <div class="module">
                <h4>📚 Module 1: System Introduction (2 hours)</h4>
                <p>Learn the basics of the system, navigation, and user interface.</p>
            </div>
            <div class="module">
                <h4>📁 Module 2: Project Management (3 hours)</h4>
                <p>Master project creation, management, and collaboration features.</p>
            </div>
            <div class="module">
                <h4>👥 Module 3: Student Management (2.5 hours)</h4>
                <p>Learn to manage student information and academic progress.</p>
            </div>
            <div class="module">
                <h4>💬 Module 4: Communication System (2 hours)</h4>
                <p>Use messaging, chat, and collaboration features effectively.</p>
            </div>
            <div class="module">
                <h4>🤖 Module 5: AI Enhancement Tools (2.5 hours)</h4>
                <p>Leverage AI tools for plagiarism detection, grammar checking, and more.</p>
            </div>
            <div class="module">
                <h4>🎓 Module 6: Defense Management (2 hours)</h4>
                <p>Schedule and manage defense presentations and evaluations.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{ training_url }}" class="button">Start Training Program</a>
            </div>
            
            <h3>Certification Program:</h3>
            <p>Complete the training program to earn your certification:</p>
            <ul>
                <li>🥉 <strong>Basic User Certification</strong> - Complete Modules 1-2</li>
                <li>🥈 <strong>Advanced User Certification</strong> - Complete Modules 1-5</li>
                <li>🥇 <strong>Expert User Certification</strong> - Complete all modules</li>
            </ul>
        </div>
        <div class="footer">
            <p>© 2024 University Final Project Management System. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
"""
    
    with open('templates/emails/training.html', 'w') as f:
        f.write(training_template)
    print("OK Training email template created")
    
    # 3. Create onboarding workflow
    print("\n2. Creating Onboarding Workflow...")
    
    onboarding_workflow = """
# User Onboarding Workflow

## Phase 1: Account Creation
1. User registration
2. Email verification
3. Profile completion
4. Role assignment

## Phase 2: Welcome Process
1. Send welcome email
2. Provide login credentials
3. Guide to system access
4. Introduce key features

## Phase 3: Training Program
1. Invite to training program
2. Provide training materials
3. Schedule training sessions
4. Track progress

## Phase 4: System Introduction
1. System tour
2. Feature demonstration
3. Hands-on practice
4. Q&A session

## Phase 5: Ongoing Support
1. Regular check-ins
2. Additional training
3. Feature updates
4. Continuous support
"""
    
    with open('onboarding_workflow.md', 'w') as f:
        f.write(onboarding_workflow)
    print("OK Onboarding workflow created")
    
    # 4. Create user onboarding script
    print("\n3. Creating User Onboarding Script...")
    
    onboarding_script = '''"""
User Onboarding Script
Automated user onboarding process
"""

import os
import django
from datetime import datetime, timedelta

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings

User = get_user_model()

def send_welcome_email(user):
    """Send welcome email to new user"""
    try:
        context = {
            'user_name': user.get_full_name() or user.email,
            'user_email': user.email,
            'user_role': user.role if hasattr(user, 'role') else 'User',
            'login_url': f"{settings.FRONTEND_URL}/login",
            'training_url': f"{settings.FRONTEND_URL}/training",
            'docs_url': f"{settings.FRONTEND_URL}/docs"
        }
        
        html_content = render_to_string('emails/welcome.html', context)
        
        send_mail(
            subject='🎓 Welcome to University Final Project Management System',
            message='Welcome to the system! Please check the HTML version of this email.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_content,
            fail_silently=False
        )
        
        print(f"OK Welcome email sent to {user.email}")
        return True
        
    except Exception as e:
        print(f"FAIL Failed to send welcome email to {user.email}: {e}")
        return False

def send_training_invitation(user):
    """Send training invitation to user"""
    try:
        context = {
            'user_name': user.get_full_name() or user.email,
            'training_url': f"{settings.FRONTEND_URL}/training"
        }
        
        html_content = render_to_string('emails/training.html', context)
        
        send_mail(
            subject='🎓 Training Program Invitation',
            message='You have been invited to join our training program!',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_content,
            fail_silently=False
        )
        
        print(f"OK Training invitation sent to {user.email}")
        return True
        
    except Exception as e:
        print(f"FAIL Failed to send training invitation to {user.email}: {e}")
        return False

def onboard_new_user(user):
    """Complete onboarding process for new user"""
    print(f"Starting onboarding for user: {user.email}")
    
    # Send welcome email
    welcome_sent = send_welcome_email(user)
    
    # Send training invitation
    training_sent = send_training_invitation(user)
    
    # Create user profile
    if hasattr(user, 'profile'):
        user.profile.onboarding_completed = False
        user.profile.save()
    
    # Log onboarding
    print(f"Onboarding completed for {user.email}")
    
    return welcome_sent and training_sent

def onboard_all_users():
    """Onboard all users in the system"""
    users = User.objects.all()
    
    print(f"Starting onboarding for {users.count()} users")
    
    success_count = 0
    for user in users:
        if onboard_new_user(user):
            success_count += 1
    
    print(f"Onboarding completed: {success_count}/{users.count()} users")
    
    return success_count

if __name__ == '__main__':
    onboard_all_users()
'''
    
    with open('user_onboarding_script.py', 'w') as f:
        f.write(onboarding_script)
    print("OK User onboarding script created")
    
    # 5. Create training schedule
    print("\n4. Creating Training Schedule...")
    
    training_schedule = """
# Training Schedule

## Week 1: Foundation
- **Monday**: System Introduction (2 hours)
- **Wednesday**: Project Management (3 hours)
- **Friday**: Student Management (2.5 hours)

## Week 2: Advanced Features
- **Monday**: Communication System (2 hours)
- **Wednesday**: AI Enhancement Tools (2.5 hours)
- **Friday**: Defense Management (2 hours)

## Week 3: Specialization
- **Monday**: Analytics and Reporting (2 hours)
- **Wednesday**: Advanced Features (3 hours)
- **Friday**: Certification Assessment

## Week 4: Mastery
- **Monday**: Role-specific training
- **Wednesday**: Hands-on practice
- **Friday**: Final certification
"""
    
    with open('training_schedule.md', 'w') as f:
        f.write(training_schedule)
    print("OK Training schedule created")
    
    # 6. Create support system
    print("\n5. Creating Support System...")
    
    support_system = """
# Support System

## Support Channels
- **Email Support**: support@university.edu
- **Phone Support**: +1-555-UNIV-HELP
- **Live Chat**: Available 24/7
- **Help Desk**: Online support system

## Support Levels
- **Level 1**: Basic support (2 hour response)
- **Level 2**: Advanced support (1 hour response)
- **Level 3**: Expert support (30 minute response)

## Support Resources
- **User Manual**: Complete system guide
- **Video Tutorials**: Step-by-step guides
- **FAQ Database**: Common questions
- **Community Forum**: Peer support
"""
    
    with open('support_system.md', 'w') as f:
        f.write(support_system)
    print("OK Support system created")
    
    # Final status
    print("\n" + "=" * 60)
    print("USER ONBOARDING SYSTEM COMPLETE!")
    print("=" * 60)
    print("OK Email templates created")
    print("OK Onboarding workflow ready")
    print("OK User onboarding script ready")
    print("OK Training schedule ready")
    print("OK Support system ready")
    print("\nNext steps:")
    print("1. Configure email settings")
    print("2. Set up training sessions")
    print("3. Start user onboarding")
    print("4. Monitor onboarding progress")
    print("5. Collect user feedback")
    print("=" * 60)

if __name__ == '__main__':
    create_welcome_email_template()
