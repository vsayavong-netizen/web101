from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.analytics_dashboard, name='analytics-dashboard'),
    path('statistics/', views.analytics_statistics, name='analytics-statistics'),
]
