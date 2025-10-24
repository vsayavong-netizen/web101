from django.db import models
from django.utils import timezone


class AIAnalysisType(models.TextChoices):
    """AI analysis type choices."""
    SECURITY_AUDIT = 'security_audit', 'Security Audit'
    SYSTEM_HEALTH = 'system_health', 'System Health'
    COMMUNICATION_ANALYSIS = 'communication_analysis', 'Communication Analysis'
    GRAMMAR_CHECK = 'grammar_check', 'Grammar Check'
    ADVISOR_SUGGESTION = 'advisor_suggestion', 'Advisor Suggestion'
    TOPIC_SIMILARITY = 'topic_similarity', 'Topic Similarity'
    PROJECT_HEALTH = 'project_health', 'Project Health'
    STUDENT_ANALYSIS = 'student_analysis', 'Student Analysis'


class AIAnalysisStatus(models.TextChoices):
    """AI analysis status choices."""
    PENDING = 'pending', 'Pending'
    PROCESSING = 'processing', 'Processing'
    COMPLETED = 'completed', 'Completed'
    FAILED = 'failed', 'Failed'
    CANCELLED = 'cancelled', 'Cancelled'


class AIAnalysis(models.Model):
    """AI analysis model for storing analysis results."""
    
    analysis_type = models.CharField(max_length=50, choices=AIAnalysisType.choices)
    status = models.CharField(max_length=20, choices=AIAnalysisStatus.choices, default=AIAnalysisStatus.PENDING)
    
    # Input data
    input_data = models.JSONField()  # Raw input data for analysis
    input_text = models.TextField(blank=True, null=True)  # Text input for analysis
    
    # Results
    result_data = models.JSONField(blank=True, null=True)  # Analysis results
    summary = models.TextField(blank=True, null=True)  # Human-readable summary
    confidence_score = models.FloatField(blank=True, null=True)  # AI confidence score (0-1)
    
    # Context
    project_group_id = models.CharField(max_length=50, blank=True, null=True)
    user_id = models.CharField(max_length=50, blank=True, null=True)
    academic_year = models.CharField(max_length=10, default='2024-2025')
    
    # Processing details
    processing_time = models.FloatField(blank=True, null=True)  # Processing time in seconds
    error_message = models.TextField(blank=True, null=True)
    retry_count = models.IntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'ai_analyses'
        verbose_name = 'AI Analysis'
        verbose_name_plural = 'AI Analyses'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.analysis_type} - {self.status} ({self.created_at})"


class AISecurityAudit(models.Model):
    """AI security audit results."""
    
    analysis = models.OneToOneField(AIAnalysis, on_delete=models.CASCADE, related_name='security_audit')
    
    # Audit results
    weak_passwords = models.JSONField(default=list)  # List of weak passwords
    suspicious_activity = models.JSONField(default=list)  # List of suspicious activities
    inappropriate_content = models.JSONField(default=list)  # List of inappropriate content
    security_recommendations = models.JSONField(default=list)  # List of recommendations
    
    # Risk assessment
    overall_risk_level = models.CharField(max_length=20, default='low')  # low, medium, high, critical
    risk_score = models.FloatField(default=0.0)  # Risk score (0-100)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'ai_security_audits'
        verbose_name = 'AI Security Audit'
        verbose_name_plural = 'AI Security Audits'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Security Audit - {self.overall_risk_level} ({self.risk_score})"


class AISystemHealth(models.Model):
    """AI system health analysis results."""
    
    analysis = models.OneToOneField(AIAnalysis, on_delete=models.CASCADE, related_name='system_health')
    
    # Health issues
    stale_projects = models.JSONField(default=list)  # List of stale projects
    overloaded_advisors = models.JSONField(default=list)  # List of overloaded advisors
    unassigned_students = models.JSONField(default=list)  # List of unassigned students
    system_issues = models.JSONField(default=list)  # List of system issues
    
    # Health metrics
    overall_health_score = models.FloatField(default=0.0)  # Overall health score (0-100)
    system_efficiency = models.FloatField(default=0.0)  # System efficiency score
    resource_utilization = models.FloatField(default=0.0)  # Resource utilization score
    
    # Recommendations
    improvement_suggestions = models.JSONField(default=list)  # List of improvement suggestions
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'ai_system_health'
        verbose_name = 'AI System Health'
        verbose_name_plural = 'AI System Health'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"System Health - {self.overall_health_score}%"


