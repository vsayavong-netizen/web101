"""
Pytest configuration and fixtures
"""
import pytest
import factory
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from accounts.models import User
from students.models import Student
from advisors.models import Advisor
from projects.models import ProjectGroup, Project, ProjectStudent
from notifications.models import Notification

User = get_user_model()


@pytest.fixture
def api_client():
    """API client fixture"""
    return APIClient()


@pytest.fixture
def authenticated_client(api_client, user):
    """Authenticated API client"""
    refresh = RefreshToken.for_user(user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client


@pytest.fixture
def admin_user():
    """Admin user fixture"""
    return User.objects.create_user(
        username='admin',
        email='admin@example.com',
        password='admin123',
        role='Admin',
        is_active=True
    )


@pytest.fixture
def advisor_user():
    """Advisor user fixture"""
    return User.objects.create_user(
        username='advisor',
        email='advisor@example.com',
        password='advisor123',
        role='Advisor',
        is_active=True
    )


@pytest.fixture
def student_user():
    """Student user fixture"""
    return User.objects.create_user(
        username='student',
        email='student@example.com',
        password='student123',
        role='Student',
        is_active=True
    )


@pytest.fixture
def user(admin_user):
    """Default user fixture"""
    return admin_user


@pytest.fixture
def student(student_user):
    """Student model fixture"""
    return Student.objects.create(
        user=student_user,
        student_id='STU001',
        major='Computer Science',
        gpa=3.5,
        academic_year='2024'
    )


@pytest.fixture
def advisor(advisor_user):
    """Advisor model fixture"""
    return Advisor.objects.create(
        user=advisor_user,
        specialization='Computer Science',
        max_students=5,
        current_students=0
    )


@pytest.fixture
def project_group(advisor, student):
    """Project group fixture aligned with current models."""
    # Create legacy-like Project and link via group implicit relationship used in tests
    project = Project.objects.create(
        project_id='PROJ001',
        title='Test Project',
        description='A test project',
        advisor=advisor,
        status='Pending'
    )

    group = ProjectGroup.objects.create(
        project_id=project.project_id,
        topic_lao='ຫົວຂໍ້ທົດລອງ',
        topic_eng=project.title,
        advisor_name=str(advisor.user.get_full_name() or advisor.user.username),
        status=project.status
    )

    ProjectStudent.objects.create(project_group=group, student=student, is_primary=True)
    return group


@pytest.fixture
def notification(user):
    """Notification fixture"""
    return Notification.objects.create(
        title='Test Notification',
        message='This is a test notification',
        type='System',
        user_ids=[str(user.id)],
        project_id='PROJ001'
    )


# Factory classes for generating test data
class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User
    
    username = factory.Sequence(lambda n: f'user{n}')
    email = factory.LazyAttribute(lambda obj: f'{obj.username}@example.com')
    password = factory.PostGenerationMethodCall('set_password', 'password123')
    role = 'Student'
    is_active = True


class StudentFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Student
    
    user = factory.SubFactory(UserFactory, role='Student')
    student_id = factory.Sequence(lambda n: f'STU{n:03d}')
    major = 'Computer Science'
    gpa = factory.Faker('pyfloat', min_value=2.0, max_value=4.0)
    academic_year = '2024'


class AdvisorFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Advisor
    
    user = factory.SubFactory(UserFactory, role='Advisor')
    specialization = factory.Faker('word')
    max_students = factory.Faker('random_int', min=1, max=10)
    current_students = 0


class ProjectFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Project
    
    project_id = factory.Sequence(lambda n: f'PROJ{n:03d}')
    title = factory.Faker('sentence', nb_words=4)
    description = factory.Faker('text', max_nb_chars=200)
    status = 'Pending'
    advisor = factory.SubFactory(AdvisorFactory)


class ProjectGroupFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ProjectGroup
    
    # Create a paired Project to align IDs/titles
    project = factory.SubFactory(ProjectFactory)
    project_id = factory.LazyAttribute(lambda o: o.project.project_id)
    topic_lao = factory.Faker('sentence', nb_words=4)
    topic_eng = factory.LazyAttribute(lambda o: o.project.title)
    advisor_name = factory.LazyAttribute(lambda o: o.project.advisor.user.get_full_name() or o.project.advisor.user.username)
    status = factory.LazyAttribute(lambda o: o.project.status)
    
    @factory.post_generation
    def students(self, create, extracted, **kwargs):
        if not create:
            return
        if extracted:
            for student in extracted:
                ProjectStudent.objects.create(project_group=self, student=student, is_primary=False)


class NotificationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Notification
    
    title = factory.Faker('sentence', nb_words=3)
    message = factory.Faker('text', max_nb_chars=100)
    type = factory.Faker('random_element', elements=['System', 'Submission', 'Approval'])
    user_ids = factory.LazyFunction(lambda: [str(UserFactory().id)])
    project_id = factory.Sequence(lambda n: f'PROJ{n:03d}')


# Pytest markers
pytestmark = [
    pytest.mark.django_db,
]
