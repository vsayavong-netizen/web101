from rest_framework import serializers
from .models import (
    CommunicationChannel, Message, MessageReaction, MessageRead,
    CommunicationLog, CommunicationAnalysis, CommunicationSettings
)
from accounts.models import User
from projects.models import ProjectGroup


class CommunicationChannelSerializer(serializers.ModelSerializer):
    """Serializer for CommunicationChannel model."""
    
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    participants_names = serializers.StringRelatedField(source='participants', many=True, read_only=True)
    message_count = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = CommunicationChannel
        fields = [
            'id', 'name', 'description', 'channel_type', 'project',
            'created_by', 'created_by_name', 'participants', 'participants_names',
            'is_active', 'is_public', 'message_count', 'unread_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_message_count(self, obj):
        return obj.messages.count()
    
    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.messages.filter(
                reads__user=request.user
            ).count()
        return 0


class CommunicationChannelCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating CommunicationChannel."""
    
    class Meta:
        model = CommunicationChannel
        fields = [
            'name', 'description', 'channel_type', 'project',
            'participants', 'is_public'
        ]


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for Message model."""
    
    sender_name = serializers.CharField(source='sender.get_full_name', read_only=True)
    sender_avatar = serializers.CharField(source='sender.avatar', read_only=True)
    reply_to_content = serializers.CharField(source='reply_to.content', read_only=True)
    reply_to_sender = serializers.CharField(source='reply_to.sender.get_full_name', read_only=True)
    reactions = serializers.SerializerMethodField()
    is_read = serializers.SerializerMethodField()
    attachment_size_human = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = [
            'id', 'channel', 'sender', 'sender_name', 'sender_avatar',
            'message_type', 'content', 'reply_to', 'reply_to_content', 'reply_to_sender',
            'is_edited', 'is_deleted', 'edited_at', 'attachment', 'attachment_name',
            'attachment_size', 'attachment_size_human', 'reactions', 'is_read',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'edited_at']
    
    def get_reactions(self, obj):
        reactions = obj.reactions.all()
        reaction_counts = {}
        for reaction in reactions:
            reaction_type = reaction.reaction_type
            if reaction_type not in reaction_counts:
                reaction_counts[reaction_type] = 0
            reaction_counts[reaction_type] += 1
        return reaction_counts
    
    def get_is_read(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.reads.filter(user=request.user).exists()
        return False
    
    def get_attachment_size_human(self, obj):
        if obj.attachment_size:
            for unit in ['B', 'KB', 'MB', 'GB']:
                if obj.attachment_size < 1024.0:
                    return f"{obj.attachment_size:.1f} {unit}"
                obj.attachment_size /= 1024.0
            return f"{obj.attachment_size:.1f} TB"
        return None


class MessageCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating Message."""
    
    class Meta:
        model = Message
        fields = [
            'channel', 'content', 'message_type', 'reply_to',
            'attachment', 'attachment_name'
        ]
    
    def create(self, validated_data):
        # Set attachment size if file is provided
        if validated_data.get('attachment'):
            file = validated_data['attachment']
            validated_data['attachment_size'] = file.size
            validated_data['attachment_name'] = file.name
        
        return super().create(validated_data)


class MessageUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating Message."""
    
    class Meta:
        model = Message
        fields = ['content']
    
    def update(self, instance, validated_data):
        instance.is_edited = True
        return super().update(instance, validated_data)


class MessageReactionSerializer(serializers.ModelSerializer):
    """Serializer for MessageReaction model."""
    
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = MessageReaction
        fields = ['id', 'message', 'user', 'user_name', 'reaction_type', 'created_at']
        read_only_fields = ['id', 'created_at']


class MessageReadSerializer(serializers.ModelSerializer):
    """Serializer for MessageRead model."""
    
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = MessageRead
        fields = ['id', 'message', 'user', 'user_name', 'read_at']
        read_only_fields = ['id', 'read_at']


class CommunicationLogSerializer(serializers.ModelSerializer):
    """Serializer for CommunicationLog model."""
    
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    channel_name = serializers.CharField(source='channel.name', read_only=True)
    
    class Meta:
        model = CommunicationLog
        fields = [
            'id', 'user', 'user_name', 'channel', 'channel_name',
            'log_type', 'message', 'metadata', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class CommunicationAnalysisSerializer(serializers.ModelSerializer):
    """Serializer for CommunicationAnalysis model."""
    
    analyzed_by_name = serializers.CharField(source='analyzed_by.get_full_name', read_only=True)
    channel_name = serializers.CharField(source='channel.name', read_only=True)
    
    class Meta:
        model = CommunicationAnalysis
        fields = [
            'id', 'channel', 'channel_name', 'analysis_type', 'results',
            'confidence_score', 'analyzed_by', 'analyzed_by_name',
            'start_date', 'end_date', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CommunicationSettingsSerializer(serializers.ModelSerializer):
    """Serializer for CommunicationSettings model."""
    
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = CommunicationSettings
        fields = [
            'id', 'user', 'user_name', 'email_notifications', 'push_notifications',
            'desktop_notifications', 'auto_read', 'show_typing', 'show_online_status',
            'show_last_seen', 'allow_direct_messages', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class MessageSearchSerializer(serializers.Serializer):
    """Serializer for message search."""
    
    query = serializers.CharField(required=False)
    channel_id = serializers.UUIDField(required=False)
    sender_id = serializers.IntegerField(required=False)
    message_type = serializers.ChoiceField(choices=Message.MESSAGE_TYPES, required=False)
    date_from = serializers.DateTimeField(required=False)
    date_to = serializers.DateTimeField(required=False)
    has_attachment = serializers.BooleanField(required=False)


class CommunicationStatisticsSerializer(serializers.Serializer):
    """Serializer for communication statistics."""
    
    total_messages = serializers.IntegerField()
    total_channels = serializers.IntegerField()
    active_users = serializers.IntegerField()
    messages_by_type = serializers.DictField()
    messages_by_channel = serializers.DictField()
    top_senders = serializers.ListField()
    recent_activity = serializers.ListField()
    engagement_metrics = serializers.DictField()


class ChannelInviteSerializer(serializers.Serializer):
    """Serializer for channel invitations."""
    
    channel_id = serializers.UUIDField()
    user_ids = serializers.ListField(child=serializers.IntegerField())
    message = serializers.CharField(required=False, allow_blank=True)


class DirectMessageSerializer(serializers.Serializer):
    """Serializer for direct messages."""
    
    recipient_id = serializers.IntegerField()
    content = serializers.CharField()
    message_type = serializers.ChoiceField(choices=Message.MESSAGE_TYPES, default='text')
    attachment = serializers.FileField(required=False)
