from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q, Avg, Sum, Count
from django.utils import timezone

from .models import (
    AIAnalysis, AISecurityAudit, AISystemHealth, AICommunicationAnalysis,
    AIGrammarCheck, AIAdvisorSuggestion, AITopicSimilarity, AIProjectHealth,
    AIStudentAnalysis, AIAnalysisLog
)
from .serializers import (
    AIAnalysisSerializer, AIAnalysisCreateSerializer, AISecurityAuditSerializer,
    AISystemHealthSerializer, AICommunicationAnalysisSerializer, AIGrammarCheckSerializer,
    AIAdvisorSuggestionSerializer, AITopicSimilaritySerializer, AIProjectHealthSerializer,
    AIStudentAnalysisSerializer, AIAnalysisLogSerializer, AIAnalysisBulkUpdateSerializer,
    AIAnalysisSearchSerializer, AIAnalysisStatisticsSerializer
)


class AIAnalysisListView(generics.ListCreateAPIView):
    """List and create AI analyses."""
    
    queryset = AIAnalysis.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AIAnalysisCreateSerializer
        return AIAnalysisSerializer


class AIAnalysisDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete an AI analysis."""
    
    queryset = AIAnalysis.objects.all()
    serializer_class = AIAnalysisSerializer
    permission_classes = [permissions.IsAuthenticated]


class AISecurityAuditListView(generics.ListAPIView):
    """List security audit results."""
    
    queryset = AISecurityAudit.objects.all()
    serializer_class = AISecurityAuditSerializer
    permission_classes = [permissions.IsAuthenticated]


class AISecurityAuditDetailView(generics.RetrieveAPIView):
    """Retrieve security audit details."""
    
    queryset = AISecurityAudit.objects.all()
    serializer_class = AISecurityAuditSerializer
    permission_classes = [permissions.IsAuthenticated]


class AISystemHealthListView(generics.ListAPIView):
    """List system health analysis results."""
    
    queryset = AISystemHealth.objects.all()
    serializer_class = AISystemHealthSerializer
    permission_classes = [permissions.IsAuthenticated]


class AISystemHealthDetailView(generics.RetrieveAPIView):
    """Retrieve system health analysis details."""
    
    queryset = AISystemHealth.objects.all()
    serializer_class = AISystemHealthSerializer
    permission_classes = [permissions.IsAuthenticated]


class AICommunicationAnalysisListView(generics.ListAPIView):
    """List communication analysis results."""
    
    queryset = AICommunicationAnalysis.objects.all()
    serializer_class = AICommunicationAnalysisSerializer
    permission_classes = [permissions.IsAuthenticated]


class AICommunicationAnalysisDetailView(generics.RetrieveAPIView):
    """Retrieve communication analysis details."""
    
    queryset = AICommunicationAnalysis.objects.all()
    serializer_class = AICommunicationAnalysisSerializer
    permission_classes = [permissions.IsAuthenticated]


class AIGrammarCheckListView(generics.ListAPIView):
    """List grammar check results."""
    
    queryset = AIGrammarCheck.objects.all()
    serializer_class = AIGrammarCheckSerializer
    permission_classes = [permissions.IsAuthenticated]


class AIGrammarCheckDetailView(generics.RetrieveAPIView):
    """Retrieve grammar check details."""
    
    queryset = AIGrammarCheck.objects.all()
    serializer_class = AIGrammarCheckSerializer
    permission_classes = [permissions.IsAuthenticated]


class AIAdvisorSuggestionListView(generics.ListAPIView):
    """List advisor suggestion results."""
    
    queryset = AIAdvisorSuggestion.objects.all()
    serializer_class = AIAdvisorSuggestionSerializer
    permission_classes = [permissions.IsAuthenticated]


class AIAdvisorSuggestionDetailView(generics.RetrieveAPIView):
    """Retrieve advisor suggestion details."""
    
    queryset = AIAdvisorSuggestion.objects.all()
    serializer_class = AIAdvisorSuggestionSerializer
    permission_classes = [permissions.IsAuthenticated]


class AITopicSimilarityListView(generics.ListAPIView):
    """List topic similarity analysis results."""
    
    queryset = AITopicSimilarity.objects.all()
    serializer_class = AITopicSimilaritySerializer
    permission_classes = [permissions.IsAuthenticated]


class AITopicSimilarityDetailView(generics.RetrieveAPIView):
    """Retrieve topic similarity analysis details."""
    
    queryset = AITopicSimilarity.objects.all()
    serializer_class = AITopicSimilaritySerializer
    permission_classes = [permissions.IsAuthenticated]


class AIProjectHealthListView(generics.ListAPIView):
    """List project health analysis results."""
    
    queryset = AIProjectHealth.objects.all()
    serializer_class = AIProjectHealthSerializer
    permission_classes = [permissions.IsAuthenticated]


class AIProjectHealthDetailView(generics.RetrieveAPIView):
    """Retrieve project health analysis details."""
    
    queryset = AIProjectHealth.objects.all()
    serializer_class = AIProjectHealthSerializer
    permission_classes = [permissions.IsAuthenticated]


class AIStudentAnalysisListView(generics.ListAPIView):
    """List student analysis results."""
    
    queryset = AIStudentAnalysis.objects.all()
    serializer_class = AIStudentAnalysisSerializer
    permission_classes = [permissions.IsAuthenticated]


class AIStudentAnalysisDetailView(generics.RetrieveAPIView):
    """Retrieve student analysis details."""
    
    queryset = AIStudentAnalysis.objects.all()
    serializer_class = AIStudentAnalysisSerializer
    permission_classes = [permissions.IsAuthenticated]


class AIAnalysisLogListView(generics.ListAPIView):
    """List AI analysis logs."""
    
    queryset = AIAnalysisLog.objects.all()
    serializer_class = AIAnalysisLogSerializer
    permission_classes = [permissions.IsAuthenticated]


class AIAnalysisLogDetailView(generics.RetrieveAPIView):
    """Retrieve AI analysis log details."""
    
    queryset = AIAnalysisLog.objects.all()
    serializer_class = AIAnalysisLogSerializer
    permission_classes = [permissions.IsAuthenticated]


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def ai_service_statistics(request):
    """Get AI analysis statistics for dashboard."""
    analyses = AIAnalysis.objects.all()
    
    # Basic statistics
    total_analyses = analyses.count()
    completed_analyses = analyses.filter(status='completed').count()
    failed_analyses = analyses.filter(status='failed').count()
    pending_analyses = analyses.filter(status='pending').count()
    
    # Type distribution
    type_counts = analyses.values('analysis_type').annotate(count=Count('id')).order_by('-count')
    type_distribution = {
        item['analysis_type']: item['count']
        for item in type_counts
    }
    
    # Status distribution
    status_counts = analyses.values('status').annotate(count=Count('id')).order_by('-count')
    status_distribution = {
        item['status']: item['count']
        for item in status_counts
    }
    
    # Processing statistics
    if analyses.exists():
        average_processing_time = analyses.aggregate(avg=Avg('processing_time'))['avg'] or 0
    else:
        average_processing_time = 0
    
    # Token and cost statistics
    logs = AIAnalysisLog.objects.all()
    total_tokens_used = logs.aggregate(total=Sum('tokens_used'))['total'] or 0
    total_cost = logs.aggregate(total=Sum('cost'))['total'] or 0
    
    # Monthly trend (last 12 months)
    monthly_trend = {}
    for i in range(12):
        month = timezone.now().replace(day=1) - timezone.timedelta(days=30*i)
        next_month = month.replace(day=1) + timezone.timedelta(days=32)
        next_month = next_month.replace(day=1) - timezone.timedelta(days=1)
        
        monthly_count = analyses.filter(
            created_at__gte=month,
            created_at__lte=next_month
        ).count()
        
        month_key = month.strftime('%Y-%m')
        monthly_trend[month_key] = monthly_count
    
    return Response({
        'total_analyses': total_analyses,
        'completed_analyses': completed_analyses,
        'failed_analyses': failed_analyses,
        'pending_analyses': pending_analyses,
        'analysis_type_distribution': type_distribution,
        'status_distribution': status_distribution,
        'average_processing_time': round(average_processing_time, 2),
        'total_tokens_used': total_tokens_used,
        'total_cost': round(total_cost, 2),
        'monthly_analysis_trend': monthly_trend
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def bulk_update_ai_services(request):
    """Bulk update AI analyses."""
    serializer = AIAnalysisBulkUpdateSerializer(data=request.data)
    if serializer.is_valid():
        analysis_ids = serializer.validated_data['analysis_ids']
        updates = serializer.validated_data['updates']
        
        updated_count = 0
        for analysis_id in analysis_ids:
            try:
                analysis = AIAnalysis.objects.get(id=analysis_id)
                for field, value in updates.items():
                    setattr(analysis, field, value)
                analysis.save()
                updated_count += 1
            except AIAnalysis.DoesNotExist:
                continue
        
        return Response({
            'message': f'Updated {updated_count} analyses successfully.',
            'updated_count': updated_count
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def ai_service_search(request):
    """Search AI analyses by various criteria."""
    serializer = AIAnalysisSearchSerializer(data=request.GET)
    if serializer.is_valid():
        params = serializer.validated_data
        queryset = AIAnalysis.objects.all()
        
        # Apply filters
        if params.get('query'):
            query = params['query']
            queryset = queryset.filter(
                Q(summary__icontains=query) |
                Q(input_text__icontains=query)
            )
        
        if params.get('analysis_type'):
            queryset = queryset.filter(analysis_type=params['analysis_type'])
        
        if params.get('status'):
            queryset = queryset.filter(status=params['status'])
        
        if params.get('user_id'):
            queryset = queryset.filter(user_id=params['user_id'])
        
        if params.get('project_group_id'):
            queryset = queryset.filter(project_group_id=params['project_group_id'])
        
        if params.get('academic_year'):
            queryset = queryset.filter(academic_year=params['academic_year'])
        
        if params.get('created_from'):
            queryset = queryset.filter(created_at__gte=params['created_from'])
        
        if params.get('created_to'):
            queryset = queryset.filter(created_at__lte=params['created_to'])
        
        # Serialize results
        serializer = AIAnalysisSerializer(queryset[:50], many=True)  # Limit to 50 results
        
        return Response({
            'results': serializer.data,
            'count': queryset.count()
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def analysis_logs(request, analysis_id):
    """Get logs for a specific analysis."""
    try:
        analysis = AIAnalysis.objects.get(id=analysis_id)
        logs = AIAnalysisLog.objects.filter(analysis=analysis)
        
        serializer = AIAnalysisLogSerializer(logs, many=True)
        
        return Response({
            'analysis': AIAnalysisSerializer(analysis).data,
            'logs': serializer.data,
            'count': logs.count()
        })
    
    except AIAnalysis.DoesNotExist:
        return Response(
            {'error': 'Analysis not found.'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def analysis_by_type(request, analysis_type):
    """Get analyses by type."""
    try:
        analyses = AIAnalysis.objects.filter(analysis_type=analysis_type)
        
        # Filter by status if provided
        status_filter = request.GET.get('status')
        if status_filter:
            analyses = analyses.filter(status=status_filter)
        
        # Filter by user if provided
        user_id = request.GET.get('user_id')
        if user_id:
            analyses = analyses.filter(user_id=user_id)
        
        # Filter by project if provided
        project_group_id = request.GET.get('project_group_id')
        if project_group_id:
            analyses = analyses.filter(project_group_id=project_group_id)
        
        serializer = AIAnalysisSerializer(analyses, many=True)
        
        return Response({
            'analysis_type': analysis_type,
            'analyses': serializer.data,
            'count': analyses.count()
        })
    
    except AIAnalysis.DoesNotExist:
        return Response(
            {'error': 'Analysis type not found.'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def analysis_by_project(request, project_group_id):
    """Get analyses for a specific project."""
    try:
        analyses = AIAnalysis.objects.filter(project_group_id=project_group_id)
        
        # Filter by type if provided
        analysis_type = request.GET.get('analysis_type')
        if analysis_type:
            analyses = analyses.filter(analysis_type=analysis_type)
        
        # Filter by status if provided
        status_filter = request.GET.get('status')
        if status_filter:
            analyses = analyses.filter(status=status_filter)
        
        serializer = AIAnalysisSerializer(analyses, many=True)
        
        return Response({
            'project_group_id': project_group_id,
            'analyses': serializer.data,
            'count': analyses.count()
        })
    
    except AIAnalysis.DoesNotExist:
        return Response(
            {'error': 'Project not found.'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def analysis_by_user(request, user_id):
    """Get analyses for a specific user."""
    try:
        analyses = AIAnalysis.objects.filter(user_id=user_id)
        
        # Filter by type if provided
        analysis_type = request.GET.get('analysis_type')
        if analysis_type:
            analyses = analyses.filter(analysis_type=analysis_type)
        
        # Filter by status if provided
        status_filter = request.GET.get('status')
        if status_filter:
            analyses = analyses.filter(status=status_filter)
        
        serializer = AIAnalysisSerializer(analyses, many=True)
        
        return Response({
            'user_id': user_id,
            'analyses': serializer.data,
            'count': analyses.count()
        })
    
    except AIAnalysis.DoesNotExist:
        return Response(
            {'error': 'User not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
