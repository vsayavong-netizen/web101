from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router for ViewSets
router = DefaultRouter()
# router.register(r'ai-services', views.AIServiceViewSet)  # Uncomment when ViewSet is created

# Function-based view URLs
function_urls = [
    # AI Analysis
    path('analysis/', views.AIAnalysisListView.as_view(), name='ai-analysis-list'),
    path('analysis/<int:pk>/', views.AIAnalysisDetailView.as_view(), name='ai-analysis-detail'),
    
    # AI Security Audit
    path('security-audit/', views.AISecurityAuditListView.as_view(), name='ai-security-audit-list'),
    path('security-audit/<int:pk>/', views.AISecurityAuditDetailView.as_view(), name='ai-security-audit-detail'),
    
    # AI System Health
    path('system-health/', views.AISystemHealthListView.as_view(), name='ai-system-health-list'),
    path('system-health/<int:pk>/', views.AISystemHealthDetailView.as_view(), name='ai-system-health-detail'),
    
    # AI Communication Analysis
    path('communication-analysis/', views.AICommunicationAnalysisListView.as_view(), name='ai-communication-analysis-list'),
    path('communication-analysis/<int:pk>/', views.AICommunicationAnalysisDetailView.as_view(), name='ai-communication-analysis-detail'),
    
    # AI Grammar Check
    path('grammar-check/', views.AIGrammarCheckListView.as_view(), name='ai-grammar-check-list'),
    path('grammar-check/<int:pk>/', views.AIGrammarCheckDetailView.as_view(), name='ai-grammar-check-detail'),
    
    # AI Advisor Suggestion
    path('advisor-suggestion/', views.AIAdvisorSuggestionListView.as_view(), name='ai-advisor-suggestion-list'),
    path('advisor-suggestion/<int:pk>/', views.AIAdvisorSuggestionDetailView.as_view(), name='ai-advisor-suggestion-detail'),
    
    # AI Topic Similarity
    path('topic-similarity/', views.AITopicSimilarityListView.as_view(), name='ai-topic-similarity-list'),
    path('topic-similarity/<int:pk>/', views.AITopicSimilarityDetailView.as_view(), name='ai-topic-similarity-detail'),
    
    # AI Project Health
    path('project-health/', views.AIProjectHealthListView.as_view(), name='ai-project-health-list'),
    path('project-health/<int:pk>/', views.AIProjectHealthDetailView.as_view(), name='ai-project-health-detail'),
    
    # AI Student Analysis
    path('student-analysis/', views.AIStudentAnalysisListView.as_view(), name='ai-student-analysis-list'),
    path('student-analysis/<int:pk>/', views.AIStudentAnalysisDetailView.as_view(), name='ai-student-analysis-detail'),
    
    # AI Analysis Logs
    path('logs/', views.AIAnalysisLogListView.as_view(), name='ai-analysis-log-list'),
    path('logs/<int:pk>/', views.AIAnalysisLogDetailView.as_view(), name='ai-analysis-log-detail'),
    
    # Statistics and search
    path('statistics/', views.ai_service_statistics, name='ai-service-statistics'),
    path('search/', views.ai_service_search, name='ai-service-search'),
    path('bulk-update/', views.bulk_update_ai_services, name='bulk-update-ai-services'),
    
    # Dashboard and analytics (commented out until views are created)
    # path('dashboard/', views.ai_service_dashboard, name='ai-service-dashboard'),
    # path('export/', views.export_ai_services, name='export-ai-services'),
]

# Combine all URLs
urlpatterns = function_urls + router.urls