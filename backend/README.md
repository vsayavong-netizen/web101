# Final Project Management System - Django Backend

This is the Django backend for the Final Project Management System, providing a comprehensive API for managing academic projects, students, advisors, and AI-powered features.

## Features

### Core Functionality
- **User Management**: Authentication, authorization, and role-based access control
- **Project Management**: Project creation, tracking, and evaluation
- **Student Management**: Student profiles, academic records, and progress tracking
- **Advisor Management**: Advisor profiles, workload tracking, and performance analysis
- **Committee Management**: Committee assignments and evaluation processes
- **Major Management**: Academic major and classroom management
- **Milestone Tracking**: Project milestone management and progress monitoring
- **Scoring System**: Comprehensive scoring and evaluation system
- **Notification System**: Real-time notifications and announcements

### AI-Powered Features
- **Security Audit**: Automated security analysis and risk assessment
- **System Health Analysis**: AI-powered system health monitoring
- **Communication Analysis**: Sentiment analysis and communication insights
- **Grammar Check**: AI-powered writing assistance
- **Advisor Suggestions**: AI-powered advisor assignment recommendations
- **Topic Similarity**: Plagiarism detection and topic similarity analysis
- **Project Health**: AI-powered project health assessment
- **Student Analysis**: AI-powered student performance analysis

## Technology Stack

- **Framework**: Django 4.2.7
- **API**: Django REST Framework 3.14.0
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Caching**: Redis
- **Task Queue**: Celery
- **AI Integration**: Google Gemini API
- **File Processing**: XLSX, JSZip
- **CORS**: django-cors-headers

## Installation

### Prerequisites
- Python 3.8+
- PostgreSQL 12+
- Redis 6+
- Node.js 16+ (for frontend)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment configuration**
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

5. **Database setup**
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```

6. **Run the server**
   ```bash
   python manage.py runserver
   ```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `POST /api/auth/token/refresh/` - Refresh JWT token

### Core Endpoints
- `GET /api/projects/` - List projects
- `POST /api/projects/` - Create project
- `GET /api/students/` - List students
- `POST /api/students/` - Create student
- `GET /api/advisors/` - List advisors
- `POST /api/advisors/` - Create advisor

### AI Services Endpoints
- `GET /api/ai/analyses/` - List AI analyses
- `POST /api/ai/analyses/` - Create AI analysis
- `GET /api/ai/security-audits/` - Security audit results
- `GET /api/ai/system-health/` - System health analysis

## Database Schema

### Core Models
- **User**: Extended user model with roles and permissions
- **ProjectGroup**: Project and student group management
- **Student**: Student profiles and academic information
- **Advisor**: Advisor profiles and workload tracking
- **Committee**: Committee management and assignments
- **Major**: Academic major and classroom management
- **Milestone**: Project milestone tracking
- **Scoring**: Comprehensive scoring system
- **Notification**: Notification and announcement system

### AI Models
- **AIAnalysis**: Base AI analysis model
- **AISecurityAudit**: Security audit results
- **AISystemHealth**: System health analysis
- **AICommunicationAnalysis**: Communication analysis
- **AIGrammarCheck**: Grammar check results
- **AIAdvisorSuggestion**: Advisor suggestions
- **AITopicSimilarity**: Topic similarity analysis
- **AIProjectHealth**: Project health assessment
- **AIStudentAnalysis**: Student analysis results

## Configuration

### Environment Variables
- `SECRET_KEY`: Django secret key
- `DEBUG`: Debug mode
- `DB_NAME`: Database name
- `DB_USER`: Database user
- `DB_PASSWORD`: Database password
- `DB_HOST`: Database host
- `DB_PORT`: Database port
- `GEMINI_API_KEY`: Google Gemini API key
- `CELERY_BROKER_URL`: Celery broker URL
- `CELERY_RESULT_BACKEND`: Celery result backend

### Database Configuration
The system uses PostgreSQL as the primary database. Configure your database settings in the `.env` file.

### Redis Configuration
Redis is used for caching and Celery task queue. Configure Redis settings in the `.env` file.

## Development

### Running Tests
```bash
python manage.py test
```

### Code Quality
```bash
# Install development dependencies
pip install -r requirements-dev.txt

# Run linting
flake8 .
black .
isort .

# Run type checking
mypy .
```

### Database Migrations
```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate
```

## Deployment

### Production Settings
1. Set `DEBUG=False` in production
2. Configure proper database settings
3. Set up Redis for caching and Celery
4. Configure static file serving
5. Set up proper logging

### Docker Deployment
```bash
# Build and run with Docker
docker-compose up -d
```

## Permissions & Roles

เราใช้โครงสร้างสิทธิ์มาตรฐานผ่าน `backend/permissions.py` เพื่อความสม่ำเสมอและอ่านง่าย

หลักการใช้งาน
- Class-based views: ใช้ `RoleRequiredMixin` + ตั้ง `allowed_roles = ('Admin','DepartmentAdmin',...)` และเพิ่ม `RolePermission` ใน `permission_classes`
- Function-based views: ใช้ `@require_roles('Admin','DepartmentAdmin', ...)` เพื่อบังคับสิทธิ์
- ใช้ `IsAuthenticated` ควบคู่เสมอใน API ปกติ

ตัวอย่าง
```python
from backend.permissions import RoleRequiredMixin, RolePermission, require_roles

class ReportView(RoleRequiredMixin, APIView):
    permission_classes = [IsAuthenticated, RolePermission]
    allowed_roles = ('Admin',)
    # ...

@api_view(['POST'])
@require_roles('Admin','DepartmentAdmin')
def bulk_update_status(request):
    # ...
```

แนวทางกำหนดสิทธิ์ตามหมวด
- Reports/Exports/Settings Update: Admin-only
- Projects status/bulk/export: DepartmentAdmin/Admin
- Defense schedule/start/complete/evaluate/result: Advisor/DepartmentAdmin/Admin
- Communication: จำกัดเฉพาะผู้เข้าร่วมช่อง/เจ้าของช่อง, งานบริหารให้ DepartmentAdmin/Admin

## API Usage Examples

### Authentication
```python
import requests

# Login
response = requests.post('http://localhost:8000/api/auth/login/', {
    'username': 'admin',
    'password': 'password'
})
token = response.json()['access']

# Use token in headers
headers = {'Authorization': f'Bearer {token}'}
```

### Creating a Project
```python
# Create project
response = requests.post('http://localhost:8000/api/projects/groups/', {
    'project_id': 'PROJ001',
    'topic_eng': 'AI-Powered Learning System',
    'advisor_name': 'Dr. Smith',
    'student_ids': [1, 2, 3]
}, headers=headers)
```

### AI Analysis
```python
# Create AI analysis
response = requests.post('http://localhost:8000/api/ai/analyses/', {
    'analysis_type': 'security_audit',
    'input_data': {'users': [], 'projects': []},
    'user_id': '1'
}, headers=headers)
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please contact the development team or create an issue in the repository.
