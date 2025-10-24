# Final Project Management System - API Documentation

## Overview

The Final Project Management System provides a comprehensive REST API for managing university final projects, students, advisors, and academic workflows. This API supports multi-year academic data, role-based access control, and AI-enhanced features.

## Base URL

```
https://api.finalprojectmanagement.edu
```

## Authentication

The API uses JWT (JSON Web Token) authentication. Include the access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Getting Access Token

```http
POST /api/auth/login/
Content-Type: application/json

{
    "username": "your_username",
    "password": "your_password"
}
```

**Response:**
```json
{
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "user": {
        "id": 1,
        "username": "your_username",
        "email": "user@example.com",
        "role": "student",
        "academic_year": "2024"
    }
}
```

### Refreshing Token

```http
POST /api/auth/token/refresh/
Content-Type: application/json

{
    "refresh": "your_refresh_token"
}
```

## Rate Limiting

The API implements rate limiting to ensure fair usage:

- **Anonymous users**: 100 requests/hour
- **Authenticated users**: 1000 requests/hour
- **Login attempts**: 5 requests/minute
- **Registration**: 3 requests/minute
- **Password reset**: 3 requests/hour

## Error Handling

All API endpoints return appropriate HTTP status codes and error messages:

```json
{
    "error": "Error message",
    "details": "Additional error details",
    "code": "ERROR_CODE"
}
```

### Common HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

## Pagination

List endpoints support pagination:

```json
{
    "count": 100,
    "next": "https://api.finalprojectmanagement.edu/api/students/?page=2",
    "previous": null,
    "page_size": 20,
    "total_pages": 5,
    "current_page": 1,
    "results": [...]
}
```

### Pagination Parameters

- `page` - Page number (default: 1)
- `page_size` - Items per page (default: 20, max: 100)

## Filtering and Search

Most list endpoints support filtering and search:

### Filtering
- `academic_year` - Filter by academic year
- `status` - Filter by status
- `role` - Filter by user role

### Search
- `query` - Search across relevant fields
- `ordering` - Sort by field (prefix with `-` for descending)

## API Endpoints

### Authentication

#### Login
```http
POST /api/auth/login/
```

**Request Body:**
```json
{
    "username": "string",
    "password": "string"
}
```

**Response:**
```json
{
    "access": "string",
    "refresh": "string",
    "user": {
        "id": 1,
        "username": "string",
        "email": "string",
        "role": "string",
        "academic_year": "string"
    }
}
```

#### Register
```http
POST /api/auth/register/
```

**Request Body:**
```json
{
    "username": "string",
    "email": "string",
    "password": "string",
    "password_confirm": "string",
    "first_name": "string",
    "last_name": "string",
    "role": "student|advisor|admin",
    "academic_year": "string"
}
```

#### Change Password
```http
POST /api/auth/change-password/
```

**Request Body:**
```json
{
    "old_password": "string",
    "new_password": "string",
    "new_password_confirm": "string"
}
```

#### Logout
```http
POST /api/auth/logout/
```

**Request Body:**
```json
{
    "refresh": "string"
}
```

### Users

#### List Users
```http
GET /api/users/
```

**Query Parameters:**
- `role` - Filter by role
- `is_active` - Filter by active status
- `academic_year` - Filter by academic year
- `search` - Search by username, email, name
- `ordering` - Sort by field

**Response:**
```json
{
    "count": 100,
    "next": "string",
    "previous": null,
    "results": [
        {
            "id": 1,
            "username": "string",
            "email": "string",
            "first_name": "string",
            "last_name": "string",
            "role": "string",
            "academic_year": "string",
            "is_active": true,
            "last_login": "2024-01-01T00:00:00Z"
        }
    ]
}
```

#### Get User
```http
GET /api/users/{id}/
```

#### Update User
```http
PATCH /api/users/{id}/
```

**Request Body:**
```json
{
    "email": "string",
    "first_name": "string",
    "last_name": "string",
    "is_active": true
}
```

#### Activate User
```http
POST /api/users/{id}/activate/
```

#### Deactivate User
```http
POST /api/users/{id}/deactivate/
```

#### Force Password Change
```http
POST /api/users/{id}/force-password-change/
```

#### User Statistics
```http
GET /api/users/statistics/
```

**Response:**
```json
{
    "total_users": 100,
    "total_students": 80,
    "total_advisors": 15,
    "total_admins": 5,
    "active_users": 95,
    "inactive_users": 5,
    "users_by_role": {
        "student": 80,
        "advisor": 15,
        "admin": 5
    },
    "users_by_academic_year": {
        "2024": 100
    },
    "recent_registrations": 10,
    "users_requiring_password_change": 2
}
```

