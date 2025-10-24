from django.urls import path
from . import views

urlpatterns = [
    # Scoring criteria
    path('criteria/', views.ScoringCriteriaListView.as_view(), name='scoring-criteria-list'),
    path('criteria/<int:pk>/', views.ScoringCriteriaDetailView.as_view(), name='scoring-criteria-detail'),
    
    # Scoring rubrics
    path('rubrics/', views.ScoringRubricListView.as_view(), name='scoring-rubric-list'),
    path('rubrics/<int:pk>/', views.ScoringRubricDetailView.as_view(), name='scoring-rubric-detail'),
    
    # Project scores
    path('projects/', views.ProjectScoreListView.as_view(), name='project-score-list'),
    path('projects/<int:project_id>/', views.ProjectScoreDetailView.as_view(), name='project-score-detail'),
    path('projects/<int:project_id>/score/', views.project_score, name='project-score'),
    
    # Defense scores
    path('defense/', views.DefenseScoreListView.as_view(), name='defense-score-list'),
    path('defense/<int:project_id>/', views.DefenseScoreDetailView.as_view(), name='defense-score-detail'),
    path('defense/<int:project_id>/score/', views.defense_score, name='defense-score'),
    
    # Scoring statistics
    path('statistics/', views.scoring_statistics, name='scoring-statistics'),
    path('leaderboard/', views.scoring_leaderboard, name='scoring-leaderboard'),
]