class AICommunicationAnalysis(models.Model):
    """AI communication analysis results."""
    
    analysis = models.OneToOneField(AIAnalysis, on_delete=models.CASCADE, related_name='communication_analysis')
    
    # Analysis results
    sentiment = models.CharField(max_length=20, default='neutral')  # positive, neutral, negative
    sentiment_trend = models.CharField(max_length=20, default='stable')  # improving, declining, stable, mixed
    response_time = models.CharField(max_length=20, default='average')  # prompt, average, delayed
    feedback_clarity = models.CharField(max_length=50, default='clear')  # clear, mostly_clear, needs_improvement
    student_engagement = models.CharField(max_length=20, default='moderate')  # high, moderate, low
    
    # Action items
    action_items = models.JSONField(default=list)  # List of action items
    potential_issues = models.JSONField(default=list)  # List of potential issues
    
    # Scores
    communication_score = models.FloatField(default=0.0)  # Communication quality score
    engagement_score = models.FloatField(default=0.0)  # Student engagement score
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'ai_communication_analysis'
        verbose_name = 'AI Communication Analysis'
        verbose_name_plural = 'AI Communication Analysis'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Communication Analysis - {self.sentiment} ({self.communication_score})"


class AIGrammarCheck(models.Model):
    """AI grammar check results."""
    
    analysis = models.OneToOneField(AIAnalysis, on_delete=models.CASCADE, related_name='grammar_check')
    
    # Grammar check results
    original_text = models.TextField()
    corrected_text = models.TextField()
    grammar_errors = models.JSONField(default=list)  # List of grammar errors
    style_suggestions = models.JSONField(default=list)  # List of style suggestions
    
    # Scores
    grammar_score = models.FloatField(default=0.0)  # Grammar score (0-100)
    style_score = models.FloatField(default=0.0)  # Style score (0-100)
    overall_score = models.FloatField(default=0.0)  # Overall score (0-100)
    
    # Improvement summary
    improvement_summary = models.TextField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'ai_grammar_checks'
        verbose_name = 'AI Grammar Check'
        verbose_name_plural = 'AI Grammar Checks'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Grammar Check - {self.overall_score}%"


class AIAdvisorSuggestion(models.Model):
    """AI advisor suggestion results."""
    
    analysis = models.OneToOneField(AIAnalysis, on_delete=models.CASCADE, related_name='advisor_suggestion')
    
    # Project context
    project_topic = models.CharField(max_length=500)
    project_major = models.CharField(max_length=200)
    
    # Suggestions
    suggested_advisors = models.JSONField(default=list)  # List of suggested advisors
    match_scores = models.JSONField(default=dict)  # Match scores for each advisor
    reasoning = models.JSONField(default=list)  # Reasoning for each suggestion
    
    # Best match
    best_match_advisor = models.CharField(max_length=200, blank=True, null=True)
    best_match_score = models.FloatField(default=0.0)
    best_match_reasoning = models.TextField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'ai_advisor_suggestions'
        verbose_name = 'AI Advisor Suggestion'
        verbose_name_plural = 'AI Advisor Suggestions'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Advisor Suggestion - {self.best_match_advisor} ({self.best_match_score})"