### Students

#### List Students
```http
GET /api/students/
```

**Query Parameters:**
- `status` - Filter by status (Pending, Approved)
- `major` - Filter by major ID
- `classroom` - Filter by classroom ID
- `gender` - Filter by gender
- `academic_year` - Filter by academic year
- `search` - Search by student ID, name, email
- `ordering` - Sort by field

**Response:**
```json
{
    "count": 100,
    "next": "string",
    "previous": null,
    "results": [
        {
            "id": 1,
            "student_id": "155N1000/24",
            "name": "string",
            "surname": "string",
            "full_name": "string",
            "gender": "Male|Female|Monk",
            "major": 1,
            "major_name": "string",
            "classroom": 1,
            "classroom_name": "string",
            "tel": "string",
            "email": "string",
            "status": "Pending|Approved",
            "academic_year": "string",
            "project_count": 1
        }
    ]
}
```

#### Create Student
```http
POST /api/students/
```

**Request Body:**
```json
{
    "student_id": "155N1000/24",
    "name": "string",
    "surname": "string",
    "gender": "Male|Female|Monk",
    "major": 1,
    "classroom": 1,
    "tel": "string",
    "email": "string",
    "status": "Pending|Approved",
    "academic_year": "string"
}
```

#### Get Student
```http
GET /api/students/{id}/
```

#### Update Student
```http
PATCH /api/students/{id}/
```

#### Delete Student
```http
DELETE /api/students/{id}/
```

#### Approve Student
```http
POST /api/students/{id}/approve/
```

#### Reject Student
```http
POST /api/students/{id}/reject/
```

#### Bulk Update Students
```http
POST /api/students/bulk-update/
```

**Request Body:**
```json
{
    "student_ids": ["155N1000/24", "155N1001/24"],
    "updates": {
        "status": "Approved"
    }
}
```

#### Bulk Delete Students
```http
DELETE /api/students/bulk-delete/
```

**Request Body:**
```json
{
    "student_ids": ["155N1000/24", "155N1001/24"]
}
```

#### Student Statistics
```http
GET /api/students/statistics/
```

**Response:**
```json
{
    "total_students": 100,
    "approved_students": 80,
    "pending_students": 20,
    "students_with_projects": 60,
    "students_without_projects": 40,
    "students_by_major": {
        "Business Administration": 50,
        "Computer Science": 30,
        "Engineering": 20
    },
    "students_by_gender": {
        "Male": 60,
        "Female": 35,
        "Monk": 5
    },
    "students_by_classroom": {
        "BA-4A": 25,
        "BA-4B": 25,
        "CS-4A": 30,
        "CS-4B": 20
    }
}
```

### Advisors

#### List Advisors
```http
GET /api/advisors/
```

**Query Parameters:**
- `is_department_admin` - Filter by department admin status
- `academic_year` - Filter by academic year
- `search` - Search by name, username, email
- `ordering` - Sort by field

**Response:**
```json
{
    "count": 20,
    "next": "string",
    "previous": null,
    "results": [
        {
            "id": 1,
            "name": "string",
            "quota": 3,
            "main_committee_quota": 3,
            "second_committee_quota": 3,
            "third_committee_quota": 3,
            "is_department_admin": false,
            "specialized_majors": [1, 2],
            "specialized_major_names": ["Business Administration", "Computer Science"],
            "current_project_count": 2,
            "workload_summary": {
                "supervised_projects": 2,
                "main_committee": 1,
                "second_committee": 0,
                "third_committee": 0,
                "quota_remaining": 1
            }
        }
    ]
}
```

#### Create Advisor
```http
POST /api/advisors/
```

**Request Body:**
```json
{
    "name": "string",
    "quota": 3,
    "main_committee_quota": 3,
    "second_committee_quota": 3,
    "third_committee_quota": 3,
    "is_department_admin": false,
    "specialized_majors": [1, 2],
    "academic_year": "string"
}
```

#### Get Advisor
```http
GET /api/advisors/{id}/
```

#### Update Advisor
```http
PATCH /api/advisors/{id}/
```

#### Delete Advisor
```http
DELETE /api/advisors/{id}/
```

#### Get Advisor Workload
```http
GET /api/advisors/{id}/workload/
```

**Response:**
```json
{
    "supervised_projects": 2,
    "main_committee": 1,
    "second_committee": 0,
    "third_committee": 0,
    "quota_remaining": 1
}
```

