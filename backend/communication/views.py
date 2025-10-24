from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from core.permissions import RolePermission, RoleRequiredMixin, require_roles, IsAdminOrDepartmentAdmin
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, Max
from django.utils import timezone
from .models import (
    CommunicationChannel, Message, MessageReaction, MessageRead,
    CommunicationLog, CommunicationAnalysis, CommunicationSettings
)
from .serializers import (
    CommunicationChannelSerializer, CommunicationChannelCreateSerializer,
    MessageSerializer, MessageCreateSerializer, MessageUpdateSerializer,
    MessageReactionSerializer, MessageReadSerializer, CommunicationLogSerializer,
    CommunicationAnalysisSerializer, CommunicationSettingsSerializer,
    MessageSearchSerializer, CommunicationStatisticsSerializer,
    ChannelInviteSerializer, DirectMessageSerializer
)
from accounts.models import User
from projects.models import ProjectGroup

"""
Roles & Access (Communication):
- Channels/Messages: Read/Write สำหรับผู้เข้าร่วม, Advisor/DepartmentAdmin/Admin
- Logs/Analysis: Advisor/DepartmentAdmin/Admin
- Settings: ผู้ใช้แก้ของตัวเอง
"""


class CommunicationChannelListView(RoleRequiredMixin, generics.ListCreateAPIView):
    """List and create communication channels."""
    
    serializer_class = CommunicationChannelSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    allowed_roles = ('Admin', 'DepartmentAdmin', 'Advisor', 'Student')
    
    def get_queryset(self):
        user = self.request.user
        return CommunicationChannel.objects.filter(
            Q(participants=user) | Q(is_public=True)
        ).select_related('created_by', 'project').prefetch_related('participants')
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CommunicationChannelCreateSerializer
        return CommunicationChannelSerializer


class CommunicationChannelDetailView(RoleRequiredMixin, generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a communication channel."""
    
    serializer_class = CommunicationChannelSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    allowed_roles = ('Admin', 'DepartmentAdmin', 'Advisor', 'Student')
    
    def get_queryset(self):
        user = self.request.user
        return CommunicationChannel.objects.filter(
            Q(participants=user) | Q(is_public=True)
        ).select_related('created_by', 'project').prefetch_related('participants')

    def perform_update(self, serializer):
        channel = self.get_object()
        # Only channel owner or admin can update
        if not (channel.created_by_id == self.request.user.id or self.request.user.role in ('Admin','DepartmentAdmin')):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Only channel owner or admin can update this channel.')
        serializer.save()

    def perform_destroy(self, instance):
        # Only channel owner or admin can delete
        if not (instance.created_by_id == self.request.user.id or self.request.user.role in ('Admin','DepartmentAdmin')):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Only channel owner or admin can delete this channel.')
        super().perform_destroy(instance)


class MessageListView(RoleRequiredMixin, generics.ListCreateAPIView):
    """List and create messages."""
    
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    allowed_roles = ('Admin', 'DepartmentAdmin', 'Advisor', 'Student')
    
    def get_queryset(self):
        channel_id = self.kwargs.get('channel_id')
        if channel_id:
            return Message.objects.filter(channel_id=channel_id).select_related(
                'sender', 'reply_to', 'reply_to__sender'
            ).prefetch_related('reactions', 'reads')
        return Message.objects.none()
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return MessageCreateSerializer
        return MessageSerializer


class MessageDetailView(RoleRequiredMixin, generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a message."""
    
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    allowed_roles = ('Admin', 'DepartmentAdmin', 'Advisor', 'Student')
    
    def get_queryset(self):
        return Message.objects.select_related('sender', 'channel')
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return MessageUpdateSerializer
        return MessageSerializer


class MessageReactionListView(RoleRequiredMixin, generics.ListCreateAPIView):
    """List and create message reactions."""
    
    serializer_class = MessageReactionSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    allowed_roles = ('Admin', 'DepartmentAdmin', 'Advisor', 'Student')
    
    def get_queryset(self):
        message_id = self.kwargs.get('message_id')
        if message_id:
            return MessageReaction.objects.filter(message_id=message_id).select_related('user')
        return MessageReaction.objects.none()


class MessageReadListView(RoleRequiredMixin, generics.ListCreateAPIView):
    """List and create message reads."""
    
    serializer_class = MessageReadSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    allowed_roles = ('Admin', 'DepartmentAdmin', 'Advisor', 'Student')
    
    def get_queryset(self):
        message_id = self.kwargs.get('message_id')
        if message_id:
            return MessageRead.objects.filter(message_id=message_id).select_related('user')
        return MessageRead.objects.none()


class CommunicationLogListView(RoleRequiredMixin, generics.ListAPIView):
    """List communication logs."""
    
    serializer_class = CommunicationLogSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    allowed_roles = ('Admin', 'DepartmentAdmin', 'Advisor')
    
    def get_queryset(self):
        return CommunicationLog.objects.select_related('user', 'channel', 'message')


class CommunicationAnalysisListView(RoleRequiredMixin, generics.ListCreateAPIView):
    """List and create communication analyses."""
    
    serializer_class = CommunicationAnalysisSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    allowed_roles = ('Admin', 'DepartmentAdmin', 'Advisor')
    
    def get_queryset(self):
        return CommunicationAnalysis.objects.select_related('channel', 'analyzed_by')


class CommunicationSettingsView(RoleRequiredMixin, generics.RetrieveUpdateAPIView):
    """Retrieve and update communication settings."""
    
    serializer_class = CommunicationSettingsSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    allowed_roles = ('Admin', 'DepartmentAdmin', 'Advisor', 'Student')
    
    def get_object(self):
        settings, created = CommunicationSettings.objects.get_or_create(
            user=self.request.user
        )
        return settings


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, RolePermission])
def send_message(request):
    """Send a message to a channel."""
    serializer = MessageCreateSerializer(data=request.data)
    if serializer.is_valid():
        channel = serializer.validated_data.get('channel')
        # Only participants or admins can send
        if not (channel.is_public or channel.participants.filter(id=request.user.id).exists() or request.user.role in ('Admin','DepartmentAdmin')):
            return Response({'detail': 'Not a channel participant.'}, status=status.HTTP_403_FORBIDDEN)
        message = serializer.save(sender=request.user)
        
        # Log the message
        CommunicationLog.objects.create(
            user=request.user,
            channel=message.channel,
            message=message,
            log_type='message_sent',
            metadata={'content_length': len(message.content)}
        )
        
        return Response(MessageSerializer(message).data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, RolePermission])
