from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.db.models import Count, Q
from django.contrib.auth import get_user_model

from .models import (
    MilestoneTemplate, MilestoneTask, Milestone,
    MilestoneSubmission, MilestoneReview
)
from .serializers import (
    MilestoneTemplateSerializer, MilestoneTaskSerializer, MilestoneSerializer,
    MilestoneSubmissionSerializer, MilestoneReviewSerializer,
    MilestoneStatisticsSerializer
)

User = get_user_model()


class MilestoneTemplateListView(generics.ListCreateAPIView):
    """List and create milestone templates."""
    
    queryset = MilestoneTemplate.objects.all()
    serializer_class = MilestoneTemplateSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'estimated_duration_days', 'created_at']
    ordering = ['name']


class MilestoneTemplateDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a milestone template."""
    
    queryset = MilestoneTemplate.objects.all()
    serializer_class = MilestoneTemplateSerializer
    permission_classes = [IsAuthenticated]


class MilestoneTaskListView(generics.ListCreateAPIView):
    """List and create milestone tasks."""
    
    queryset = MilestoneTask.objects.all()
    serializer_class = MilestoneTaskSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['order', 'duration_days', 'created_at']
    ordering = ['template', 'order']
    
    def get_queryset(self):
        """Filter by template if specified."""
        queryset = super().get_queryset()
        template_id = self.request.query_params.get('template_id')
        
        if template_id:
            queryset = queryset.filter(template_id=template_id)
        
        return queryset


class MilestoneTaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a milestone task."""
    
    queryset = MilestoneTask.objects.all()
    serializer_class = MilestoneTaskSerializer
    permission_classes = [IsAuthenticated]


class MilestoneListView(generics.ListCreateAPIView):
    """List and create milestones."""
    
    queryset = Milestone.objects.all()
    serializer_class = MilestoneSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'project_group__project_id']
    ordering_fields = ['due_date', 'status', 'created_at']
    ordering = ['project_group', 'due_date']
    
    def get_queryset(self):
        """Filter milestones based on query parameters."""
        queryset = super().get_queryset()
        
        # Filter by project group
        project_group_id = self.request.query_params.get('project_group_id')
        if project_group_id:
            queryset = queryset.filter(project_group_id=project_group_id)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by template
        template_id = self.request.query_params.get('template_id')
        if template_id:
            queryset = queryset.filter(template_id=template_id)
        
        return queryset


class MilestoneDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a milestone."""
    
    queryset = Milestone.objects.all()
    serializer_class = MilestoneSerializer
    permission_classes = [IsAuthenticated]


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def milestone_submissions(request, milestone_id):
    """Get milestone submissions."""
    
    try:
        milestone = Milestone.objects.get(id=milestone_id)
    except Milestone.DoesNotExist:
        return Response(
            {'error': 'Milestone not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    submissions = MilestoneSubmission.objects.filter(milestone=milestone)
    serializer = MilestoneSubmissionSerializer(submissions, many=True)
    
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def milestone_submit(request, milestone_id):
    """Submit a milestone."""
    
    try:
        milestone = Milestone.objects.get(id=milestone_id)
    except Milestone.DoesNotExist:
        return Response(
            {'error': 'Milestone not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check if user is part of the project group
    if not milestone.project_group.students.filter(id=request.user.id).exists():
        return Response(
            {'error': 'You are not authorized to submit this milestone'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Create submission
    submission_data = {
        'milestone': milestone.id,
        'submitted_by': request.user.id,
        **request.data
    }
    
    serializer = MilestoneSubmissionSerializer(data=submission_data)
    if serializer.is_valid():
        submission = serializer.save()
        
        # Update milestone status
        milestone.status = 'Submitted'
        milestone.submitted_date = submission.submitted_at
        milestone.save()
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def milestone_reviews(request, milestone_id):
    """Get milestone reviews."""
    
    try:
        milestone = Milestone.objects.get(id=milestone_id)
    except Milestone.DoesNotExist:
        return Response(
            {'error': 'Milestone not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    reviews = MilestoneReview.objects.filter(milestone=milestone)
    serializer = MilestoneReviewSerializer(reviews, many=True)
    
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def milestone_review(request, milestone_id):
    """Review a milestone."""
    
    try:
        milestone = Milestone.objects.get(id=milestone_id)
    except Milestone.DoesNotExist:
        return Response(
            {'error': 'Milestone not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check if user is authorized to review (advisor or admin)
    if request.user.role not in ['Advisor', 'Admin', 'DepartmentAdmin']:
        return Response(
            {'error': 'You are not authorized to review milestones'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Create or update review
    review_data = {
        'milestone': milestone.id,
        'reviewer': request.user.id,
        **request.data
    }
    
    review, created = MilestoneReview.objects.get_or_create(
        milestone=milestone,
        reviewer=request.user,
        defaults=review_data
    )
    
    if not created:
        # Update existing review
        for key, value in review_data.items():
            if key not in ['milestone', 'reviewer']:
                setattr(review, key, value)
        review.save()
    
    serializer = MilestoneReviewSerializer(review)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def milestone_statistics(request):
    """Get milestone statistics."""
    
    # Basic counts
    total_milestones = Milestone.objects.count()
    pending_milestones = Milestone.objects.filter(status='Pending').count()
    submitted_milestones = Milestone.objects.filter(status='Submitted').count()
    approved_milestones = Milestone.objects.filter(status='Approved').count()
    
    # Overdue milestones
    overdue_count = Milestone.objects.filter(
        status='Pending',
        due_date__lt=timezone.now().date()
    ).count()
    
    # Milestones by status
    milestones_by_status = {}
    for milestone in Milestone.objects.all():
        status = milestone.status
        milestones_by_status[status] = milestones_by_status.get(status, 0) + 1
    
    statistics = {
        'total_milestones': total_milestones,
        'pending_milestones': pending_milestones,
        'submitted_milestones': submitted_milestones,
        'approved_milestones': approved_milestones,
        'overdue_count': overdue_count,
        'milestones_by_status': milestones_by_status
    }
    
    serializer = MilestoneStatisticsSerializer(statistics)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def overdue_milestones(request):
    """Get overdue milestones."""
    
    overdue_milestones = Milestone.objects.filter(
        status='Pending',
        due_date__lt=timezone.now().date()
    ).order_by('due_date')
    
    serializer = MilestoneSerializer(overdue_milestones, many=True)
    return Response(serializer.data)