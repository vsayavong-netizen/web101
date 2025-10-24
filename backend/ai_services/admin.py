from django.contrib import admin
from .models import (
    AIAnalysis, AISecurityAudit, AISystemHealth, AICommunicationAnalysis,
    AIGrammarCheck, AIAdvisorSuggestion, AITopicSimilarity, AIProjectHealth,
    AIStudentAnalysis, AIAnalysisLog
)


@admin.register(AIAnalysis)
class AIAnalysisAdmin(admin.ModelAdmin):
    """Admin interface for AIAnalysis model."""
    pass


@admin.register(AISecurityAudit)
class AISecurityAuditAdmin(admin.ModelAdmin):
    """Admin interface for AISecurityAudit model."""
    pass


@admin.register(AISystemHealth)
class AISystemHealthAdmin(admin.ModelAdmin):
    """Admin interface for AISystemHealth model."""
    pass


@admin.register(AICommunicationAnalysis)
class AICommunicationAnalysisAdmin(admin.ModelAdmin):
    """Admin interface for AICommunicationAnalysis model."""
    pass


@admin.register(AIGrammarCheck)
class AIGrammarCheckAdmin(admin.ModelAdmin):
    """Admin interface for AIGrammarCheck model."""
    pass


@admin.register(AIAdvisorSuggestion)
class AIAdvisorSuggestionAdmin(admin.ModelAdmin):
    """Admin interface for AIAdvisorSuggestion model."""
    pass


@admin.register(AITopicSimilarity)
class AITopicSimilarityAdmin(admin.ModelAdmin):
    """Admin interface for AITopicSimilarity model."""
    pass


@admin.register(AIProjectHealth)
class AIProjectHealthAdmin(admin.ModelAdmin):
    """Admin interface for AIProjectHealth model."""
    pass


@admin.register(AIStudentAnalysis)
class AIStudentAnalysisAdmin(admin.ModelAdmin):
    """Admin interface for AIStudentAnalysis model."""
    pass


@admin.register(AIAnalysisLog)
class AIAnalysisLogAdmin(admin.ModelAdmin):
    """Admin interface for AIAnalysisLog model."""
    pass