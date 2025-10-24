from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone

from .models import (
    Advisor, AdvisorSpecialization, AdvisorWorkload, AdvisorPerformance,
    AdvisorAvailability, AdvisorNote
)
from .serializers import (
    AdvisorSerializer, AdvisorCreateSerializer, AdvisorUpdateSerializer,
    AdvisorSpecializationSerializer, AdvisorWorkloadSerializer, AdvisorPerformanceSerializer,
    AdvisorAvailabilitySerializer, AdvisorNoteSerializer, AdvisorBulkUpdateSerializer,
    AdvisorSearchSerializer, AdvisorWorkloadSummarySerializer
)


class AdvisorListView(generics.ListCreateAPIView):
    """List and create advisors."""
    
    queryset = Advisor.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AdvisorCreateSerializer
        return AdvisorSerializer
    
    def get_queryset(self):
        """Filter advisors based on user role and permissions."""
        user = self.request.user
        queryset = Advisor.objects.all()
        
        # Students can see all advisors
        if user.role == 'Student':
            pass  # No filtering
        
        # Advisors can see other advisors
        elif user.role == 'Advisor':
            pass  # No filtering
        
        # Department admins can see advisors in their department
        elif user.role == 'DepartmentAdmin':
            # TODO: Add department filtering logic
            pass
        
        # Admins can see all advisors
        elif user.role == 'Admin':
            pass  # No filtering
        
        return queryset


class AdvisorDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete an advisor."""
    
    queryset = Advisor.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return AdvisorUpdateSerializer
        return AdvisorSerializer


class AdvisorSpecializationListView(generics.ListCreateAPIView):
    """List and create specializations for an advisor."""
    
    serializer_class = AdvisorSpecializationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get specializations for a specific advisor."""
        advisor_id = self.kwargs.get('advisor_id')
        return AdvisorSpecialization.objects.filter(advisor_id=advisor_id)
    
    def perform_create(self, serializer):
        """Create advisor specialization."""
        advisor_id = self.kwargs.get('advisor_id')
        advisor = Advisor.objects.get(id=advisor_id)
        serializer.save(advisor=advisor)


class AdvisorSpecializationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete an advisor specialization."""
    
    serializer_class = AdvisorSpecializationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get specific advisor specialization."""
        advisor_id = self.kwargs.get('advisor_id')
        return AdvisorSpecialization.objects.filter(advisor_id=advisor_id)


class AdvisorWorkloadListView(generics.ListCreateAPIView):
    """List and create workload records for an advisor."""
    
    serializer_class = AdvisorWorkloadSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get workload records for a specific advisor."""
        advisor_id = self.kwargs.get('advisor_id')
        return AdvisorWorkload.objects.filter(advisor_id=advisor_id)
    
    def perform_create(self, serializer):
        """Create advisor workload record."""
        advisor_id = self.kwargs.get('advisor_id')
        advisor = Advisor.objects.get(id=advisor_id)
        serializer.save(advisor=advisor)


class AdvisorPerformanceListView(generics.ListCreateAPIView):
    """List and create performance records for an advisor."""
    
    serializer_class = AdvisorPerformanceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get performance records for a specific advisor."""
        advisor_id = self.kwargs.get('advisor_id')
        return AdvisorPerformance.objects.filter(advisor_id=advisor_id)
    
    def perform_create(self, serializer):
        """Create advisor performance record."""
        advisor_id = self.kwargs.get('advisor_id')
        advisor = Advisor.objects.get(id=advisor_id)
        serializer.save(advisor=advisor)


class AdvisorAvailabilityListView(generics.ListCreateAPIView):
    """List and create availability records for an advisor."""
    
    serializer_class = AdvisorAvailabilitySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get availability records for a specific advisor."""
        advisor_id = self.kwargs.get('advisor_id')
        return AdvisorAvailability.objects.filter(advisor_id=advisor_id)
    
    def perform_create(self, serializer):
        """Create advisor availability record."""
        advisor_id = self.kwargs.get('advisor_id')
        advisor = Advisor.objects.get(id=advisor_id)
        serializer.save(advisor=advisor)


class AdvisorNoteListView(generics.ListCreateAPIView):
    """List and create notes for an advisor."""
    
    serializer_class = AdvisorNoteSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get notes for a specific advisor."""
        advisor_id = self.kwargs.get('advisor_id')
        return AdvisorNote.objects.filter(advisor_id=advisor_id)
    
    def perform_create(self, serializer):
        """Create advisor note."""
        advisor_id = self.kwargs.get('advisor_id')
        advisor = Advisor.objects.get(id=advisor_id)
        serializer.save(advisor=advisor, created_by=self.request.user)


class AdvisorNoteDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete an advisor note."""
    
    serializer_class = AdvisorNoteSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get specific advisor note."""
        advisor_id = self.kwargs.get('advisor_id')
        return AdvisorNote.objects.filter(advisor_id=advisor_id)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def advisor_statistics(request):
    """Get advisor statistics for dashboard."""
    advisors = Advisor.objects.all()
    
    # Calculate statistics
    total_advisors = advisors.count()
    active_advisors = advisors.filter(is_active=True).count()
    inactive_advisors = advisors.filter(is_active=False).count()
    department_admins = advisors.filter(is_department_admin=True).count()
    
    # Department distribution
    departments = advisors.values_list('department', flat=True).distinct()
    department_distribution = {}
    for dept in departments:
        if dept:  # Only count non-empty departments
            department_distribution[dept] = advisors.filter(department=dept).count()
    
    # Workload statistics
    overloaded_advisors = advisors.filter(is_active=True).count()  # TODO: Implement actual overload calculation
    average_quota = advisors.aggregate(avg_quota=models.Avg('quota'))['avg_quota'] or 0
    
    return Response({
        'total_advisors': total_advisors,
        'active_advisors': active_advisors,
        'inactive_advisors': inactive_advisors,
        'department_admins': department_admins,
        'department_distribution': department_distribution,
        'overloaded_advisors': overloaded_advisors,
        'average_quota': round(average_quota, 2)
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def bulk_update_advisors(request):
    """Bulk update advisor information."""
    serializer = AdvisorBulkUpdateSerializer(data=request.data)
    if serializer.is_valid():
        advisor_ids = serializer.validated_data['advisor_ids']
        updates = serializer.validated_data['updates']
        
        updated_count = 0
        for advisor_id in advisor_ids:
            try:
                advisor = Advisor.objects.get(id=advisor_id)
                for field, value in updates.items():
                    setattr(advisor, field, value)
                advisor.save()
                updated_count += 1
            except Advisor.DoesNotExist:
                continue
        
        return Response({
            'message': f'Updated {updated_count} advisors successfully.',
            'updated_count': updated_count
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def advisor_search(request):
    """Search advisors by various criteria."""
    serializer = AdvisorSearchSerializer(data=request.GET)
    if serializer.is_valid():
        params = serializer.validated_data
        queryset = Advisor.objects.all()
        
        # Apply filters
        if params.get('query'):
            query = params['query']
            queryset = queryset.filter(
                Q(advisor_id__icontains=query) |
                Q(user__first_name__icontains=query) |
                Q(user__last_name__icontains=query) |
                Q(user__email__icontains=query) |
                Q(department__icontains=query)
            )
        
        if params.get('department'):
            queryset = queryset.filter(department__icontains=params['department'])
        
        if params.get('specialization'):
            queryset = queryset.filter(specializations__major__icontains=params['specialization'])
        
        if params.get('is_active') is not None:
            queryset = queryset.filter(is_active=params['is_active'])
        
        if params.get('quota_min') is not None:
            queryset = queryset.filter(quota__gte=params['quota_min'])
        
        if params.get('quota_max') is not None:
            queryset = queryset.filter(quota__lte=params['quota_max'])
        
        # Serialize results
        serializer = AdvisorSerializer(queryset[:50], many=True)  # Limit to 50 results
        
        return Response({
            'results': serializer.data,
            'count': queryset.count()
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def advisor_workload_summary(request):
    """Get workload summary for all advisors."""
    advisors = Advisor.objects.filter(is_active=True)
    
    workload_summaries = []
    for advisor in advisors:
        # TODO: Implement actual workload calculation
        current_load = 0  # Placeholder
        quota = advisor.quota
        utilization_rate = (current_load / quota * 100) if quota > 0 else 0
        
        specializations = list(advisor.specializations.values_list('major', flat=True))
        
        workload_summaries.append({
            'advisor_id': advisor.advisor_id,
            'advisor_name': advisor.user.get_full_name(),
            'current_load': current_load,
            'quota': quota,
            'utilization_rate': round(utilization_rate, 2),
            'is_overloaded': current_load > quota,
            'specializations': specializations,
            'performance_score': 0.0,  # Placeholder
            'availability_status': 'Available'  # Placeholder
        })
    
    return Response({
        'workload_summaries': workload_summaries,
        'total_advisors': len(workload_summaries),
        'overloaded_count': sum(1 for w in workload_summaries if w['is_overloaded']),
        'average_utilization': sum(w['utilization_rate'] for w in workload_summaries) / len(workload_summaries) if workload_summaries else 0
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def advisor_availability(request, advisor_id):
    """Get advisor availability for a specific date range."""
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    
    if not start_date or not end_date:
        return Response(
            {'error': 'start_date and end_date are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        advisor = Advisor.objects.get(id=advisor_id)
        availability_records = AdvisorAvailability.objects.filter(
            advisor=advisor,
            date__range=[start_date, end_date]
        ).order_by('date')
        
        serializer = AdvisorAvailabilitySerializer(availability_records, many=True)
        
        return Response({
            'advisor': AdvisorSerializer(advisor).data,
            'availability_records': serializer.data
        })
    
    except Advisor.DoesNotExist:
        return Response(
            {'error': 'Advisor not found.'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def advisor_performance(request, advisor_id):
    """Get detailed performance information for an advisor."""
    try:
        advisor = Advisor.objects.get(id=advisor_id)
        
        # Get performance records
        performance_records = advisor.performance_records.all()
        performance_serializer = AdvisorPerformanceSerializer(performance_records, many=True)
        
        # Get workload records
        workload_records = advisor.workload_records.all()
        workload_serializer = AdvisorWorkloadSerializer(workload_records, many=True)
        
        # Get specializations
        specializations = advisor.specializations.all()
        specialization_serializer = AdvisorSpecializationSerializer(specializations, many=True)
        
        # Get recent notes
        recent_notes = advisor.notes.all()[:10]
        notes_serializer = AdvisorNoteSerializer(recent_notes, many=True)
        
        return Response({
            'advisor': AdvisorSerializer(advisor).data,
            'performance_records': performance_serializer.data,
            'workload_records': workload_serializer.data,
            'specializations': specialization_serializer.data,
            'recent_notes': notes_serializer.data
        })
    
    except Advisor.DoesNotExist:
        return Response(
            {'error': 'Advisor not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