def add_reaction(request, message_id):
    """Add a reaction to a message."""
    message = get_object_or_404(Message, id=message_id)
    # Only participants can react
    if not (message.channel.participants.filter(id=request.user.id).exists() or request.user.role in ('Admin','DepartmentAdmin')):
        return Response({'detail': 'Not a channel participant.'}, status=status.HTTP_403_FORBIDDEN)
    reaction_type = request.data.get('reaction_type')
    
    if not reaction_type:
        return Response({'error': 'reaction_type is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Remove existing reaction if exists
    MessageReaction.objects.filter(message=message, user=request.user).delete()
    
    # Add new reaction
    reaction = MessageReaction.objects.create(
        message=message,
        user=request.user,
        reaction_type=reaction_type
    )
    
    # Log the reaction
    CommunicationLog.objects.create(
        user=request.user,
        channel=message.channel,
        message=message,
        log_type='reaction_added',
        metadata={'reaction_type': reaction_type}
    )
    
    return Response(MessageReactionSerializer(reaction).data, status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated, RolePermission])
def remove_reaction(request, message_id):
    """Remove a reaction from a message."""
    message = get_object_or_404(Message, id=message_id)
    # Only owner of reaction or admin can remove
    # We delete only current user's reaction; admins can also remove theirs (same effect here)
    MessageReaction.objects.filter(message=message, user=request.user).delete()
    
    return Response({'message': 'Reaction removed'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, RolePermission])
def mark_as_read(request, message_id):
    """Mark a message as read."""
    message = get_object_or_404(Message, id=message_id)
    if not (message.channel.participants.filter(id=request.user.id).exists() or request.user.role in ('Admin','DepartmentAdmin')):
        return Response({'detail': 'Not a channel participant.'}, status=status.HTTP_403_FORBIDDEN)
    MessageRead.objects.get_or_create(message=message, user=request.user)
    
    return Response({'message': 'Message marked as read'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, RolePermission])
def mark_channel_as_read(request, channel_id):
    """Mark all messages in a channel as read."""
    channel = get_object_or_404(CommunicationChannel, id=channel_id)
    if not (channel.participants.filter(id=request.user.id).exists() or request.user.role in ('Admin','DepartmentAdmin')):
        return Response({'detail': 'Not a channel participant.'}, status=status.HTTP_403_FORBIDDEN)
    messages = Message.objects.filter(channel=channel)
    
    for message in messages:
        MessageRead.objects.get_or_create(message=message, user=request.user)
    
    return Response({'message': 'Channel marked as read'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, RolePermission])
def search_messages(request):
    """Search messages."""
    serializer = MessageSearchSerializer(data=request.data)
    if serializer.is_valid():
        queryset = Message.objects.select_related('sender', 'channel')
        
        # Apply filters
        if serializer.validated_data.get('query'):
            queryset = queryset.filter(content__icontains=serializer.validated_data['query'])
        
        if serializer.validated_data.get('channel_id'):
            queryset = queryset.filter(channel_id=serializer.validated_data['channel_id'])
        
        if serializer.validated_data.get('sender_id'):
            queryset = queryset.filter(sender_id=serializer.validated_data['sender_id'])
        
        if serializer.validated_data.get('message_type'):
            queryset = queryset.filter(message_type=serializer.validated_data['message_type'])
        
        if serializer.validated_data.get('has_attachment') is not None:
            if serializer.validated_data['has_attachment']:
                queryset = queryset.exclude(attachment__isnull=True)
            else:
                queryset = queryset.filter(attachment__isnull=True)
        
        # Date filters
        if serializer.validated_data.get('date_from'):
            queryset = queryset.filter(created_at__gte=serializer.validated_data['date_from'])
        
        if serializer.validated_data.get('date_to'):
            queryset = queryset.filter(created_at__lte=serializer.validated_data['date_to'])
        
        # Order by creation date
        queryset = queryset.order_by('-created_at')
        
        return Response(MessageSerializer(queryset, many=True, context={'request': request}).data)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, RolePermission])