#### Set Department Admin
```http
POST /api/advisors/{id}/set-department-admin/
```

#### Remove Department Admin
```http
POST /api/advisors/{id}/remove-department-admin/
```

#### Bulk Update Advisors
```http
POST /api/advisors/bulk-update/
```

**Request Body:**
```json
{
    "advisor_ids": [1, 2],
    "updates": {
        "quota": 5
    }
}
```

#### Bulk Delete Advisors
```http
DELETE /api/advisors/bulk-delete/
```

**Request Body:**
```json
{
    "advisor_ids": [1, 2]
}
```

#### Advisor Statistics
```http
GET /api/advisors/statistics/
```

**Response:**
```json
{
    "total_advisors": 20,
    "department_admins": 5,
    "regular_advisors": 15,
    "overloaded_advisors": 2,
    "advisors_by_workload": {
        "light": 10,
        "moderate": 6,
        "heavy": 4
    },
    "committee_positions": {
        "main": 15,
        "second": 10,
        "third": 5
    },
    "specialized_majors_distribution": {
        "Business Administration": 8,
        "Computer Science": 6,
        "Engineering": 6
    }
}
```

### Projects

#### List Projects
```http
GET /api/projects/
```

**Query Parameters:**
- `status` - Filter by status (Pending, Approved, Rejected)
- `advisor` - Filter by advisor ID
- `academic_year` - Filter by academic year
- `search` - Search by project ID, topic, advisor name
- `ordering` - Sort by field

**Response:**
```json
{
    "count": 50,
    "next": "string",
    "previous": null,
    "results": [
        {
            "id": 1,
            "project_id": "P24001",
            "topic_lao": "ໂຄງການທົດສອບ",
            "topic_eng": "Test Project",
            "advisor_name": "Dr. John Advisor",
            "advisor": 1,
            "comment": "string",
            "status": "Pending|Approved|Rejected",
            "main_committee": 2,
            "second_committee": 3,
            "third_committee": 4,
            "defense_date": "2024-12-15",
            "defense_time": "09:00:00",
            "defense_room": "Room A101",
            "final_grade": "A",
            "main_advisor_score": 85.5,
            "main_committee_score": 90.0,
            "second_committee_score": 88.0,
            "third_committee_score": 87.5,
            "student_names": "John Student, Jane Student",
            "student_count": 2,
            "committee_member_names": {
                "main": "Dr. Main Committee",
                "second": "Dr. Second Committee",
                "third": "Dr. Third Committee"
            },
            "milestone_count": 5,
            "pending_milestone_count": 2,
            "is_scheduled": true,
            "final_score": 87.5,
            "recent_activity": [
                {
                    "type": "message",
                    "author": "Dr. John Advisor",
                    "message": "Project milestone submitted",
                    "timestamp": "2024-01-01T00:00:00Z"
                }
            ],
            "academic_year": "string",
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-01T00:00:00Z"
        }
    ]
}
```

#### Create Project
```http
POST /api/projects/
```

**Request Body:**
```json
{
    "topic_lao": "ໂຄງການທົດສອບ",
    "topic_eng": "Test Project",
    "advisor_name": "Dr. John Advisor",
    "advisor": 1,
    "comment": "string",
    "student_ids": ["155N1000/24", "155N1001/24"],
    "template_id": "string",
    "academic_year": "string"
}
```

#### Get Project
```http
GET /api/projects/{id}/
```

#### Update Project
```http
PATCH /api/projects/{id}/
```

#### Delete Project
```http
DELETE /api/projects/{id}/
```

#### Update Project Status
```http
POST /api/projects/{id}/update-status/
```

**Request Body:**
```json
{
    "status": "Approved",
    "comment": "Project approved for defense",
    "template_id": "string"
}
```

#### Update Project Committee
```http
POST /api/projects/{id}/update-committee/
```

**Request Body:**
```json
{
    "committee_type": "main|second|third",
    "advisor_id": 2
}
```

#### Schedule Defense
```http
POST /api/projects/{id}/schedule-defense/
```

**Request Body:**
```json
{
    "defense_date": "2024-12-15",
    "defense_time": "09:00:00",
    "defense_room": "Room A101"
}
```

#### Submit Score
```http
POST /api/projects/{id}/submit-score/
```

**Request Body:**
```json
{
    "evaluator_id": 1,
    "scores": {
        "technical_quality": 85.5,
        "presentation": 90.0,
        "documentation": 88.0
    }
}
```

