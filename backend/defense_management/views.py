from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, Sum, Avg, Max, Min
from django.utils import timezone
from datetime import timedelta
from .models import (
    DefenseSchedule, DefenseSession, DefenseEvaluation, DefenseResult,
    DefenseRoom, DefenseSettings, DefenseLog
)
from .serializers import (
    DefenseScheduleSerializer, DefenseScheduleCreateSerializer,
    DefenseSessionSerializer, DefenseSessionCreateSerializer,
    DefenseEvaluationSerializer, DefenseEvaluationCreateSerializer,
    DefenseResultSerializer, DefenseResultCreateSerializer,
    DefenseRoomSerializer, DefenseRoomCreateSerializer,
    DefenseSettingsSerializer, DefenseSettingsCreateSerializer,
    DefenseLogSerializer, DefenseLogCreateSerializer,
    DefenseScheduleSearchSerializer, DefenseStatisticsSerializer,
    DefenseReminderSerializer, DefenseEvaluationSummarySerializer,
    DefenseRoomAvailabilitySerializer
)
from projects.models import ProjectGroup
from accounts.models import User
from core.permissions import RolePermission, RoleRequiredMixin, require_roles

"""
Roles & Access (Defense Management):
- Schedule/Start/Complete/Evaluate/Result: Advisor, DepartmentAdmin, Admin
- Rooms/Settings/Reminders: DepartmentAdmin, Admin
- Logs/Statistics/Summaries: ตาม RolePermission กำกับ
"""


class DefenseScheduleListView(RoleRequiredMixin, generics.ListCreateAPIView):
    """List and create defense schedules."""
    
    serializer_class = DefenseScheduleSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    # สร้าง/จัดการตารางสอบโดย DepartmentAdmin หรือ Advisor
    allowed_roles = ('Admin', 'DepartmentAdmin', 'Advisor')
    
    def get_queryset(self):
        return DefenseSchedule.objects.select_related(
            'project', 'main_committee', 'second_committee', 'third_committee', 'created_by'
        ).prefetch_related('sessions', 'logs')
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return DefenseScheduleCreateSerializer
        return DefenseScheduleSerializer


