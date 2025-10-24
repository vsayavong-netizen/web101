from django.urls import path
from . import views

urlpatterns = [
    # Major CRUD
    path('', views.MajorListView.as_view(), name='major-list'),
    path('<int:pk>/', views.MajorDetailView.as_view(), name='major-detail'),
    
    # Major specializations
    path('specializations/', views.MajorSpecializationListView.as_view(), name='major-specialization-list'),
    
    # Major requirements
    path('requirements/', views.MajorRequirementListView.as_view(), name='major-requirement-list'),
    
    # Major statistics and utilities
    path('statistics/', views.major_statistics, name='major-statistics'),
    path('bulk-update/', views.major_bulk_update, name='major-bulk-update'),
    path('dropdown/', views.major_dropdown, name='major-dropdown'),
]