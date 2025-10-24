from django.urls import path
from . import views

urlpatterns = [
    # Plagiarism check
    path('plagiarism/', views.PlagiarismCheckListView.as_view(), name='plagiarism-check-list'),
    path('plagiarism/<uuid:pk>/', views.PlagiarismCheckDetailView.as_view(), name='plagiarism-check-detail'),
    path('plagiarism/check/', views.check_plagiarism, name='plagiarism-check'),
    path('plagiarism/<uuid:plagiarism_check_id>/matches/', views.PlagiarismMatchListView.as_view(), name='plagiarism-matches'),
    
    # Grammar check
    path('grammar/', views.GrammarCheckListView.as_view(), name='grammar-check-list'),
    path('grammar/<uuid:pk>/', views.GrammarCheckDetailView.as_view(), name='grammar-check-detail'),
    path('grammar/check/', views.check_grammar, name='grammar-check'),
    path('grammar/<uuid:grammar_check_id>/errors/', views.GrammarErrorListView.as_view(), name='grammar-errors'),
    
    # Topic suggestions
    path('topics/', views.TopicSuggestionListView.as_view(), name='topic-suggestion-list'),
    path('topics/<uuid:pk>/', views.TopicSuggestionDetailView.as_view(), name='topic-suggestion-detail'),
    path('topics/suggest/', views.suggest_topics, name='topic-suggest'),
    path('topics/<uuid:topic_suggestion_id>/similarities/', views.TopicSimilarityListView.as_view(), name='topic-similarities'),
    
    # Logs and statistics
    path('logs/', views.AIEnhancementLogListView.as_view(), name='ai-enhancement-logs'),
    path('search/', views.search_ai_enhancements, name='ai-enhancement-search'),
    path('statistics/', views.ai_enhancement_statistics, name='ai-enhancement-statistics'),
    
    # Settings
    path('settings/', views.AIEnhancementSettingsView.as_view(), name='ai-enhancement-settings'),
]
