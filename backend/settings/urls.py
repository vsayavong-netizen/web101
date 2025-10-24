from django.urls import path
from . import views

urlpatterns = [
    path('', views.system_settings, name='system-settings'),
    path('update/', views.update_settings, name='update-settings'),
]
