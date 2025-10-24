"""
User Feedback System
Collect and analyze user feedback for system improvement
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

def create_feedback_system():
    """Create comprehensive feedback system"""
    print("=" * 60)
    print("USER FEEDBACK SYSTEM")
    print("=" * 60)
    
    # 1. Create feedback templates
    print("\n1. Creating Feedback Templates...")
    
    feedback_template = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>User Feedback Form</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3498db; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .form-group { margin: 15px 0; }
        .form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
        .form-group input, .form-group textarea, .form-group select { 
            width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; 
        }
        .form-group textarea { height: 100px; }
        .button { background: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
        .footer { background: #2c3e50; color: white; padding: 20px; text-align: center; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>User Feedback Form</h1>
        </div>
        <div class="content">
            <h2>Help Us Improve!</h2>
            <p>Your feedback is important to us. Please take a few minutes to share your thoughts about the system.</p>
            
            <form method="POST" action="/api/feedback/">
                <div class="form-group">
                    <label for="feedback_type">Feedback Type:</label>
                    <select name="feedback_type" id="feedback_type" required>
                        <option value="">Select feedback type</option>
                        <option value="bug_report">Bug Report</option>
                        <option value="feature_request">Feature Request</option>
                        <option value="improvement">Improvement Suggestion</option>
                        <option value="general">General Feedback</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="rating">Overall Rating:</label>
                    <select name="rating" id="rating" required>
                        <option value="">Select rating</option>
                        <option value="5">5 - Excellent</option>
                        <option value="4">4 - Good</option>
                        <option value="3">3 - Average</option>
                        <option value="2">2 - Poor</option>
                        <option value="1">1 - Very Poor</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="subject">Subject:</label>
                    <input type="text" name="subject" id="subject" required placeholder="Brief description of your feedback">
                </div>
                
                <div class="form-group">
                    <label for="message">Message:</label>
                    <textarea name="message" id="message" required placeholder="Please provide detailed feedback..."></textarea>
                </div>
                
                <div class="form-group">
                    <label for="user_role">Your Role:</label>
                    <select name="user_role" id="user_role">
                        <option value="student">Student</option>
                        <option value="advisor">Advisor</option>
                        <option value="administrator">Administrator</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="contact_email">Contact Email (optional):</label>
                    <input type="email" name="contact_email" id="contact_email" placeholder="your.email@university.edu">
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <button type="submit" class="button">Submit Feedback</button>
                </div>
            </form>
        </div>
        <div class="footer">
            <p>© 2024 University Final Project Management System. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
"""
    
    # Create templates directory
    Path('templates/feedback').mkdir(parents=True, exist_ok=True)
    
    with open('templates/feedback/form.html', 'w') as f:
        f.write(feedback_template)
    print("OK Feedback form template created")
    
    # 2. Create feedback analysis script
    print("\n2. Creating Feedback Analysis Script...")
    
    analysis_script = '''"""
Feedback Analysis Script
Analyze user feedback for insights and improvements
"""

import os
import django
from datetime import datetime, timedelta
from collections import Counter

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.db.models import Count, Avg

User = get_user_model()

class FeedbackAnalyzer:
    def __init__(self):
        self.feedback_data = []
    
    def analyze_feedback_types(self):
        """Analyze feedback types"""
        print("=" * 60)
        print("FEEDBACK TYPE ANALYSIS")
        print("=" * 60)
        
        # Simulate feedback data (in real system, this would come from database)
        feedback_types = [
            'bug_report', 'feature_request', 'improvement', 'general',
            'bug_report', 'feature_request', 'improvement', 'general',
            'bug_report', 'feature_request', 'improvement', 'general',
            'bug_report', 'feature_request', 'improvement', 'general',
            'bug_report', 'feature_request', 'improvement', 'general',
        ]
        
        type_counts = Counter(feedback_types)
        
        print("Feedback Type Distribution:")
        for feedback_type, count in type_counts.items():
            percentage = (count / len(feedback_types)) * 100
            print(f"  {feedback_type}: {count} ({percentage:.1f}%)")
        
        return type_counts
    
    def analyze_ratings(self):
        """Analyze user ratings"""
        print("\\n" + "=" * 60)
        print("RATING ANALYSIS")
        print("=" * 60)
        
        # Simulate rating data
        ratings = [5, 4, 5, 3, 4, 5, 4, 3, 5, 4, 3, 2, 4, 5, 4, 3, 5, 4, 3, 2]
        
        avg_rating = sum(ratings) / len(ratings)
        rating_counts = Counter(ratings)
        
        print(f"Average Rating: {avg_rating:.2f}/5")
        print("Rating Distribution:")
        for rating in sorted(rating_counts.keys(), reverse=True):
            count = rating_counts[rating]
            percentage = (count / len(ratings)) * 100
            stars = "*" * rating + "." * (5 - rating)
            print(f"  {stars} {rating}: {count} ({percentage:.1f}%)")
        
        return avg_rating, rating_counts
    
    def analyze_user_roles(self):
        """Analyze feedback by user role"""
        print("\\n" + "=" * 60)
        print("USER ROLE ANALYSIS")
        print("=" * 60)
        
        # Simulate user role data
        user_roles = [
            'student', 'advisor', 'administrator', 'student',
            'advisor', 'student', 'administrator', 'advisor',
            'student', 'advisor', 'student', 'administrator',
            'advisor', 'student', 'advisor', 'student',
            'administrator', 'advisor', 'student', 'advisor'
        ]
        
        role_counts = Counter(user_roles)
        
        print("Feedback by User Role:")
        for role, count in role_counts.items():
            percentage = (count / len(user_roles)) * 100
            print(f"  {role}: {count} ({percentage:.1f}%)")
        
        return role_counts
    
    def generate_insights(self):
        """Generate insights from feedback analysis"""
        print("\\n" + "=" * 60)
        print("FEEDBACK INSIGHTS")
        print("=" * 60)
        
        # Analyze feedback types
        type_counts = self.analyze_feedback_types()
        
        # Analyze ratings
        avg_rating, rating_counts = self.analyze_ratings()
        
        # Analyze user roles
        role_counts = self.analyze_user_roles()
        
        # Generate insights
        print("\\nKey Insights:")
        
        # Most common feedback type
        most_common_type = type_counts.most_common(1)[0]
        print(f"  • Most common feedback type: {most_common_type[0]} ({most_common_type[1]} responses)")
        
        # Average rating insight
        if avg_rating >= 4.0:
            print(f"  • Overall satisfaction: High ({avg_rating:.2f}/5)")
        elif avg_rating >= 3.0:
            print(f"  • Overall satisfaction: Medium ({avg_rating:.2f}/5)")
        else:
            print(f"  • Overall satisfaction: Low ({avg_rating:.2f}/5)")
        
        # User role insights
        most_active_role = role_counts.most_common(1)[0]
        print(f"  • Most active user role: {most_active_role[0]} ({most_active_role[1]} responses)")
        
        # Recommendations
        print("\\nRecommendations:")
        
        if most_common_type[0] == 'bug_report':
            print("  • Focus on bug fixes and system stability")
        elif most_common_type[0] == 'feature_request':
            print("  • Consider implementing requested features")
        elif most_common_type[0] == 'improvement':
            print("  • Focus on system improvements and optimization")
        else:
            print("  • Continue monitoring general feedback")
        
        if avg_rating < 4.0:
            print("  • Address user satisfaction issues")
            print("  • Conduct user interviews for detailed feedback")
        
        return {
            'type_counts': type_counts,
            'avg_rating': avg_rating,
            'rating_counts': rating_counts,
            'role_counts': role_counts
        }
    
    def generate_report(self):
        """Generate comprehensive feedback report"""
        print("\\n" + "=" * 80)
        print("FEEDBACK ANALYSIS REPORT")
        print("=" * 80)
        print(f"Report generated at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()
        
        # Generate insights
        insights = self.generate_insights()
        
        # Summary
        print("\\n" + "=" * 80)
        print("SUMMARY")
        print("=" * 80)
        print(f"Total feedback responses: {sum(insights['type_counts'].values())}")
        print(f"Average rating: {insights['avg_rating']:.2f}/5")
        print(f"Most common feedback type: {insights['type_counts'].most_common(1)[0][0]}")
        print(f"Most active user role: {insights['role_counts'].most_common(1)[0][0]}")
        
        return insights

if __name__ == '__main__':
    analyzer = FeedbackAnalyzer()
    analyzer.generate_report()
'''
    
    with open('feedback_analysis.py', 'w') as f:
        f.write(analysis_script)
    print("OK Feedback analysis script created")
    
    # 3. Create feedback collection system
    print("\n3. Creating Feedback Collection System...")
    
    collection_system = """
# Feedback Collection System

## Collection Methods
1. **Online Form**: Web-based feedback form
2. **Email Feedback**: Direct email feedback
3. **In-App Feedback**: Built-in feedback system
4. **User Interviews**: Direct user interviews
5. **Surveys**: Periodic user surveys

## Feedback Categories
1. **Bug Reports**: System issues and errors
2. **Feature Requests**: New feature suggestions
3. **Improvements**: System enhancement ideas
4. **General Feedback**: Overall system feedback

## Analysis Process
1. **Data Collection**: Gather all feedback
2. **Categorization**: Sort feedback by type
3. **Analysis**: Analyze patterns and trends
4. **Insights**: Generate actionable insights
5. **Recommendations**: Provide improvement suggestions

## Response Process
1. **Acknowledgment**: Acknowledge feedback receipt
2. **Review**: Review and categorize feedback
3. **Analysis**: Analyze feedback patterns
4. **Action**: Take appropriate action
5. **Follow-up**: Follow up with users
"""
    
    with open('feedback_collection_system.md', 'w') as f:
        f.write(collection_system)
    print("OK Feedback collection system created")
    
    # 4. Create feedback response system
    print("\n4. Creating Feedback Response System...")
    
    response_system = '''"""
Feedback Response System
Automated response system for user feedback
"""

import os
import django
from datetime import datetime

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')
django.setup()

from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings

def send_feedback_acknowledgment(feedback_data):
    """Send acknowledgment email for feedback"""
    try:
        context = {
            'user_name': feedback_data.get('user_name', 'User'),
            'feedback_type': feedback_data.get('feedback_type', 'feedback'),
            'subject': feedback_data.get('subject', 'Your feedback'),
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        
        html_content = render_to_string('emails/feedback_acknowledgment.html', context)
        
        send_mail(
            subject='Thank you for your feedback',
            message='Thank you for your feedback. We will review it and get back to you soon.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[feedback_data.get('contact_email', '')],
            html_message=html_content,
            fail_silently=False
        )
        
        print(f"OK Feedback acknowledgment sent to {feedback_data.get('contact_email')}")
        return True
        
    except Exception as e:
        print(f"FAIL Failed to send feedback acknowledgment: {e}")
        return False

def process_feedback(feedback_data):
    """Process user feedback"""
    print(f"Processing feedback: {feedback_data.get('subject')}")
    
    # Send acknowledgment
    acknowledgment_sent = send_feedback_acknowledgment(feedback_data)
    
    # Log feedback
    print(f"Feedback logged: {feedback_data.get('feedback_type')} - {feedback_data.get('subject')}")
    
    # Categorize feedback
    feedback_type = feedback_data.get('feedback_type')
    if feedback_type == 'bug_report':
        print("Action: Forward to development team")
    elif feedback_type == 'feature_request':
        print("Action: Forward to product team")
    elif feedback_type == 'improvement':
        print("Action: Forward to system team")
    else:
        print("Action: Forward to general feedback team")
    
    return acknowledgment_sent

if __name__ == '__main__':
    # Example feedback processing
    sample_feedback = {
        'user_name': 'John Doe',
        'feedback_type': 'bug_report',
        'subject': 'Login issue',
        'message': 'Unable to login with correct credentials',
        'contact_email': 'john.doe@university.edu'
    }
    
    process_feedback(sample_feedback)
'''
    
    with open('feedback_response_system.py', 'w') as f:
        f.write(response_system)
    print("OK Feedback response system created")
    
    # 5. Create feedback dashboard
    print("\n5. Creating Feedback Dashboard...")
    
    dashboard_html = '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Feedback Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .dashboard { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { background: #f9f9f9; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .card h3 { margin-top: 0; color: #333; }
        .metric { font-size: 2em; font-weight: bold; color: #3498db; }
        .chart { height: 200px; background: #ecf0f1; border-radius: 4px; display: flex; align-items: center; justify-content: center; }
        .refresh { margin: 20px 0; }
        .status { padding: 5px 10px; border-radius: 4px; color: white; }
        .status.good { background: #27ae60; }
        .status.warning { background: #f39c12; }
        .status.critical { background: #e74c3c; }
    </style>
</head>
<body>
    <h1>Feedback Dashboard</h1>
    
    <div class="refresh">
        <button onclick="location.reload()">Refresh</button>
        <span>Last updated: <span id="timestamp"></span></span>
    </div>
    
    <div class="dashboard">
        <div class="card">
            <h3>Total Feedback</h3>
            <div class="metric" id="total-feedback">Loading...</div>
            <p>Total feedback responses received</p>
        </div>
        
        <div class="card">
            <h3>Average Rating</h3>
            <div class="metric" id="average-rating">Loading...</div>
            <p>Overall user satisfaction rating</p>
        </div>
        
        <div class="card">
            <h3>Bug Reports</h3>
            <div class="metric" id="bug-reports">Loading...</div>
            <p>System issues and errors reported</p>
        </div>
        
        <div class="card">
            <h3>Feature Requests</h3>
            <div class="metric" id="feature-requests">Loading...</div>
            <p>New feature suggestions</p>
        </div>
        
        <div class="card">
            <h3>Feedback Trends</h3>
            <div class="chart">Chart Placeholder</div>
            <p>Feedback volume over time</p>
        </div>
        
        <div class="card">
            <h3>User Roles</h3>
            <div class="chart">Chart Placeholder</div>
            <p>Feedback by user role</p>
        </div>
    </div>
    
    <script>
        // Update timestamp
        document.getElementById('timestamp').textContent = new Date().toLocaleString();
        
        // Auto-refresh every 30 seconds
        setInterval(() => {
            location.reload();
        }, 30000);
        
        // Load feedback data
        fetch('/api/feedback/stats/')
            .then(response => response.json())
            .then(data => {
                document.getElementById('total-feedback').textContent = data.total_feedback || '0';
                document.getElementById('average-rating').textContent = data.average_rating || '0.0';
                document.getElementById('bug-reports').textContent = data.bug_reports || '0';
                document.getElementById('feature-requests').textContent = data.feature_requests || '0';
            })
            .catch(error => {
                console.error('Error loading feedback data:', error);
            });
    </script>
</body>
</html>'''
    
    with open('feedback_dashboard.html', 'w') as f:
        f.write(dashboard_html)
    print("OK Feedback dashboard created")
    
    # Final status
    print("\n" + "=" * 60)
    print("USER FEEDBACK SYSTEM COMPLETE!")
    print("=" * 60)
    print("OK Feedback form template created")
    print("OK Feedback analysis script ready")
    print("OK Feedback collection system ready")
    print("OK Feedback response system ready")
    print("OK Feedback dashboard ready")
    print("\nNext steps:")
    print("1. Set up feedback collection")
    print("2. Configure automated responses")
    print("3. Start collecting feedback")
    print("4. Analyze feedback patterns")
    print("5. Implement improvements")
    print("=" * 60)

if __name__ == '__main__':
    create_feedback_system()
