from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router for ViewSets
router = DefaultRouter()
# router.register(r'advisors', views.AdvisorViewSet)  # Uncomment when ViewSet is created

urlpatterns = [
    # Advisors
    path('', views.AdvisorListView.as_view(), name='advisor-list'),
    path('<int:pk>/', views.AdvisorDetailView.as_view(), name='advisor-detail'),
    
    # Specializations
    path('<int:advisor_id>/specializations/', views.AdvisorSpecializationListView.as_view(), name='advisor-specialization-list'),
    path('<int:advisor_id>/specializations/<int:pk>/', views.AdvisorSpecializationDetailView.as_view(), name='advisor-specialization-detail'),
    
    # Workload
    path('<int:advisor_id>/workload/', views.AdvisorWorkloadListView.as_view(), name='advisor-workload-list'),
    
    # Performance
    path('<int:advisor_id>/performance/', views.AdvisorPerformanceListView.as_view(), name='advisor-performance-list'),
    
    # Availability
    path('<int:advisor_id>/availability/', views.AdvisorAvailabilityListView.as_view(), name='advisor-availability-list'),
    path('<int:advisor_id>/availability/check/', views.advisor_availability, name='advisor-availability-check'),
    
    # Notes
    path('<int:advisor_id>/notes/', views.AdvisorNoteListView.as_view(), name='advisor-note-list'),
    path('<int:advisor_id>/notes/<int:pk>/', views.AdvisorNoteDetailView.as_view(), name='advisor-note-detail'),
    
    # Statistics and search
    path('statistics/', views.advisor_statistics, name='advisor-statistics'),
    path('search/', views.advisor_search, name='advisor-search'),
    path('bulk-update/', views.bulk_update_advisors, name='bulk-update-advisors'),
    path('workload-summary/', views.advisor_workload_summary, name='advisor-workload-summary'),
    path('<int:advisor_id>/performance/', views.advisor_performance, name='advisor-performance'),
    
    # Dashboard and analytics (commented out until views are created)
    # path('<int:advisor_id>/dashboard/', views.advisor_dashboard, name='advisor-dashboard'),
    # path('export/', views.export_advisors, name='export-advisors'),
] + router.urls
