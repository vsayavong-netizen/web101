from django.urls import path
from . import views

urlpatterns = [
    # Classroom CRUD
    path('', views.ClassroomListView.as_view(), name='classroom-list'),
    path('<int:pk>/', views.ClassroomDetailView.as_view(), name='classroom-detail'),
    
    # Classroom students
    path('students/', views.ClassroomStudentListView.as_view(), name='classroom-student-list'),
    
    # Classroom schedules
    path('schedules/', views.ClassroomScheduleListView.as_view(), name='classroom-schedule-list'),
    
    # Classroom enrollment
    path('<int:classroom_id>/enrollment/', views.classroom_enrollment, name='classroom-enrollment'),
    
    # Classroom statistics and utilities
    path('statistics/', views.classroom_statistics, name='classroom-statistics'),
    path('dropdown/', views.classroom_dropdown, name='classroom-dropdown'),
]