#### Transfer Project
```http
POST /api/projects/{id}/transfer/
```

**Request Body:**
```json
{
    "new_advisor_id": 2,
    "comment": "Transferring due to workload"
}
```

#### Get Project Milestones
```http
GET /api/projects/{id}/milestones/
```

**Response:**
```json
[
    {
        "id": 1,
        "name": "Project Proposal",
        "status": "Approved",
        "due_date": "2024-02-15",
        "submitted_date": "2024-02-10",
        "feedback": "Good proposal, proceed with implementation"
    }
]
```

#### Get Project Log Entries
```http
GET /api/projects/{id}/log-entries/
```

**Response:**
```json
[
    {
        "id": "uuid",
        "type": "message|event",
        "author_name": "Dr. John Advisor",
        "author_role": "advisor",
        "message": "Project milestone submitted",
        "file_name": "milestone1.pdf",
        "created_at": "2024-01-01T00:00:00Z"
    }
]
```

#### Add Log Entry
```http
POST /api/projects/{id}/add-log-entry/
```

**Request Body:**
```json
{
    "type": "message|event",
    "message": "Project milestone submitted"
}
```

#### Bulk Update Projects
```http
POST /api/projects/bulk-update/
```

**Request Body:**
```json
{
    "project_ids": ["P24001", "P24002"],
    "updates": {
        "status": "Approved"
    }
}
```

#### Project Statistics
```http
GET /api/projects/statistics/
```

**Response:**
```json
{
    "total_projects": 50,
    "pending_projects": 20,
    "approved_projects": 25,
    "rejected_projects": 5,
    "scheduled_defenses": 15,
    "unscheduled_defenses": 35,
    "projects_by_status": {
        "Pending": 20,
        "Approved": 25,
        "Rejected": 5
    },
    "projects_by_advisor": {
        "Dr. John Advisor": 10,
        "Dr. Jane Advisor": 8
    },
    "projects_by_major": {
        "Business Administration": 20,
        "Computer Science": 15,
        "Engineering": 15
    },
    "average_milestone_completion": 75.5,
    "projects_needing_attention": 5
}
```

#### Search Projects
```http
GET /api/projects/search/
```

**Query Parameters:**
- `query` - Search query
- `status` - Filter by status
- `advisor` - Filter by advisor
- `major` - Filter by major
- `scheduled` - Filter by defense scheduling
- `academic_year` - Filter by academic year
- `ordering` - Sort by field
- `page` - Page number
- `page_size` - Items per page

**Response:**
```json
{
    "results": [...],
    "count": 50,
    "page": 1,
    "page_size": 20,
    "total_pages": 3
}
```

### AI Enhancement

#### Security Audit
```http
POST /api/ai-enhancement/security-audit/
```

**Response:**
```json
{
    "security_issues": [
        {
            "type": "Weak Password",
            "description": "User has weak password",
            "recommendation": "Use stronger password",
            "relatedUserIds": ["1"]
        }
    ],
    "recommendations": [
        "Implement stronger password policies",
        "Enable two-factor authentication"
    ]
}
```

#### Project Health Analysis
```http
POST /api/ai-enhancement/project-health-analysis/
```

**Request Body:**
```json
{
    "project_id": 1,
    "analysis_type": "comprehensive"
}
```

**Response:**
```json
{
    "health_score": 85,
    "issues": [
        {
            "type": "Delayed Milestones",
            "description": "Project has delayed milestones",
            "recommendation": "Review timeline and adjust schedule"
        }
    ],
    "recommendations": [
        "Monitor progress more closely",
        "Provide additional support to students"
    ]
}
```

#### Communication Analysis
```http
POST /api/ai-enhancement/communication-analysis/
```

**Request Body:**
```json
{
    "project_id": 1,
    "time_period": "30_days"
}
```

**Response:**
```json
{
    "communication_score": 75,
    "sentiment_analysis": {
        "positive": 60,
        "neutral": 30,
        "negative": 10
    },
    "key_topics": [
        "Project progress",
        "Technical issues",
        "Timeline concerns"
    ],
    "recommendations": [
        "Improve communication frequency",
        "Address technical concerns promptly"
    ]
}
```

#### Grammar Check
```http
POST /api/ai-enhancement/grammar-check/
```

**Request Body:**
```json
{
    "text": "This is a test document with some grammar errors.",
    "file_id": "test_file_123"
}
```