class AITopicSimilarity(models.Model):
    """AI topic similarity analysis results."""
    
    analysis = models.OneToOneField(AIAnalysis, on_delete=models.CASCADE, related_name='topic_similarity')
    
    # Topic information
    input_topic = models.CharField(max_length=500)
    similar_topics = models.JSONField(default=list)  # List of similar topics
    similarity_scores = models.JSONField(default=dict)  # Similarity scores
    
    # Best match
    most_similar_topic = models.CharField(max_length=500, blank=True, null=True)
    similarity_percentage = models.FloatField(default=0.0)
    similarity_reason = models.TextField(blank=True, null=True)
    
    # Risk assessment
    plagiarism_risk = models.CharField(max_length=20, default='low')  # low, medium, high
    risk_score = models.FloatField(default=0.0)  # Risk score (0-100)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'ai_topic_similarities'
        verbose_name = 'AI Topic Similarity'
        verbose_name_plural = 'AI Topic Similarities'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Topic Similarity - {self.similarity_percentage}% ({self.plagiarism_risk})"


class AIProjectHealth(models.Model):
    """AI project health analysis results."""
    
    analysis = models.OneToOneField(AIAnalysis, on_delete=models.CASCADE, related_name='project_health')
    
    # Project information
    project_id = models.CharField(max_length=50)
    project_topic = models.CharField(max_length=500)
    
    # Health assessment
    health_status = models.CharField(max_length=20, default='on_track')  # on_track, needs_attention, at_risk
    health_score = models.FloatField(default=0.0)  # Health score (0-100)
    
    # Issues and recommendations
    identified_issues = models.JSONField(default=list)  # List of identified issues
    recommendations = models.JSONField(default=list)  # List of recommendations
    action_items = models.JSONField(default=list)  # List of action items
    
    # Progress metrics
    progress_score = models.FloatField(default=0.0)  # Progress score
    quality_score = models.FloatField(default=0.0)  # Quality score
    timeline_score = models.FloatField(default=0.0)  # Timeline score
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'ai_project_health'
        verbose_name = 'AI Project Health'
        verbose_name_plural = 'AI Project Health'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Project Health - {self.project_id} ({self.health_status})"


class AIStudentAnalysis(models.Model):
    """AI student analysis results."""
    
    analysis = models.OneToOneField(AIAnalysis, on_delete=models.CASCADE, related_name='student_analysis')
    
    # Student information
    student_id = models.CharField(max_length=50)
    student_name = models.CharField(max_length=200)
    
    # Analysis results
    academic_performance = models.FloatField(default=0.0)  # Academic performance score
    engagement_level = models.CharField(max_length=20, default='moderate')  # high, moderate, low
    skill_assessment = models.JSONField(default=dict)  # Skill assessment results
    learning_style = models.CharField(max_length=50, default='balanced')  # visual, auditory, kinesthetic, balanced
    
    # Recommendations
    improvement_areas = models.JSONField(default=list)  # List of improvement areas
    skill_recommendations = models.JSONField(default=list)  # List of skill recommendations
    study_suggestions = models.JSONField(default=list)  # List of study suggestions
    
    # Overall assessment
    overall_score = models.FloatField(default=0.0)  # Overall assessment score
    potential_grade = models.CharField(max_length=10, default='B')  # Predicted grade
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'ai_student_analysis'
        verbose_name = 'AI Student Analysis'
        verbose_name_plural = 'AI Student Analysis'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Student Analysis - {self.student_name} ({self.overall_score})"


class AIAnalysisLog(models.Model):
    """Log of AI analysis requests and responses."""
    
    analysis = models.ForeignKey(AIAnalysis, on_delete=models.CASCADE, related_name='logs')
    request_data = models.JSONField()  # Request data sent to AI
    response_data = models.JSONField()  # Response data from AI
    processing_time = models.FloatField()  # Processing time in seconds
    tokens_used = models.IntegerField(default=0)  # Number of tokens used
    cost = models.FloatField(default=0.0)  # Cost of the analysis
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'ai_analysis_logs'
        verbose_name = 'AI Analysis Log'
        verbose_name_plural = 'AI Analysis Logs'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Analysis Log - {self.analysis.analysis_type} ({self.processing_time}s)"
