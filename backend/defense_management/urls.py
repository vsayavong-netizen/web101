from django.urls import path
from . import views

urlpatterns = [
    # Defense schedules
    path('schedules/', views.DefenseScheduleListView.as_view(), name='defense-schedule-list'),
    path('schedules/<uuid:pk>/', views.DefenseScheduleDetailView.as_view(), name='defense-schedule-detail'),
    path('schedules/create/', views.schedule_defense, name='defense-schedule-create'),
    path('schedules/search/', views.search_defense_schedules, name='defense-schedule-search'),
    
    # Defense sessions
    path('sessions/', views.DefenseSessionListView.as_view(), name='defense-session-list'),
    path('sessions/<uuid:pk>/', views.DefenseSessionDetailView.as_view(), name='defense-session-detail'),
    path('sessions/<uuid:defense_schedule_id>/start/', views.start_defense_session, name='defense-session-start'),
    path('sessions/<uuid:defense_session_id>/complete/', views.complete_defense_session, name='defense-session-complete'),
    
    # Defense evaluations
    path('evaluations/', views.DefenseEvaluationListView.as_view(), name='defense-evaluation-list'),
    path('evaluations/<uuid:pk>/', views.DefenseEvaluationDetailView.as_view(), name='defense-evaluation-detail'),
    path('evaluations/submit/', views.submit_evaluation, name='defense-evaluation-submit'),
    path('sessions/<uuid:defense_session_id>/evaluation-summary/', views.defense_evaluation_summary, name='defense-evaluation-summary'),
    
    # Defense results
    path('results/', views.DefenseResultListView.as_view(), name='defense-result-list'),
    path('results/<uuid:pk>/', views.DefenseResultDetailView.as_view(), name='defense-result-detail'),
    path('results/submit/', views.submit_defense_result, name='defense-result-submit'),
    
    # Defense rooms
    path('rooms/', views.DefenseRoomListView.as_view(), name='defense-room-list'),
    path('rooms/<uuid:pk>/', views.DefenseRoomDetailView.as_view(), name='defense-room-detail'),
    path('rooms/<uuid:room_id>/availability/<str:date>/', views.defense_room_availability, name='defense-room-availability'),
    
    # Defense settings
    path('settings/', views.DefenseSettingsListView.as_view(), name='defense-settings-list'),
    path('settings/<uuid:pk>/', views.DefenseSettingsDetailView.as_view(), name='defense-settings-detail'),
    
    # Logs and statistics
    path('logs/', views.DefenseLogListView.as_view(), name='defense-logs'),
    path('statistics/', views.defense_statistics, name='defense-statistics'),
    path('reminders/send/', views.send_defense_reminder, name='defense-reminder-send'),
]
