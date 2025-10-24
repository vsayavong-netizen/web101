from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid

User = get_user_model()


class PlagiarismCheck(models.Model):
    """Plagiarism check model."""
    
    CHECK_TYPES = [
        ('document', 'Document Check'),
        ('code', 'Code Check'),
        ('text', 'Text Check'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='plagiarism_checks')
    project = models.ForeignKey('projects.ProjectGroup', on_delete=models.CASCADE, related_name='plagiarism_checks')
    check_type = models.CharField(max_length=20, choices=CHECK_TYPES)
    document_name = models.CharField(max_length=255)
    document_content = models.TextField()
    file_path = models.CharField(max_length=500, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Results
    similarity_score = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)],
        null=True, blank=True
    )
    is_plagiarized = models.BooleanField(default=False)
    confidence_score = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)],
        null=True, blank=True
    )
    
    # Processing details
    processing_time = models.FloatField(null=True, blank=True)  # in seconds
    tokens_used = models.IntegerField(null=True, blank=True)
    cost = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'plagiarism_checks'
        verbose_name = 'Plagiarism Check'
        verbose_name_plural = 'Plagiarism Checks'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['project', 'created_at']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.document_name} - {self.similarity_score}%"


class PlagiarismMatch(models.Model):
    """Plagiarism match details."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    plagiarism_check = models.ForeignKey(PlagiarismCheck, on_delete=models.CASCADE, related_name='matches')
    source_url = models.URLField(max_length=500)
    source_title = models.CharField(max_length=255)
    similarity_percentage = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)]
    )
    matched_text = models.TextField()
    context_before = models.TextField(blank=True, null=True)
    context_after = models.TextField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'plagiarism_matches'
        verbose_name = 'Plagiarism Match'
        verbose_name_plural = 'Plagiarism Matches'
        ordering = ['-similarity_percentage']
    
    def __str__(self):
        return f"{self.source_title} - {self.similarity_percentage}%"


class GrammarCheck(models.Model):
    """Grammar check model."""
    
    CHECK_TYPES = [
        ('text', 'Text Check'),
        ('document', 'Document Check'),
        ('code', 'Code Check'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='grammar_checks')
    project = models.ForeignKey('projects.ProjectGroup', on_delete=models.CASCADE, related_name='grammar_checks')
    check_type = models.CharField(max_length=20, choices=CHECK_TYPES)
    text_content = models.TextField()
    language = models.CharField(max_length=10, default='en')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Results
    total_errors = models.IntegerField(default=0)
    total_suggestions = models.IntegerField(default=0)
    grammar_score = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)],
        null=True, blank=True
    )
    
    # Processing details
    processing_time = models.FloatField(null=True, blank=True)
    tokens_used = models.IntegerField(null=True, blank=True)
    cost = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'grammar_checks'
        verbose_name = 'Grammar Check'
        verbose_name_plural = 'Grammar Checks'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['project', 'created_at']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"Grammar Check - {self.total_errors} errors"


class GrammarError(models.Model):
    """Grammar error details."""
    
    ERROR_TYPES = [
        ('grammar', 'Grammar Error'),
        ('spelling', 'Spelling Error'),
        ('punctuation', 'Punctuation Error'),
        ('style', 'Style Error'),
        ('clarity', 'Clarity Error'),
    ]
    
    SEVERITY_LEVELS = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    grammar_check = models.ForeignKey(GrammarCheck, on_delete=models.CASCADE, related_name='errors')
    error_type = models.CharField(max_length=20, choices=ERROR_TYPES)
    severity = models.CharField(max_length=20, choices=SEVERITY_LEVELS)
    original_text = models.TextField()
    suggested_text = models.TextField()
    explanation = models.TextField(blank=True, null=True)
    start_position = models.IntegerField()
    end_position = models.IntegerField()
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'grammar_errors'
        verbose_name = 'Grammar Error'
        verbose_name_plural = 'Grammar Errors'
        ordering = ['start_position']
    
    def __str__(self):
        return f"{self.error_type} - {self.original_text[:50]}..."


class TopicSuggestion(models.Model):
    """Topic suggestion model."""
    
    SUGGESTION_TYPES = [
        ('research', 'Research Topic'),
        ('thesis', 'Thesis Topic'),
        ('project', 'Project Topic'),
        ('paper', 'Paper Topic'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='topic_suggestions')
    project = models.ForeignKey('projects.ProjectGroup', on_delete=models.CASCADE, related_name='topic_suggestions')
    suggestion_type = models.CharField(max_length=20, choices=SUGGESTION_TYPES)
    user_input = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Results
    suggestions = models.JSONField(default=list, blank=True)
    confidence_scores = models.JSONField(default=list, blank=True)
    keywords = models.JSONField(default=list, blank=True)
    
    # Processing details
    processing_time = models.FloatField(null=True, blank=True)
    tokens_used = models.IntegerField(null=True, blank=True)
    cost = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'topic_suggestions'
        verbose_name = 'Topic Suggestion'
        verbose_name_plural = 'Topic Suggestions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['project', 'created_at']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"Topic Suggestion - {self.suggestion_type}"


class TopicSimilarity(models.Model):
    """Topic similarity analysis."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    topic_suggestion = models.ForeignKey(TopicSuggestion, on_delete=models.CASCADE, related_name='similarities')
    similar_topic = models.CharField(max_length=255)
    similarity_score = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)]
    )
    source = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'ai_enhancement_topic_similarities'
        verbose_name = 'Topic Similarity'
        verbose_name_plural = 'Topic Similarities'
        ordering = ['-similarity_score']
    
    def __str__(self):
        return f"{self.similar_topic} - {self.similarity_score}%"


class AIEnhancementLog(models.Model):
    """AI enhancement processing log."""
    
    SERVICE_TYPES = [
        ('plagiarism', 'Plagiarism Check'),
        ('grammar', 'Grammar Check'),
        ('topic', 'Topic Suggestion'),
        ('similarity', 'Topic Similarity'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_enhancement_logs')
    service_type = models.CharField(max_length=20, choices=SERVICE_TYPES)
    request_data = models.JSONField(default=dict)
    response_data = models.JSONField(default=dict)
    processing_time = models.FloatField()
    tokens_used = models.IntegerField()
    cost = models.DecimalField(max_digits=10, decimal_places=4)
    success = models.BooleanField(default=True)
    error_message = models.TextField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'ai_enhancement_logs'
        verbose_name = 'AI Enhancement Log'
        verbose_name_plural = 'AI Enhancement Logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['service_type']),
            models.Index(fields=['success']),
        ]
    
    def __str__(self):
        return f"{self.service_type} - {self.user.get_full_name()}"


class AIEnhancementSettings(models.Model):
    """AI enhancement settings."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='ai_enhancement_settings')
    
    # Plagiarism settings
    plagiarism_threshold = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)],
        default=20.0
    )
    plagiarism_notifications = models.BooleanField(default=True)
    
    # Grammar settings
    grammar_language = models.CharField(max_length=10, default='en')
    grammar_notifications = models.BooleanField(default=True)
    
    # Topic suggestion settings
    topic_suggestion_count = models.IntegerField(default=5)
    topic_suggestion_notifications = models.BooleanField(default=True)
    
    # General settings
    auto_processing = models.BooleanField(default=False)
    cost_limit = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'ai_enhancement_settings'
        verbose_name = 'AI Enhancement Settings'
        verbose_name_plural = 'AI Enhancement Settings'
    
    def __str__(self):
        return f"AI Settings for {self.user.get_full_name()}"