**Response:**
```json
{
    "grammar_score": 80,
    "errors": [
        {
            "type": "Grammar",
            "description": "Subject-verb disagreement",
            "suggestion": "Use correct verb form",
            "position": 15
        }
    ],
    "suggestions": [
        "Review grammar rules",
        "Use grammar checking tools"
    ]
}
```

#### Topic Suggestions
```http
POST /api/ai-enhancement/topic-suggestions/
```

**Request Body:**
```json
{
    "major": "Business Administration",
    "interests": ["Technology", "Management"],
    "difficulty_level": "Medium"
}
```

**Response:**
```json
{
    "suggestions": [
        {
            "topic": "Machine Learning in Business",
            "description": "Application of ML algorithms in business processes",
            "difficulty": "Medium",
            "relevance": "High"
        }
    ],
    "recommendations": [
        "Consider current industry trends",
        "Focus on practical applications"
    ]
}
```

#### Plagiarism Check
```http
POST /api/ai-enhancement/plagiarism-check/
```

**Request Body:**
```json
{
    "text": "This is a test document to check for plagiarism.",
    "project_id": 1
}
```

**Response:**
```json
{
    "plagiarism_score": 15,
    "originality_score": 85,
    "matches": [
        {
            "source": "Academic Paper 1",
            "similarity": 20,
            "text": "Similar text found"
        }
    ],
    "recommendations": [
        "Cite sources properly",
        "Paraphrase more effectively"
    ]
}
```

#### System Health Analysis
```http
POST /api/ai-enhancement/system-health-analysis/
```

**Response:**
```json
{
    "system_health_score": 90,
    "performance_metrics": {
        "response_time": "Good",
        "memory_usage": "Optimal",
        "database_performance": "Excellent"
    },
    "issues": [
        {
            "type": "Performance",
            "description": "Slow query execution",
            "recommendation": "Optimize database queries"
        }
    ],
    "recommendations": [
        "Monitor system performance",
        "Implement caching strategies"
    ]
}
```

#### Automated Feedback
```http
POST /api/ai-enhancement/automated-feedback/
```

**Request Body:**
```json
{
    "project_id": 1,
    "submission_type": "milestone",
    "content": "Project milestone submission content"
}
```

**Response:**
```json
{
    "feedback_score": 75,
    "strengths": [
        "Good problem analysis",
        "Clear methodology"
    ],
    "weaknesses": [
        "Limited literature review",
        "Insufficient data analysis"
    ],
    "suggestions": [
        "Expand literature review",
        "Include more statistical analysis"
    ],
    "overall_rating": "Good"
}
```

#### Content Generation
```http
POST /api/ai-enhancement/content-generation/
```

**Request Body:**
```json
{
    "content_type": "Project Description",
    "topic": "Machine Learning",
    "requirements": "Technical and academic"
}
```

**Response:**
```json
{
    "generated_content": "This is AI-generated content for the project.",
    "content_type": "Project Description",
    "quality_score": 85,
    "suggestions": [
        "Add more technical details",
        "Include examples"
    ]
}
```

#### Feature Availability
```http
GET /api/ai-enhancement/feature-availability/
```

**Response:**
```json
{
    "ai_assistant_enabled": true,
    "available_features": [
        "grammar_check",
        "plagiarism_check",
        "topic_suggestions",
        "content_generation"
    ]
}
```

#### Usage Statistics
```http
GET /api/ai-enhancement/usage-statistics/
```

**Response:**
```json
{
    "total_requests": 1000,
    "requests_by_type": {
        "grammar_check": 400,
        "plagiarism_check": 300,
        "topic_suggestions": 200,
        "content_generation": 100
    },
    "requests_by_user": {
        "student": 800,
        "advisor": 150,
        "admin": 50
    },
    "success_rate": 95.5
}
```

## Data Models

### User
```json
{
    "id": 1,
    "username": "string",
    "email": "string",
    "first_name": "string",
    "last_name": "string",
    "role": "admin|advisor|student|dept_admin",
    "academic_year": "string",
    "is_active": true,
    "is_ai_assistant_enabled": true,
    "must_change_password": false,
    "last_login": "2024-01-01T00:00:00Z",
    "date_joined": "2024-01-01T00:00:00Z"
}
```

### Student
```json
{
    "id": 1,
    "student_id": "155N1000/24",
    "name": "string",
    "surname": "string",
    "gender": "Male|Female|Monk",
    "major": 1,
    "classroom": 1,
    "tel": "string",
    "email": "string",
    "status": "Pending|Approved",
    "academic_year": "string"
}
```

