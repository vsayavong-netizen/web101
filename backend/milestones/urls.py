from django.urls import path
from . import views

urlpatterns = [
    # Milestone templates
    path('templates/', views.MilestoneTemplateListView.as_view(), name='milestone-template-list'),
    path('templates/<int:pk>/', views.MilestoneTemplateDetailView.as_view(), name='milestone-template-detail'),
    
    # Milestone tasks
    path('tasks/', views.MilestoneTaskListView.as_view(), name='milestone-task-list'),
    path('tasks/<int:pk>/', views.MilestoneTaskDetailView.as_view(), name='milestone-task-detail'),
    
    # Project milestones
    path('', views.MilestoneListView.as_view(), name='milestone-list'),
    path('<int:pk>/', views.MilestoneDetailView.as_view(), name='milestone-detail'),
    
    # Milestone submissions
    path('<int:milestone_id>/submissions/', views.milestone_submissions, name='milestone-submissions'),
    path('<int:milestone_id>/submit/', views.milestone_submit, name='milestone-submit'),
    
    # Milestone reviews
    path('<int:milestone_id>/reviews/', views.milestone_reviews, name='milestone-reviews'),
    path('<int:milestone_id>/review/', views.milestone_review, name='milestone-review'),
    
    # Milestone statistics
    path('statistics/', views.milestone_statistics, name='milestone-statistics'),
    path('overdue/', views.overdue_milestones, name='overdue-milestones'),
]