"""
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
        print("\n" + "=" * 60)
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
        print("\n" + "=" * 60)
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
        print("\n" + "=" * 60)
        print("FEEDBACK INSIGHTS")
        print("=" * 60)
        
        # Analyze feedback types
        type_counts = self.analyze_feedback_types()
        
        # Analyze ratings
        avg_rating, rating_counts = self.analyze_ratings()
        
        # Analyze user roles
        role_counts = self.analyze_user_roles()
        
        # Generate insights
        print("\nKey Insights:")
        
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
        print("\nRecommendations:")
        
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
        print("\n" + "=" * 80)
        print("FEEDBACK ANALYSIS REPORT")
        print("=" * 80)
        print(f"Report generated at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()
        
        # Generate insights
        insights = self.generate_insights()
        
        # Summary
        print("\n" + "=" * 80)
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