### Advisor
```json
{
    "id": 1,
    "name": "string",
    "quota": 3,
    "main_committee_quota": 3,
    "second_committee_quota": 3,
    "third_committee_quota": 3,
    "is_department_admin": false,
    "specialized_majors": [1, 2],
    "academic_year": "string"
}
```

### Project
```json
{
    "id": 1,
    "project_id": "P24001",
    "topic_lao": "ໂຄງການທົດສອບ",
    "topic_eng": "Test Project",
    "advisor_name": "string",
    "advisor": 1,
    "comment": "string",
    "status": "Pending|Approved|Rejected",
    "main_committee": 2,
    "second_committee": 3,
    "third_committee": 4,
    "defense_date": "2024-12-15",
    "defense_time": "09:00:00",
    "defense_room": "string",
    "final_grade": "string",
    "main_advisor_score": 85.5,
    "main_committee_score": 90.0,
    "second_committee_score": 88.0,
    "third_committee_score": 87.5,
    "academic_year": "string"
}
```

## Role-Based Access Control

### Admin
- Full access to all endpoints
- Can manage users, students, advisors, projects
- Can access analytics and system health
- Can perform AI-enhanced operations

### Advisor
- Can view and manage their supervised projects
- Can view projects where they are committee members
- Can access AI features for their projects
- Cannot manage users or system settings

### Student
- Can view their own projects
- Can access AI features for their projects
- Cannot manage other users or projects

### Department Admin
- Can manage students and advisors in their departments
- Can view projects in their departments
- Can access analytics for their departments
- Cannot manage system-wide settings

## Security Features

### Input Validation
- All input data is validated and sanitized
- SQL injection protection
- XSS protection
- File upload security

### Rate Limiting
- API rate limiting to prevent abuse
- Different limits for different user types
- IP-based rate limiting

### CORS
- Configured for specific origins
- Credentials support
- Secure headers

### Authentication
- JWT token-based authentication
- Token refresh mechanism
- Secure password requirements

## Error Codes

| Code | Description |
|------|-------------|
| `INVALID_CREDENTIALS` | Invalid username or password |
| `TOKEN_EXPIRED` | JWT token has expired |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions |
| `VALIDATION_ERROR` | Input validation failed |
| `RATE_LIMIT_EXCEEDED` | Rate limit exceeded |
| `RESOURCE_NOT_FOUND` | Requested resource not found |
| `AI_SERVICE_UNAVAILABLE` | AI service is temporarily unavailable |
| `FILE_TOO_LARGE` | Uploaded file exceeds size limit |
| `INVALID_FILE_TYPE` | Uploaded file type not allowed |

## Examples

### Complete Project Lifecycle

1. **Create Project**
```http
POST /api/projects/
{
    "topic_lao": "ໂຄງການທົດສອບ",
    "topic_eng": "Machine Learning in Business",
    "advisor_name": "Dr. John Advisor",
    "advisor": 1,
    "student_ids": ["155N1000/24", "155N1001/24"],
    "academic_year": "2024"
}
```

2. **Approve Project**
```http
POST /api/projects/1/update-status/
{
    "status": "Approved",
    "comment": "Project approved for defense"
}
```

3. **Schedule Defense**
```http
POST /api/projects/1/schedule-defense/
{
    "defense_date": "2024-12-15",
    "defense_time": "09:00:00",
    "defense_room": "Room A101"
}
```

4. **Submit Scores**
```http
POST /api/projects/1/submit-score/
{
    "evaluator_id": 1,
    "scores": {
        "technical_quality": 85.5,
        "presentation": 90.0,
        "documentation": 88.0
    }
}
```

### AI-Enhanced Workflow

1. **Grammar Check**
```http
POST /api/ai-enhancement/grammar-check/
{
    "text": "This is a test document with some grammar errors.",
    "file_id": "test_file_123"
}
```

2. **Plagiarism Check**
```http
POST /api/ai-enhancement/plagiarism-check/
{
    "text": "Project content to check for plagiarism.",
    "project_id": 1
}
```

3. **Project Health Analysis**
```http
POST /api/ai-enhancement/project-health-analysis/
{
    "project_id": 1,
    "analysis_type": "comprehensive"
}
```

## Support

For API support and questions:
- Email: api-support@finalprojectmanagement.edu
- Documentation: https://docs.finalprojectmanagement.edu
- Status Page: https://status.finalprojectmanagement.edu

## Changelog

### Version 1.0.0
- Initial API release
- Authentication and user management
- Project management
- AI enhancement features
- Security and rate limiting
