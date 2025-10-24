from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinLengthValidator
import uuid

User = get_user_model()


class CommunicationChannel(models.Model):
    """Communication channel model."""
    
    CHANNEL_TYPES = [
        ('project', 'Project Channel'),
        ('advisor', 'Advisor Channel'),
        ('committee', 'Committee Channel'),
        ('general', 'General Channel'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    channel_type = models.CharField(max_length=20, choices=CHANNEL_TYPES)
    project = models.ForeignKey('projects.ProjectGroup', on_delete=models.CASCADE, null=True, blank=True, related_name='channels')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_channels')
    participants = models.ManyToManyField(User, related_name='channels', blank=True)
    is_active = models.BooleanField(default=True)
    is_public = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'communication_channels'
        verbose_name = 'Communication Channel'
        verbose_name_plural = 'Communication Channels'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['channel_type']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.channel_type})"


class Message(models.Model):
    """Message model for communication."""
    
    MESSAGE_TYPES = [
        ('text', 'Text Message'),
        ('file', 'File Message'),
        ('system', 'System Message'),
        ('announcement', 'Announcement'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    channel = models.ForeignKey(CommunicationChannel, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPES, default='text')
    content = models.TextField(validators=[MinLengthValidator(1)])
    reply_to = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    is_edited = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    edited_at = models.DateTimeField(null=True, blank=True)
    
    # File attachment
    attachment = models.FileField(upload_to='message_attachments/', null=True, blank=True)
    attachment_name = models.CharField(max_length=255, blank=True, null=True)
    attachment_size = models.BigIntegerField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'messages'
        verbose_name = 'Message'
        verbose_name_plural = 'Messages'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['channel', 'created_at']),
            models.Index(fields=['sender']),
            models.Index(fields=['message_type']),
        ]
    
    def __str__(self):
        return f"{self.sender.get_full_name()}: {self.content[:50]}..."


class MessageReaction(models.Model):
    """Message reaction model."""
    
    REACTION_TYPES = [
        ('like', 'Like'),
        ('love', 'Love'),
        ('laugh', 'Laugh'),
        ('angry', 'Angry'),
        ('sad', 'Sad'),
        ('wow', 'Wow'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='reactions')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='message_reactions')
    reaction_type = models.CharField(max_length=20, choices=REACTION_TYPES)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'message_reactions'
        verbose_name = 'Message Reaction'
        verbose_name_plural = 'Message Reactions'
        unique_together = ['message', 'user']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.get_full_name()} {self.reaction_type} {self.message.id}"


class MessageRead(models.Model):
    """Message read status model."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='reads')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='message_reads')
    
    # Timestamps
    read_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'message_reads'
        verbose_name = 'Message Read'
        verbose_name_plural = 'Message Reads'
        unique_together = ['message', 'user']
        ordering = ['-read_at']
    
    def __str__(self):
        return f"{self.user.get_full_name()} read {self.message.id}"


class CommunicationLog(models.Model):
    """Communication log for analysis."""
    
    LOG_TYPES = [
        ('message_sent', 'Message Sent'),
        ('message_received', 'Message Received'),
        ('channel_joined', 'Channel Joined'),
        ('channel_left', 'Channel Left'),
        ('file_shared', 'File Shared'),
        ('reaction_added', 'Reaction Added'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='communication_logs')
    channel = models.ForeignKey(CommunicationChannel, on_delete=models.CASCADE, related_name='logs')
    log_type = models.CharField(max_length=20, choices=LOG_TYPES)
    message = models.ForeignKey(Message, on_delete=models.CASCADE, null=True, blank=True, related_name='logs')
    metadata = models.JSONField(default=dict, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'communication_communication_logs'
        verbose_name = 'Communication Log'
        verbose_name_plural = 'Communication Logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['channel', 'created_at']),
            models.Index(fields=['log_type']),
        ]
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.log_type}"


class CommunicationAnalysis(models.Model):
    """Communication analysis results."""
    
    ANALYSIS_TYPES = [
        ('sentiment', 'Sentiment Analysis'),
        ('topic', 'Topic Analysis'),
        ('engagement', 'Engagement Analysis'),
        ('response_time', 'Response Time Analysis'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    channel = models.ForeignKey(CommunicationChannel, on_delete=models.CASCADE, related_name='analyses')
    analysis_type = models.CharField(max_length=20, choices=ANALYSIS_TYPES)
    results = models.JSONField(default=dict)
    confidence_score = models.FloatField(null=True, blank=True)
    analyzed_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='communication_analyses')
    
    # Analysis period
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'communication_analyses'
        verbose_name = 'Communication Analysis'
        verbose_name_plural = 'Communication Analyses'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['channel', 'analysis_type']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.channel.name} - {self.analysis_type}"


class CommunicationSettings(models.Model):
    """Communication settings for users."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='communication_settings')
    
    # Notification settings
    email_notifications = models.BooleanField(default=True)
    push_notifications = models.BooleanField(default=True)
    desktop_notifications = models.BooleanField(default=True)
    
    # Message settings
    auto_read = models.BooleanField(default=False)
    show_typing = models.BooleanField(default=True)
    show_online_status = models.BooleanField(default=True)
    
    # Privacy settings
    show_last_seen = models.BooleanField(default=True)
    allow_direct_messages = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'communication_settings'
        verbose_name = 'Communication Settings'
        verbose_name_plural = 'Communication Settings'
    
    def __str__(self):
        return f"Settings for {self.user.get_full_name()}"
