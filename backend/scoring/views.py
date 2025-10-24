from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.db.models import Count, Avg, Q
from django.contrib.auth import get_user_model

from .models import (
    ScoringCriteria, ScoringRubric, ScoringRubricCriteria,
    ProjectScore, ProjectScoreDetail, DefenseScore
)
from .serializers import (
    ScoringCriteriaSerializer, ScoringRubricSerializer, ScoringRubricCriteriaSerializer,
    ProjectScoreSerializer, ProjectScoreDetailSerializer, DefenseScoreSerializer,
    ScoringStatisticsSerializer
)

User = get_user_model()


class ScoringCriteriaListView(generics.ListCreateAPIView):
    """List and create scoring criteria."""
    
    queryset = ScoringCriteria.objects.all()
    serializer_class = ScoringCriteriaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'weight', 'created_at']
    ordering = ['weight', 'name']


class ScoringCriteriaDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete scoring criteria."""
    
    queryset = ScoringCriteria.objects.all()
    serializer_class = ScoringCriteriaSerializer
    permission_classes = [IsAuthenticated]


class ScoringRubricListView(generics.ListCreateAPIView):
    """List and create scoring rubrics."""
    
    queryset = ScoringRubric.objects.all()
    serializer_class = ScoringRubricSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'project_type']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']


class ScoringRubricDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete scoring rubrics."""
    
    queryset = ScoringRubric.objects.all()
    serializer_class = ScoringRubricSerializer
    permission_classes = [IsAuthenticated]


class ProjectScoreListView(generics.ListCreateAPIView):
    """List and create project scores."""
    
    queryset = ProjectScore.objects.all()
    serializer_class = ProjectScoreSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['project_group__project_id', 'scorer__first_name', 'scorer__last_name']
    ordering_fields = ['total_score', 'scored_at']
    ordering = ['-scored_at']
    
    def get_queryset(self):
        """Filter project scores based on query parameters."""
        queryset = super().get_queryset()
        
        # Filter by project group
        project_group_id = self.request.query_params.get('project_group_id')
        if project_group_id:
            queryset = queryset.filter(project_group_id=project_group_id)
        
        # Filter by scorer
        scorer_id = self.request.query_params.get('scorer_id')
        if scorer_id:
            queryset = queryset.filter(scorer_id=scorer_id)
        
        # Filter final scores only
        final_only = self.request.query_params.get('final_only', 'false').lower() == 'true'
        if final_only:
            queryset = queryset.filter(is_final=True)
        
        return queryset


class ProjectScoreDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete project scores."""
    
    queryset = ProjectScore.objects.all()
    serializer_class = ProjectScoreSerializer
    permission_classes = [IsAuthenticated]


class DefenseScoreListView(generics.ListCreateAPIView):
    """List and create defense scores."""
    
    queryset = DefenseScore.objects.all()
    serializer_class = DefenseScoreSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['project_group__project_id', 'scorer__first_name', 'scorer__last_name']
    ordering_fields = ['total_score', 'scored_at']
    ordering = ['-scored_at']
    
    def get_queryset(self):
        """Filter defense scores based on query parameters."""
        queryset = super().get_queryset()
        
        # Filter by project group
        project_group_id = self.request.query_params.get('project_group_id')
        if project_group_id:
            queryset = queryset.filter(project_group_id=project_group_id)
        
        # Filter by scorer
        scorer_id = self.request.query_params.get('scorer_id')
        if scorer_id:
            queryset = queryset.filter(scorer_id=scorer_id)
        
        return queryset


class DefenseScoreDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete defense scores."""
    
    queryset = DefenseScore.objects.all()
    serializer_class = DefenseScoreSerializer
    permission_classes = [IsAuthenticated]


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def project_score(request, project_id):
    """Score a project."""
    
    try:
        project_group = ProjectGroup.objects.get(project_id=project_id)
    except ProjectGroup.DoesNotExist:
        return Response(
            {'error': 'Project not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check if user is authorized to score (advisor or admin)
    if request.user.role not in ['Advisor', 'Admin', 'DepartmentAdmin']:
        return Response(
            {'error': 'You are not authorized to score projects'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Create or update project score
    score_data = {
        'project_group': project_group.id,
        'scorer': request.user.id,
        **request.data
    }
    
    score, created = ProjectScore.objects.get_or_create(
        project_group=project_group,
        scorer=request.user,
        defaults=score_data
    )
    
    if not created:
        # Update existing score
        for key, value in score_data.items():
            if key not in ['project_group', 'scorer']:
                setattr(score, key, value)
        score.save()
    
    serializer = ProjectScoreSerializer(score)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def defense_score(request, project_id):
    """Score a defense presentation."""
    
    try:
        project_group = ProjectGroup.objects.get(project_id=project_id)
    except ProjectGroup.DoesNotExist:
        return Response(
            {'error': 'Project not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check if user is authorized to score (advisor or admin)
    if request.user.role not in ['Advisor', 'Admin', 'DepartmentAdmin']:
        return Response(
            {'error': 'You are not authorized to score defenses'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Create or update defense score
    score_data = {
        'project_group': project_group.id,
        'scorer': request.user.id,
        **request.data
    }
    
    score, created = DefenseScore.objects.get_or_create(
        project_group=project_group,
        scorer=request.user,
        defaults=score_data
    )
    
    if not created:
        # Update existing score
        for key, value in score_data.items():
            if key not in ['project_group', 'scorer']:
                setattr(score, key, value)
        score.save()
    
    serializer = DefenseScoreSerializer(score)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def scoring_statistics(request):
    """Get scoring statistics."""
    
    # Basic counts
    total_scores = ProjectScore.objects.count()
    final_scores = ProjectScore.objects.filter(is_final=True).count()
    total_defense_scores = DefenseScore.objects.count()
    
    # Average scores
    avg_project_score = ProjectScore.objects.aggregate(
        avg_score=Avg('total_score')
    )['avg_score'] or 0
    
    avg_defense_score = DefenseScore.objects.aggregate(
        avg_score=Avg('total_score')
    )['avg_score'] or 0
    
    # Scores by rubric
    scores_by_rubric = {}
    for score in ProjectScore.objects.filter(is_final=True):
        rubric_name = score.rubric.name
        scores_by_rubric[rubric_name] = scores_by_rubric.get(rubric_name, 0) + 1
    
    statistics = {
        'total_scores': total_scores,
        'final_scores': final_scores,
        'total_defense_scores': total_defense_scores,
        'average_project_score': round(avg_project_score, 2),
        'average_defense_score': round(avg_defense_score, 2),
        'scores_by_rubric': scores_by_rubric
    }
    
    serializer = ScoringStatisticsSerializer(statistics)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def scoring_leaderboard(request):
    """Get scoring leaderboard."""
    
    # Get top projects by score
    top_projects = ProjectScore.objects.filter(
        is_final=True
    ).order_by('-total_score')[:10]
    
    serializer = ProjectScoreSerializer(top_projects, many=True)
    return Response(serializer.data)