class DefenseScheduleDetailView(RoleRequiredMixin, generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a defense schedule."""
    
    serializer_class = DefenseScheduleSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    allowed_roles = ('Admin', 'DepartmentAdmin', 'Advisor')
    
    def get_queryset(self):
        return DefenseSchedule.objects.select_related(
            'project', 'main_committee', 'second_committee', 'third_committee', 'created_by'
        ).prefetch_related('sessions', 'logs')


class DefenseSessionListView(RoleRequiredMixin, generics.ListCreateAPIView):
    """List and create defense sessions."""
    
    serializer_class = DefenseSessionSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    allowed_roles = ('Admin', 'DepartmentAdmin', 'Advisor')
    
    def get_queryset(self):
        return DefenseSession.objects.select_related(
            'defense_schedule', 'defense_schedule__project'
        ).prefetch_related('evaluations', 'result')
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return DefenseSessionCreateSerializer
        return DefenseSessionSerializer


class DefenseSessionDetailView(RoleRequiredMixin, generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a defense session."""
    
    serializer_class = DefenseSessionSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    allowed_roles = ('Admin', 'DepartmentAdmin', 'Advisor')
    
    def get_queryset(self):
        return DefenseSession.objects.select_related(
            'defense_schedule', 'defense_schedule__project'
        ).prefetch_related('evaluations', 'result')


class DefenseEvaluationListView(RoleRequiredMixin, generics.ListCreateAPIView):
    """List and create defense evaluations."""
    
    serializer_class = DefenseEvaluationSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    # ส่งคะแนนโดย Advisor/Committee
    allowed_roles = ('Admin', 'DepartmentAdmin', 'Advisor')
    
    def get_queryset(self):
        return DefenseEvaluation.objects.select_related(
            'defense_session', 'defense_session__defense_schedule__project', 'evaluator'
        )
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return DefenseEvaluationCreateSerializer
        return DefenseEvaluationSerializer


class DefenseEvaluationDetailView(RoleRequiredMixin, generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a defense evaluation."""
    
    serializer_class = DefenseEvaluationSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    allowed_roles = ('Admin', 'DepartmentAdmin', 'Advisor')
    
    def get_queryset(self):
        return DefenseEvaluation.objects.select_related(
            'defense_session', 'defense_session__defense_schedule__project', 'evaluator'
        )


class DefenseResultListView(RoleRequiredMixin, generics.ListCreateAPIView):
    """List and create defense results."""
    
    serializer_class = DefenseResultSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    # บันทึกผลสอบโดย DepartmentAdmin/Advisor
    allowed_roles = ('Admin', 'DepartmentAdmin', 'Advisor')
    
    def get_queryset(self):
        return DefenseResult.objects.select_related(
            'defense_session', 'defense_session__defense_schedule__project', 'final_decision_by'
        )
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return DefenseResultCreateSerializer
        return DefenseResultSerializer


class DefenseResultDetailView(RoleRequiredMixin, generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a defense result."""
    
    serializer_class = DefenseResultSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    allowed_roles = ('Admin', 'DepartmentAdmin', 'Advisor')
    
    def get_queryset(self):
        return DefenseResult.objects.select_related(
            'defense_session', 'defense_session__defense_schedule__project', 'final_decision_by'
        )


class DefenseRoomListView(RoleRequiredMixin, generics.ListCreateAPIView):
    """List and create defense rooms."""
    
    serializer_class = DefenseRoomSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    allowed_roles = ('Admin', 'DepartmentAdmin')
    
    def get_queryset(self):
        return DefenseRoom.objects.all()
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return DefenseRoomCreateSerializer
        return DefenseRoomSerializer


class DefenseRoomDetailView(RoleRequiredMixin, generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a defense room."""
    
    serializer_class = DefenseRoomSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    allowed_roles = ('Admin', 'DepartmentAdmin')
    
    def get_queryset(self):
        return DefenseRoom.objects.all()


class DefenseSettingsListView(RoleRequiredMixin, generics.ListCreateAPIView):
    """List and create defense settings."""
    
    serializer_class = DefenseSettingsSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    allowed_roles = ('Admin', 'DepartmentAdmin')
    
    def get_queryset(self):
        return DefenseSettings.objects.all()
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return DefenseSettingsCreateSerializer
        return DefenseSettingsSerializer


class DefenseSettingsDetailView(RoleRequiredMixin, generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete defense settings."""
    
    serializer_class = DefenseSettingsSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    allowed_roles = ('Admin', 'DepartmentAdmin')
    
    def get_queryset(self):
        return DefenseSettings.objects.all()


class DefenseLogListView(RoleRequiredMixin, generics.ListAPIView):
    """List defense logs."""
    
    serializer_class = DefenseLogSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    allowed_roles = ('Admin', 'DepartmentAdmin', 'Advisor')
    
    def get_queryset(self):
        return DefenseLog.objects.select_related(
            'defense_schedule', 'defense_schedule__project', 'user'
        )


@api_view(['POST'])
@require_roles('Admin', 'DepartmentAdmin', 'Advisor')
def schedule_defense(request):
    """Schedule a new defense."""
    serializer = DefenseScheduleCreateSerializer(data=request.data)
    if serializer.is_valid():
        defense_schedule = serializer.save(created_by=request.user)
        
        # Log the scheduling
        DefenseLog.objects.create(
            defense_schedule=defense_schedule,
            log_type='scheduled',
            user=request.user,
            message=f"Defense scheduled for {defense_schedule.defense_date} at {defense_schedule.defense_time}",
            metadata={'room': defense_schedule.defense_room}
        )
        
        return Response(DefenseScheduleSerializer(defense_schedule).data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@require_roles('Admin', 'DepartmentAdmin', 'Advisor')
def start_defense_session(request, defense_schedule_id):
    """Start a defense session."""
    defense_schedule = get_object_or_404(DefenseSchedule, id=defense_schedule_id)
    
    # Create defense session
    defense_session = DefenseSession.objects.create(
        defense_schedule=defense_schedule,
        session_type='final_defense',
        status='in_progress',
        start_time=timezone.now()
    )
    
    # Update defense schedule status
    defense_schedule.status = 'in_progress'
    defense_schedule.save()
    
    # Log the start
    DefenseLog.objects.create(
        defense_schedule=defense_schedule,
        log_type='started',
        user=request.user,
        message="Defense session started",
        metadata={'session_id': str(defense_session.id)}
    )
    
    return Response(DefenseSessionSerializer(defense_session).data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@require_roles('Admin', 'DepartmentAdmin', 'Advisor')
def complete_defense_session(request, defense_session_id):
    """Complete a defense session."""
    defense_session = get_object_or_404(DefenseSession, id=defense_session_id)
    
    # Update session
    defense_session.status = 'completed'
    defense_session.end_time = timezone.now()
    defense_session.actual_duration = int((defense_session.end_time - defense_session.start_time).total_seconds() / 60)
    defense_session.save()
    
    # Update defense schedule status
    defense_session.defense_schedule.status = 'completed'
    defense_session.defense_schedule.save()
    
    # Log the completion
    DefenseLog.objects.create(
        defense_schedule=defense_session.defense_schedule,
        log_type='completed',
        user=request.user,
        message="Defense session completed",
        metadata={'session_id': str(defense_session.id), 'duration': defense_session.actual_duration}
    )
    
    return Response(DefenseSessionSerializer(defense_session).data, status=status.HTTP_200_OK)


@api_view(['POST'])
@require_roles('Admin', 'DepartmentAdmin', 'Advisor')
def submit_evaluation(request):
    """Submit a defense evaluation."""
    serializer = DefenseEvaluationCreateSerializer(data=request.data)
    if serializer.is_valid():
        evaluation = serializer.save(evaluator=request.user)
        
        # Log the evaluation
        DefenseLog.objects.create(
            defense_schedule=evaluation.defense_session.defense_schedule,
            log_type='evaluation',
            user=request.user,
            message=f"Evaluation submitted for {evaluation.evaluation_type}",
            metadata={'score': evaluation.score, 'evaluation_type': evaluation.evaluation_type}
        )
        
        return Response(DefenseEvaluationSerializer(evaluation).data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@require_roles('Admin', 'DepartmentAdmin', 'Advisor')
def submit_defense_result(request):
    """Submit defense result."""
    serializer = DefenseResultCreateSerializer(data=request.data)
    if serializer.is_valid():
        result = serializer.save(final_decision_by=request.user)
        
        # Log the result
        DefenseLog.objects.create(
            defense_schedule=result.defense_session.defense_schedule,
            log_type='result',
            user=request.user,
            message=f"Defense result submitted: {result.final_decision}",
            metadata={'result_type': result.result_type, 'total_score': result.total_score}
        )
        
        return Response(DefenseResultSerializer(result).data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@require_roles('Admin', 'DepartmentAdmin')
def search_defense_schedules(request):
    """Search defense schedules."""
    serializer = DefenseScheduleSearchSerializer(data=request.data)
    if serializer.is_valid():
        queryset = DefenseSchedule.objects.select_related(
            'project', 'main_committee', 'second_committee', 'third_committee'
        )
        
        # Apply filters
        if serializer.validated_data.get('query'):
            queryset = queryset.filter(
                Q(project__project_id__icontains=serializer.validated_data['query']) |
                Q(defense_room__icontains=serializer.validated_data['query']) |
                Q(notes__icontains=serializer.validated_data['query'])
            )
        
        if serializer.validated_data.get('project_id'):
            queryset = queryset.filter(project__project_id=serializer.validated_data['project_id'])
        
        if serializer.validated_data.get('status'):
            queryset = queryset.filter(status=serializer.validated_data['status'])
        
        if serializer.validated_data.get('committee_member_id'):
            queryset = queryset.filter(
                Q(main_committee_id=serializer.validated_data['committee_member_id']) |
                Q(second_committee_id=serializer.validated_data['committee_member_id']) |
                Q(third_committee_id=serializer.validated_data['committee_member_id'])
            )
        
        if serializer.validated_data.get('room'):
            queryset = queryset.filter(defense_room__icontains=serializer.validated_data['room'])
        
        # Date filters
        if serializer.validated_data.get('defense_date_from'):
            queryset = queryset.filter(defense_date__gte=serializer.validated_data['defense_date_from'])
        
        if serializer.validated_data.get('defense_date_to'):
            queryset = queryset.filter(defense_date__lte=serializer.validated_data['defense_date_to'])
        
        # Order by defense date
        queryset = queryset.order_by('defense_date', 'defense_time')
        
        return Response(DefenseScheduleSerializer(queryset, many=True).data)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, RolePermission])
def defense_statistics(request):
    """Get defense statistics."""
    # Total schedules
    total_schedules = DefenseSchedule.objects.count()
    
    # Status counts
    completed_defenses = DefenseSchedule.objects.filter(status='completed').count()
    pending_defenses = DefenseSchedule.objects.filter(status='scheduled').count()
    cancelled_defenses = DefenseSchedule.objects.filter(status='cancelled').count()
    
    # Average score
    average_score = DefenseResult.objects.aggregate(avg_score=Avg('total_score'))['avg_score'] or 0
    
    # Pass rates
    total_results = DefenseResult.objects.count()
    pass_count = DefenseResult.objects.filter(final_decision='pass').count()
    conditional_pass_count = DefenseResult.objects.filter(final_decision='conditional_pass').count()
    fail_count = DefenseResult.objects.filter(final_decision='fail').count()
    
    pass_rate = (pass_count / total_results * 100) if total_results > 0 else 0
    conditional_pass_rate = (conditional_pass_count / total_results * 100) if total_results > 0 else 0
    fail_rate = (fail_count / total_results * 100) if total_results > 0 else 0
    
    # Defenses by month (last 12 months)
    defenses_by_month = {}
    for i in range(12):
        month_start = timezone.now().replace(day=1) - timedelta(days=30*i)
        month_end = month_start + timedelta(days=30)
        count = DefenseSchedule.objects.filter(
            defense_date__gte=month_start,
            defense_date__lt=month_end
        ).count()
        defenses_by_month[month_start.strftime('%Y-%m')] = count
    
    # Top evaluators
    top_evaluators = User.objects.annotate(
        evaluation_count=Count('defense_evaluations')
    ).order_by('-evaluation_count')[:10]
    top_evaluators = [{'user': evaluator.get_full_name(), 'count': evaluator.evaluation_count} for evaluator in top_evaluators]
    
    # Room usage
    room_usage = DefenseSchedule.objects.values('defense_room').annotate(
        usage_count=Count('id')
    )
    room_usage = {item['defense_room']: item['usage_count'] for item in room_usage}
    
    # Recent defenses
    recent_defenses = DefenseSchedule.objects.select_related('project').order_by('-defense_date')[:10]
    recent_defenses = DefenseScheduleSerializer(recent_defenses, many=True).data
    
    statistics = {
        'total_schedules': total_schedules,
        'completed_defenses': completed_defenses,
        'pending_defenses': pending_defenses,
        'cancelled_defenses': cancelled_defenses,
        'average_score': average_score,
        'pass_rate': pass_rate,
        'conditional_pass_rate': conditional_pass_rate,
        'fail_rate': fail_rate,
        'defenses_by_month': defenses_by_month,
        'top_evaluators': top_evaluators,
        'room_usage': room_usage,
        'recent_defenses': recent_defenses
    }
    
    return Response(statistics)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, RolePermission])
def defense_room_availability(request, room_id, date):
    """Get defense room availability for a specific date."""
    room = get_object_or_404(DefenseRoom, id=room_id)
    
    # Get scheduled defenses for the room on the given date
    scheduled_defenses = DefenseSchedule.objects.filter(
        defense_room=room.name,
        defense_date__date=date
    ).order_by('defense_time')
    
    # Generate available time slots (assuming 9 AM to 5 PM)
    available_slots = []
    booked_slots = []
    
    for hour in range(9, 17):  # 9 AM to 5 PM
        slot_start = f"{hour:02d}:00"
        slot_end = f"{hour+1:02d}:00"
        
        # Check if this slot is booked
        is_booked = scheduled_defenses.filter(
            defense_time__hour=hour
        ).exists()
        
        if is_booked:
            booked_slots.append({
                'start': slot_start,
                'end': slot_end,
                'defense': scheduled_defenses.filter(defense_time__hour=hour).first()
            })
        else:
            available_slots.append({
                'start': slot_start,
                'end': slot_end
            })
    
    # Check for conflicts
    conflicts = []
    for defense in scheduled_defenses:
        if defense.status in ['cancelled', 'postponed']:
            conflicts.append({
                'defense': DefenseScheduleSerializer(defense).data,
                'reason': f"Status: {defense.status}"
            })
    
    availability = {
        'room_id': room_id,
        'date': date,
        'available_slots': available_slots,
        'booked_slots': booked_slots,
        'conflicts': conflicts
    }
    
    return Response(availability)


@api_view(['POST'])
@require_roles('Admin', 'DepartmentAdmin')
def send_defense_reminder(request):
    """Send defense reminder."""
    serializer = DefenseReminderSerializer(data=request.data)
    if serializer.is_valid():
        defense_schedule_id = serializer.validated_data['defense_schedule_id']
        reminder_type = serializer.validated_data['reminder_type']
        message = serializer.validated_data['message']
        send_to = serializer.validated_data['send_to']
        
        defense_schedule = get_object_or_404(DefenseSchedule, id=defense_schedule_id)
        
        # Log the reminder
        DefenseLog.objects.create(
            defense_schedule=defense_schedule,
            log_type='reminder',
            user=request.user,
            message=f"Reminder sent: {message}",
            metadata={'reminder_type': reminder_type, 'recipients': send_to}
        )
        
        return Response({'message': 'Reminder sent successfully'}, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, RolePermission])
def defense_evaluation_summary(request, defense_session_id):
    """Get defense evaluation summary."""
    defense_session = get_object_or_404(DefenseSession, id=defense_session_id)
    
    evaluations = DefenseEvaluation.objects.filter(defense_session=defense_session)
    
    # Calculate statistics
    total_evaluations = evaluations.count()
    average_score = evaluations.aggregate(avg_score=Avg('score'))['avg_score'] or 0
    highest_score = evaluations.aggregate(max_score=Max('score'))['max_score'] or 0
    lowest_score = evaluations.aggregate(min_score=Min('score'))['min_score'] or 0
    
    # Evaluation types breakdown
    evaluation_types = evaluations.values('evaluation_type').annotate(
        count=Count('id'),
        avg_score=Avg('score')
    )
    evaluation_types = {item['evaluation_type']: {'count': item['count'], 'avg_score': item['avg_score']} for item in evaluation_types}
    
    # Evaluator scores
    evaluator_scores = evaluations.values('evaluator__get_full_name').annotate(
        avg_score=Avg('score')
    )
    evaluator_scores = {item['evaluator__get_full_name']: item['avg_score'] for item in evaluator_scores}
    
    # Overall rating
    if average_score >= 80:
        overall_rating = 'Excellent'
    elif average_score >= 70:
        overall_rating = 'Good'
    elif average_score >= 60:
        overall_rating = 'Satisfactory'
    else:
        overall_rating = 'Needs Improvement'
    
    summary = {
        'defense_session_id': defense_session_id,
        'total_evaluations': total_evaluations,
        'average_score': average_score,
        'highest_score': highest_score,
        'lowest_score': lowest_score,
        'evaluation_types': evaluation_types,
        'evaluator_scores': evaluator_scores,
        'overall_rating': overall_rating
    }
    
    return Response(summary)
