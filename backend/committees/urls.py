from django.urls import path
from . import views

urlpatterns = [
    path('', views.committee_list, name='committee-list'),
    path('create/', views.create_committee, name='committee-create'),
]
