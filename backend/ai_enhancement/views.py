from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, Sum, Avg
from django.utils import timezone
from .models import (
    PlagiarismCheck, PlagiarismMatch, GrammarCheck, GrammarError,
    TopicSuggestion, TopicSimilarity, AIEnhancementLog, AIEnhancementSettings
)
from .serializers import (
    PlagiarismCheckSerializer, PlagiarismCheckCreateSerializer, PlagiarismMatchSerializer,
    GrammarCheckSerializer, GrammarCheckCreateSerializer, GrammarErrorSerializer,
    TopicSuggestionSerializer, TopicSuggestionCreateSerializer, TopicSimilaritySerializer,
    AIEnhancementLogSerializer, AIEnhancementSettingsSerializer,
    PlagiarismCheckRequestSerializer, GrammarCheckRequestSerializer,
    TopicSuggestionRequestSerializer, TopicSimilarityRequestSerializer,
    AIEnhancementSearchSerializer, AIEnhancementStatisticsSerializer,
    PlagiarismResultSerializer, GrammarResultSerializer, TopicSuggestionResultSerializer
)
from projects.models import ProjectGroup
from accounts.models import User
import time
import random


class PlagiarismCheckListView(generics.ListCreateAPIView):
    """List and create plagiarism checks."""
    
    serializer_class = PlagiarismCheckSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return PlagiarismCheck.objects.filter(user=self.request.user).select_related('project')
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PlagiarismCheckCreateSerializer
        return PlagiarismCheckSerializer


class PlagiarismCheckDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a plagiarism check."""
    
    serializer_class = PlagiarismCheckSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return PlagiarismCheck.objects.filter(user=self.request.user).select_related('project')


class PlagiarismMatchListView(generics.ListAPIView):
    """List plagiarism matches."""
    
    serializer_class = PlagiarismMatchSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        plagiarism_check_id = self.kwargs.get('plagiarism_check_id')
        if plagiarism_check_id:
            return PlagiarismMatch.objects.filter(
                plagiarism_check_id=plagiarism_check_id,
                plagiarism_check__user=self.request.user
            )
        return PlagiarismMatch.objects.none()


class GrammarCheckListView(generics.ListCreateAPIView):
    """List and create grammar checks."""
    
    serializer_class = GrammarCheckSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return GrammarCheck.objects.filter(user=self.request.user).select_related('project')
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return GrammarCheckCreateSerializer
        return GrammarCheckSerializer


class GrammarCheckDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a grammar check."""
    
    serializer_class = GrammarCheckSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return GrammarCheck.objects.filter(user=self.request.user).select_related('project')


class GrammarErrorListView(generics.ListAPIView):
    """List grammar errors."""
    
    serializer_class = GrammarErrorSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        grammar_check_id = self.kwargs.get('grammar_check_id')
        if grammar_check_id:
            return GrammarError.objects.filter(
                grammar_check_id=grammar_check_id,
                grammar_check__user=self.request.user
            )
        return GrammarError.objects.none()


class TopicSuggestionListView(generics.ListCreateAPIView):
    """List and create topic suggestions."""
    
    serializer_class = TopicSuggestionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return TopicSuggestion.objects.filter(user=self.request.user).select_related('project')
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return TopicSuggestionCreateSerializer
        return TopicSuggestionSerializer


class TopicSuggestionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a topic suggestion."""
    
    serializer_class = TopicSuggestionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return TopicSuggestion.objects.filter(user=self.request.user).select_related('project')


class TopicSimilarityListView(generics.ListAPIView):
    """List topic similarities."""
    
    serializer_class = TopicSimilaritySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        topic_suggestion_id = self.kwargs.get('topic_suggestion_id')
        if topic_suggestion_id:
            return TopicSimilarity.objects.filter(
                topic_suggestion_id=topic_suggestion_id,
                topic_suggestion__user=self.request.user
            )
        return TopicSimilarity.objects.none()


class AIEnhancementLogListView(generics.ListAPIView):
    """List AI enhancement logs."""
    
    serializer_class = AIEnhancementLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return AIEnhancementLog.objects.filter(user=self.request.user)


class AIEnhancementSettingsView(generics.RetrieveUpdateAPIView):
    """Retrieve and update AI enhancement settings."""
    
    serializer_class = AIEnhancementSettingsSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        settings, created = AIEnhancementSettings.objects.get_or_create(
            user=self.request.user
        )
        return settings


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def check_plagiarism(request):
    """Check for plagiarism in a document."""
    serializer = PlagiarismCheckRequestSerializer(data=request.data)
    if serializer.is_valid():
        project = get_object_or_404(ProjectGroup, project_id=serializer.validated_data['project_id'])
        
        # Create plagiarism check
        plagiarism_check = PlagiarismCheck.objects.create(
            user=request.user,
            project=project,
            check_type=serializer.validated_data['check_type'],
            document_name=serializer.validated_data['document_name'],
            document_content=serializer.validated_data['document_content'],
            file_path=serializer.validated_data.get('file_path', ''),
            status='processing'
        )
        
        # Simulate AI processing
        start_time = time.time()
        
        # Mock plagiarism detection
        similarity_score = random.uniform(0, 100)
        is_plagiarized = similarity_score > 20.0
        confidence_score = random.uniform(80, 100)
        
        # Create mock matches if plagiarized
        matches = []
        if is_plagiarized:
            for i in range(random.randint(1, 5)):
                match = PlagiarismMatch.objects.create(
                    plagiarism_check=plagiarism_check,
                    source_url=f"https://example.com/source{i}",
                    source_title=f"Source Document {i+1}",
                    similarity_percentage=random.uniform(10, similarity_score),
                    matched_text=f"Matched text sample {i+1}",
                    context_before="Context before...",
                    context_after="Context after..."
                )
                matches.append(PlagiarismMatchSerializer(match).data)
        
        processing_time = time.time() - start_time
        tokens_used = random.randint(100, 1000)
        cost = tokens_used * 0.0001
        
        # Update plagiarism check
        plagiarism_check.similarity_score = similarity_score
        plagiarism_check.is_plagiarized = is_plagiarized
        plagiarism_check.confidence_score = confidence_score
        plagiarism_check.processing_time = processing_time
        plagiarism_check.tokens_used = tokens_used
        plagiarism_check.cost = cost
        plagiarism_check.status = 'completed'
        plagiarism_check.completed_at = timezone.now()
        plagiarism_check.save()
        
        # Log the processing
        AIEnhancementLog.objects.create(
            user=request.user,
            service_type='plagiarism',
            request_data=serializer.validated_data,
            response_data={'similarity_score': similarity_score, 'is_plagiarized': is_plagiarized},
            processing_time=processing_time,
            tokens_used=tokens_used,
            cost=cost,
            success=True
        )
        
        result = {
            'similarity_score': similarity_score,
            'is_plagiarized': is_plagiarized,
            'confidence_score': confidence_score,
            'matches': matches,
            'processing_time': processing_time,
            'tokens_used': tokens_used,
            'cost': cost
        }
        
        return Response(result, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def check_grammar(request):
    """Check grammar in text."""
    serializer = GrammarCheckRequestSerializer(data=request.data)
    if serializer.is_valid():
        project = get_object_or_404(ProjectGroup, project_id=serializer.validated_data['project_id'])
        
        # Create grammar check
        grammar_check = GrammarCheck.objects.create(
            user=request.user,
            project=project,
            check_type=serializer.validated_data['check_type'],
            text_content=serializer.validated_data['text_content'],
            language=serializer.validated_data.get('language', 'en'),
            status='processing'
        )
        
        # Simulate AI processing
        start_time = time.time()
        
        # Mock grammar checking
        total_errors = random.randint(0, 10)
        total_suggestions = random.randint(0, 15)
        grammar_score = max(0, 100 - (total_errors * 10))
        
        # Create mock errors
        errors = []
        for i in range(total_errors):
            error = GrammarError.objects.create(
                grammar_check=grammar_check,
                error_type=random.choice(['grammar', 'spelling', 'punctuation', 'style', 'clarity']),
                severity=random.choice(['low', 'medium', 'high', 'critical']),
                original_text=f"Error text {i+1}",
                suggested_text=f"Corrected text {i+1}",
                explanation=f"Explanation for error {i+1}",
                start_position=i * 10,
                end_position=(i * 10) + 5
            )
            errors.append(GrammarErrorSerializer(error).data)
        
        processing_time = time.time() - start_time
        tokens_used = random.randint(50, 500)
        cost = tokens_used * 0.0001
        
        # Update grammar check
        grammar_check.total_errors = total_errors
        grammar_check.total_suggestions = total_suggestions
        grammar_check.grammar_score = grammar_score
        grammar_check.processing_time = processing_time
        grammar_check.tokens_used = tokens_used
        grammar_check.cost = cost
        grammar_check.status = 'completed'
        grammar_check.completed_at = timezone.now()
        grammar_check.save()
        
        # Log the processing
        AIEnhancementLog.objects.create(
            user=request.user,
            service_type='grammar',
            request_data=serializer.validated_data,
            response_data={'total_errors': total_errors, 'grammar_score': grammar_score},
            processing_time=processing_time,
            tokens_used=tokens_used,
            cost=cost,
            success=True
        )
        
        result = {
            'total_errors': total_errors,
            'total_suggestions': total_suggestions,
            'grammar_score': grammar_score,
            'errors': errors,
            'processing_time': processing_time,
            'tokens_used': tokens_used,
            'cost': cost
        }
        
        return Response(result, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def suggest_topics(request):
    """Suggest topics based on user input."""
    serializer = TopicSuggestionRequestSerializer(data=request.data)
    if serializer.is_valid():
        project = get_object_or_404(ProjectGroup, project_id=serializer.validated_data['project_id'])
        
        # Create topic suggestion
        topic_suggestion = TopicSuggestion.objects.create(
            user=request.user,
            project=project,
            suggestion_type=serializer.validated_data['suggestion_type'],
            user_input=serializer.validated_data['user_input'],
            status='processing'
        )
        
        # Simulate AI processing
        start_time = time.time()
        
        # Mock topic suggestions
        suggestions = [
            f"Topic suggestion 1 for {serializer.validated_data['user_input']}",
            f"Topic suggestion 2 for {serializer.validated_data['user_input']}",
            f"Topic suggestion 3 for {serializer.validated_data['user_input']}",
            f"Topic suggestion 4 for {serializer.validated_data['user_input']}",
            f"Topic suggestion 5 for {serializer.validated_data['user_input']}"
        ]
        
        confidence_scores = [random.uniform(70, 95) for _ in range(len(suggestions))]
        keywords = [f"keyword{i}" for i in range(1, 6)]
        
        # Create mock similarities
        similarities = []
        for i, suggestion in enumerate(suggestions):
            similarity = TopicSimilarity.objects.create(
                topic_suggestion=topic_suggestion,
                similar_topic=suggestion,
                similarity_score=confidence_scores[i],
                source=f"Source {i+1}",
                description=f"Description for {suggestion}"
            )
            similarities.append(TopicSimilaritySerializer(similarity).data)
        
        processing_time = time.time() - start_time
        tokens_used = random.randint(200, 800)
        cost = tokens_used * 0.0001
        
        # Update topic suggestion
        topic_suggestion.suggestions = suggestions
        topic_suggestion.confidence_scores = confidence_scores
        topic_suggestion.keywords = keywords
        topic_suggestion.processing_time = processing_time
        topic_suggestion.tokens_used = tokens_used
        topic_suggestion.cost = cost
        topic_suggestion.status = 'completed'
        topic_suggestion.completed_at = timezone.now()
        topic_suggestion.save()
        
        # Log the processing
        AIEnhancementLog.objects.create(
            user=request.user,
            service_type='topic',
            request_data=serializer.validated_data,
            response_data={'suggestions': suggestions, 'confidence_scores': confidence_scores},
            processing_time=processing_time,
            tokens_used=tokens_used,
            cost=cost,
            success=True
        )
        
        result = {
            'suggestions': suggestions,
            'confidence_scores': confidence_scores,
            'keywords': keywords,
            'similarities': similarities,
            'processing_time': processing_time,
            'tokens_used': tokens_used,
            'cost': cost
        }
        
        return Response(result, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def search_ai_enhancements(request):
    """Search AI enhancements."""
    serializer = AIEnhancementSearchSerializer(data=request.data)
    if serializer.is_valid():
        queryset = AIEnhancementLog.objects.filter(user=request.user)
        
        # Apply filters
        if serializer.validated_data.get('query'):
            queryset = queryset.filter(
                Q(request_data__icontains=serializer.validated_data['query']) |
                Q(response_data__icontains=serializer.validated_data['query'])
            )
        
        if serializer.validated_data.get('service_type'):
            queryset = queryset.filter(service_type=serializer.validated_data['service_type'])
        
        if serializer.validated_data.get('status'):
            queryset = queryset.filter(success=serializer.validated_data['status'] == 'success')
        
        # Date filters
        if serializer.validated_data.get('date_from'):
            queryset = queryset.filter(created_at__gte=serializer.validated_data['date_from'])
        
        if serializer.validated_data.get('date_to'):
            queryset = queryset.filter(created_at__lte=serializer.validated_data['date_to'])
        
        # Order by creation date
        queryset = queryset.order_by('-created_at')
        
        return Response(AIEnhancementLogSerializer(queryset, many=True).data)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def ai_enhancement_statistics(request):
    """Get AI enhancement statistics."""
    user = request.user
    
    # Total checks
    total_checks = AIEnhancementLog.objects.filter(user=user).count()
    
    # Service-specific counts
    plagiarism_checks = AIEnhancementLog.objects.filter(user=user, service_type='plagiarism').count()
    grammar_checks = AIEnhancementLog.objects.filter(user=user, service_type='grammar').count()
    topic_suggestions = AIEnhancementLog.objects.filter(user=user, service_type='topic').count()
    
    # Success rate
    successful_checks = AIEnhancementLog.objects.filter(user=user, success=True).count()
    success_rate = (successful_checks / total_checks * 100) if total_checks > 0 else 0
    
    # Average processing time
    avg_processing_time = AIEnhancementLog.objects.filter(user=user).aggregate(
        avg_time=Avg('processing_time')
    )['avg_time'] or 0
    
    # Total tokens and cost
    total_tokens = AIEnhancementLog.objects.filter(user=user).aggregate(
        total_tokens=Sum('tokens_used')
    )['total_tokens'] or 0
    
    total_cost = AIEnhancementLog.objects.filter(user=user).aggregate(
        total_cost=Sum('cost')
    )['total_cost'] or 0
    
    # Service usage
    service_usage = AIEnhancementLog.objects.filter(user=user).values('service_type').annotate(
        count=Count('id')
    )
    service_usage = {item['service_type']: item['count'] for item in service_usage}
    
    # Monthly usage (last 12 months)
    monthly_usage = {}
    for i in range(12):
        month_start = timezone.now().replace(day=1) - timezone.timedelta(days=30*i)
        month_end = month_start + timezone.timedelta(days=30)
        count = AIEnhancementLog.objects.filter(
            user=user,
            created_at__gte=month_start,
            created_at__lt=month_end
        ).count()
        monthly_usage[month_start.strftime('%Y-%m')] = count
    
    # Top users (for admin)
    top_users = User.objects.annotate(
        usage_count=Count('ai_enhancement_logs')
    ).order_by('-usage_count')[:10]
    top_users = [{'user': user.get_full_name(), 'count': user.usage_count} for user in top_users]
    
    # Recent activity
    recent_activity = AIEnhancementLog.objects.filter(user=user).order_by('-created_at')[:10]
    recent_activity = AIEnhancementLogSerializer(recent_activity, many=True).data
    
    statistics = {
        'total_checks': total_checks,
        'plagiarism_checks': plagiarism_checks,
        'grammar_checks': grammar_checks,
        'topic_suggestions': topic_suggestions,
        'success_rate': success_rate,
        'average_processing_time': avg_processing_time,
        'total_tokens_used': total_tokens,
        'total_cost': total_cost,
        'service_usage': service_usage,
        'monthly_usage': monthly_usage,
        'top_users': top_users,
        'recent_activity': recent_activity
    }
    
    return Response(statistics)
