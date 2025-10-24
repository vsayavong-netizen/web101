from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q, Avg, Count
from django.utils import timezone

from .models import (
    Notification, NotificationTemplate, NotificationSubscription,
    NotificationLog, NotificationAnnouncement, NotificationPreference
)
from .serializers import (
    NotificationSerializer, NotificationCreateSerializer, NotificationUpdateSerializer,
    NotificationTemplateSerializer, NotificationTemplateCreateSerializer,
    NotificationSubscriptionSerializer, NotificationLogSerializer,
    NotificationAnnouncementSerializer, NotificationAnnouncementCreateSerializer,
    NotificationPreferenceSerializer, NotificationPreferenceUpdateSerializer,
    NotificationBulkUpdateSerializer, NotificationSearchSerializer,
    NotificationStatisticsSerializer
)


class NotificationListView(generics.ListCreateAPIView):
    """List and create notifications."""
    
    queryset = Notification.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return NotificationCreateSerializer
        return NotificationSerializer
    
    def get_queryset(self):
        """Filter notifications based on user."""
        user = self.request.user
        return Notification.objects.filter(
            Q(recipient_id=user.id) |
            Q(recipient_id=user.role) |
            Q(recipient_type='all')
        )


class NotificationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a notification."""
    
    queryset = Notification.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return NotificationUpdateSerializer
        return NotificationSerializer


class NotificationTemplateListView(generics.ListCreateAPIView):
    """List and create notification templates."""
    
    queryset = NotificationTemplate.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return NotificationTemplateCreateSerializer
        return NotificationTemplateSerializer


class NotificationTemplateDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a notification template."""
    
    queryset = NotificationTemplate.objects.all()
    serializer_class = NotificationTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]


class NotificationSubscriptionListView(generics.ListCreateAPIView):
    """List and create notification subscriptions."""
    
    queryset = NotificationSubscription.objects.all()
    serializer_class = NotificationSubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]


class NotificationSubscriptionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a notification subscription."""
    
    queryset = NotificationSubscription.objects.all()
    serializer_class = NotificationSubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]


class NotificationAnnouncementListView(generics.ListCreateAPIView):
    """List and create notification announcements."""
    
    queryset = NotificationAnnouncement.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return NotificationAnnouncementCreateSerializer
        return NotificationAnnouncementSerializer


class NotificationAnnouncementDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a notification announcement."""
    
    queryset = NotificationAnnouncement.objects.all()
    serializer_class = NotificationAnnouncementSerializer
    permission_classes = [permissions.IsAuthenticated]


class NotificationPreferenceListView(generics.ListCreateAPIView):
    """List and create notification preferences."""
    
    queryset = NotificationPreference.objects.all()
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]


class NotificationPreferenceDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete notification preferences."""
    
    queryset = NotificationPreference.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return NotificationPreferenceUpdateSerializer
        return NotificationPreferenceSerializer


class NotificationLogListView(generics.ListCreateAPIView):
    """List and create notification logs."""
    
    queryset = NotificationLog.objects.all()
    serializer_class = NotificationLogSerializer
    permission_classes = [permissions.IsAuthenticated]


class NotificationLogDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete notification logs."""
    
    queryset = NotificationLog.objects.all()
    serializer_class = NotificationLogSerializer
    permission_classes = [permissions.IsAuthenticated]


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def notification_statistics(request):
    """Get notification statistics for dashboard."""
    notifications = Notification.objects.all()
    
    # Basic statistics
    total_notifications = notifications.count()
    unread_notifications = notifications.filter(is_read=False).count()
    read_notifications = notifications.filter(is_read=True).count()
    archived_notifications = notifications.filter(is_archived=True).count()
    
    # Type distribution
    type_counts = notifications.values('notification_type').annotate(count=Count('id')).order_by('-count')
    type_distribution = {
        item['notification_type']: item['count']
        for item in type_counts
    }
    
    # Priority distribution
    priority_counts = notifications.values('priority').annotate(count=Count('id')).order_by('-count')
    priority_distribution = {
        item['priority']: item['count']
        for item in priority_counts
    }
    
    # Recipient distribution
    recipient_counts = notifications.values('recipient_id').annotate(count=Count('id')).order_by('-count')[:10]
    recipient_distribution = {
        item['recipient_id']: item['count']
        for item in recipient_counts
    }
    
    # Delivery statistics
    logs = NotificationLog.objects.all()
    if logs.exists():
        successful_deliveries = logs.filter(status='sent').count()
        total_deliveries = logs.count()
        delivery_success_rate = (successful_deliveries / total_deliveries * 100) if total_deliveries > 0 else 0
        
        # Average delivery time (placeholder)
        average_delivery_time = 0  # TODO: Implement actual delivery time calculation
    else:
        delivery_success_rate = 0
        average_delivery_time = 0
    
    # Monthly trend (last 12 months)
    monthly_trend = {}
    for i in range(12):
        month = timezone.now().replace(day=1) - timezone.timedelta(days=30*i)
        next_month = month.replace(day=1) + timezone.timedelta(days=32)
        next_month = next_month.replace(day=1) - timezone.timedelta(days=1)
        
        monthly_count = notifications.filter(
            created_at__gte=month,
            created_at__lte=next_month
        ).count()
        
        month_key = month.strftime('%Y-%m')
        monthly_trend[month_key] = monthly_count
    
    return Response({
        'total_notifications': total_notifications,
        'unread_notifications': unread_notifications,
        'read_notifications': read_notifications,
        'archived_notifications': archived_notifications,
        'notification_type_distribution': type_distribution,
        'priority_distribution': priority_distribution,
        'recipient_distribution': recipient_distribution,
        'delivery_success_rate': round(delivery_success_rate, 2),
        'average_delivery_time': average_delivery_time,
        'monthly_notification_trend': monthly_trend
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def bulk_update_notifications(request):
    """Bulk update notification status."""
    serializer = NotificationBulkUpdateSerializer(data=request.data)
    if serializer.is_valid():
        notification_ids = serializer.validated_data['notification_ids']
        updates = serializer.validated_data['updates']
        
        updated_count = 0
        for notification_id in notification_ids:
            try:
                notification = Notification.objects.get(id=notification_id)
                for field, value in updates.items():
                    setattr(notification, field, value)
                notification.save()
                updated_count += 1
            except Notification.DoesNotExist:
                continue
        
        return Response({
            'message': f'Updated {updated_count} notifications successfully.',
            'updated_count': updated_count
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def notification_search(request):
    """Search notifications by various criteria."""
    serializer = NotificationSearchSerializer(data=request.GET)
    if serializer.is_valid():
        params = serializer.validated_data
        queryset = Notification.objects.all()
        
        # Apply filters
        if params.get('query'):
            query = params['query']
            queryset = queryset.filter(
                Q(title__icontains=query) |
                Q(message__icontains=query)
            )
        
        if params.get('notification_type'):
            queryset = queryset.filter(notification_type=params['notification_type'])
        
        if params.get('priority'):
            queryset = queryset.filter(priority=params['priority'])
        
        if params.get('is_read') is not None:
            queryset = queryset.filter(is_read=params['is_read'])
        
        if params.get('is_archived') is not None:
            queryset = queryset.filter(is_archived=params['is_archived'])
        
        if params.get('recipient_id'):
            queryset = queryset.filter(recipient_id=params['recipient_id'])
        
        if params.get('created_from'):
            queryset = queryset.filter(created_at__gte=params['created_from'])
        
        if params.get('created_to'):
            queryset = queryset.filter(created_at__lte=params['created_to'])
        
        # Serialize results
        serializer = NotificationSerializer(queryset[:50], many=True)  # Limit to 50 results
        
        return Response({
            'results': serializer.data,
            'count': queryset.count()
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_notifications(request, user_id):
    """Get notifications for a specific user."""
    notifications = Notification.objects.filter(
        Q(recipient_id=user_id) |
        Q(recipient_id=request.user.role) |
        Q(recipient_type='all')
    )
    
    # Filter by status if provided
    is_read = request.GET.get('is_read')
    if is_read is not None:
        notifications = notifications.filter(is_read=is_read.lower() == 'true')
    
    is_archived = request.GET.get('is_archived')
    if is_archived is not None:
        notifications = notifications.filter(is_archived=is_archived.lower() == 'true')
    
    # Filter by type if provided
    notification_type = request.GET.get('notification_type')
    if notification_type:
        notifications = notifications.filter(notification_type=notification_type)
    
    # Filter by priority if provided
    priority = request.GET.get('priority')
    if priority:
        notifications = notifications.filter(priority=priority)
    
    serializer = NotificationSerializer(notifications, many=True)
    
    return Response({
        'user_id': user_id,
        'notifications': serializer.data,
        'count': notifications.count()
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_notifications_read(request):
    """Mark notifications as read."""
    notification_ids = request.data.get('notification_ids', [])
    
    if not notification_ids:
        return Response(
            {'error': 'notification_ids is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    updated_count = 0
    for notification_id in notification_ids:
        try:
            notification = Notification.objects.get(id=notification_id)
            notification.mark_as_read()
            updated_count += 1
        except Notification.DoesNotExist:
            continue
    
    return Response({
        'message': f'Marked {updated_count} notifications as read.',
        'updated_count': updated_count
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_notifications_archived(request):
    """Mark notifications as archived."""
    notification_ids = request.data.get('notification_ids', [])
    
    if not notification_ids:
        return Response(
            {'error': 'notification_ids is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    updated_count = 0
    for notification_id in notification_ids:
        try:
            notification = Notification.objects.get(id=notification_id)
            notification.mark_as_archived()
            updated_count += 1
        except Notification.DoesNotExist:
            continue
    
    return Response({
        'message': f'Marked {updated_count} notifications as archived.',
        'updated_count': updated_count
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def active_announcements(request):
    """Get active announcements for the current user."""
    user = request.user
    
    # Get announcements that are active and target the user
    announcements = NotificationAnnouncement.objects.filter(
        is_published=True,
        expires_at__gt=timezone.now()
    ).filter(
        Q(target_roles__contains=[user.role]) |
        Q(target_users__contains=[user.id]) |
        Q(target_roles__isnull=True, target_users__isnull=True)
    )
    
    # Filter by type if provided
    announcement_type = request.GET.get('announcement_type')
    if announcement_type:
        announcements = announcements.filter(announcement_type=announcement_type)
    
    # Filter by priority if provided
    priority = request.GET.get('priority')
    if priority:
        announcements = announcements.filter(priority=priority)
    
    serializer = NotificationAnnouncementSerializer(announcements, many=True)
    
    return Response({
        'announcements': serializer.data,
        'count': announcements.count()
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def notification_preferences(request, user_id):
    """Get notification preferences for a user."""
    try:
        preferences = NotificationPreference.objects.get(user_id=user_id)
        serializer = NotificationPreferenceSerializer(preferences)
        return Response(serializer.data)
    
    except NotificationPreference.DoesNotExist:
        return Response(
            {'error': 'Notification preferences not found.'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['PUT'])
@permission_classes([permissions.IsAuthenticated])
def update_notification_preferences(request, user_id):
    """Update notification preferences for a user."""
    try:
        preferences = NotificationPreference.objects.get(user_id=user_id)
        serializer = NotificationPreferenceUpdateSerializer(preferences, data=request.data)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    except NotificationPreference.DoesNotExist:
        return Response(
            {'error': 'Notification preferences not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
