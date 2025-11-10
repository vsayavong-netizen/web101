from django.urls import path, include
from . import views

urlpatterns = [
    # Students
    path('', views.StudentListView.as_view(), name='student-list'),
    path('<int:pk>/', views.StudentDetailView.as_view(), name='student-detail'),
    
    # Academic records
    path('<int:student_id>/academic-records/', views.StudentAcademicRecordListView.as_view(), name='student-academic-record-list'),
    
    # Skills
    path('<int:student_id>/skills/', views.StudentSkillListView.as_view(), name='student-skill-list'),
    path('<int:student_id>/skills/<int:pk>/', views.StudentSkillDetailView.as_view(), name='student-skill-detail'),
    
    # Achievements
    path('<int:student_id>/achievements/', views.StudentAchievementListView.as_view(), name='student-achievement-list'),
    path('<int:student_id>/achievements/<int:pk>/', views.StudentAchievementDetailView.as_view(), name='student-achievement-detail'),
    
    # Attendance
    path('<int:student_id>/attendance/', views.StudentAttendanceListView.as_view(), name='student-attendance-list'),
    
    # Notes
    path('<int:student_id>/notes/', views.StudentNoteListView.as_view(), name='student-note-list'),
    path('<int:student_id>/notes/<int:pk>/', views.StudentNoteDetailView.as_view(), name='student-note-detail'),
    
    # Statistics and search
    path('statistics/', views.student_statistics, name='student-statistics'),
    path('search/', views.student_search, name='student-search'),
    path('bulk-update/', views.bulk_update_students, name='bulk-update-students'),
    path('bulk-delete/', views.bulk_delete_students, name='bulk-delete-students'),
    path('<int:student_id>/progress/', views.student_progress, name='student-progress'),
    
    # Dashboard and analytics (commented out until views are created)
    # path('<int:student_id>/dashboard/', views.student_dashboard, name='student-dashboard'),
    # path('export/', views.export_students, name='export-students'),
]
