#!/usr/bin/env python3
"""
Create missing classroom_students table
"""

import os
import sys
import django

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')
django.setup()

from django.db import connection

def create_classroom_students_table():
    """Create the missing classroom_students table"""
    print("Creating classroom_students table...")
    
    with connection.cursor() as cursor:
        # Create the table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS classroom_students (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                classroom_id INTEGER NOT NULL,
                student_id INTEGER NOT NULL,
                enrollment_date DATE NOT NULL,
                is_active BOOLEAN NOT NULL DEFAULT 1,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL,
                UNIQUE(classroom_id, student_id)
            )
        """)
        
        print("Table created successfully!")
        
        # Check if table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='classroom_students'")
        result = cursor.fetchone()
        
        if result:
            print("Table exists: classroom_students")
        else:
            print("Table creation failed")

if __name__ == "__main__":
    create_classroom_students_table()