def communication_statistics(request):
    """Get communication statistics."""
    # Total messages
    total_messages = Message.objects.count()
    
    # Total channels
    total_channels = CommunicationChannel.objects.count()
    
    # Active users (users who sent messages in the last 30 days)
    thirty_days_ago = timezone.now() - timezone.timedelta(days=30)
    active_users = User.objects.filter(
        sent_messages__created_at__gte=thirty_days_ago
    ).distinct().count()
    
    # Messages by type
    messages_by_type = Message.objects.values('message_type').annotate(count=Count('id'))
    messages_by_type = {item['message_type']: item['count'] for item in messages_by_type}
    
    # Messages by channel
    messages_by_channel = Message.objects.values('channel__name').annotate(count=Count('id'))
    messages_by_channel = {item['channel__name']: item['count'] for item in messages_by_channel}
    
    # Top senders
    top_senders = User.objects.annotate(
        message_count=Count('sent_messages')
    ).order_by('-message_count')[:10]
    top_senders = [{'user': sender.get_full_name(), 'count': sender.message_count} for sender in top_senders]
    
    # Recent activity
    recent_activity = Message.objects.select_related('sender', 'channel').order_by('-created_at')[:10]
    recent_activity = MessageSerializer(recent_activity, many=True, context={'request': request}).data
    
    # Engagement metrics
    engagement_metrics = {
        'average_messages_per_user': total_messages / active_users if active_users > 0 else 0,
        'average_messages_per_channel': total_messages / total_channels if total_channels > 0 else 0,
        'reaction_rate': MessageReaction.objects.count() / total_messages if total_messages > 0 else 0
    }
    
    statistics = {
        'total_messages': total_messages,
        'total_channels': total_channels,
        'active_users': active_users,
        'messages_by_type': messages_by_type,
        'messages_by_channel': messages_by_channel,
        'top_senders': top_senders,
        'recent_activity': recent_activity,
        'engagement_metrics': engagement_metrics
    }
    
    return Response(statistics)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, RolePermission])
def invite_to_channel(request):
    """Invite users to a channel."""
    serializer = ChannelInviteSerializer(data=request.data)
    if serializer.is_valid():
        channel = get_object_or_404(CommunicationChannel, id=serializer.validated_data['channel_id'])
        # Only channel owner/creator or admins can invite
        if not (channel.created_by_id == request.user.id or request.user.role in ('Admin','DepartmentAdmin')):
            return Response({'detail': 'Only channel owner or admin can invite.'}, status=status.HTTP_403_FORBIDDEN)
        user_ids = serializer.validated_data['user_ids']
        
        # Add users to channel
        users = User.objects.filter(id__in=user_ids)
        channel.participants.add(*users)
        
        # Log the invitations
        for user in users:
            CommunicationLog.objects.create(
                user=user,
                channel=channel,
                log_type='channel_joined',
                metadata={'invited_by': request.user.id}
            )
        
        return Response({'message': 'Users invited to channel'}, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, RolePermission])
def send_direct_message(request):
    """Send a direct message to a user."""
    serializer = DirectMessageSerializer(data=request.data)
    if serializer.is_valid():
        recipient = get_object_or_404(User, id=serializer.validated_data['recipient_id'])
        
        # Create or get direct message channel
        channel, created = CommunicationChannel.objects.get_or_create(
            channel_type='direct',
            name=f"DM: {request.user.get_full_name()} & {recipient.get_full_name()}",
            defaults={
                'created_by': request.user,
                'is_public': False
            }
        )
        
        if created:
            channel.participants.add(request.user, recipient)
        else:
            # Ensure both parties are participants
            if not channel.participants.filter(id=request.user.id).exists():
                channel.participants.add(request.user)
            if not channel.participants.filter(id=recipient.id).exists():
                channel.participants.add(recipient)
        
        # Create message
        message = Message.objects.create(
            channel=channel,
            sender=request.user,
            content=serializer.validated_data['content'],
            message_type=serializer.validated_data.get('message_type', 'text')
        )
        
        # Log the message
        CommunicationLog.objects.create(
            user=request.user,
            channel=channel,
            message=message,
            log_type='message_sent',
            metadata={'is_direct_message': True}
        )
        
        return Response(MessageSerializer(message).data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
