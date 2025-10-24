"""
URL patterns for data API endpoints
"""
from django.urls import path
from . import data_api

urlpatterns = [
    # Data endpoints
    path('', data_api.get_all_data_for_year, name='get-all-data-for-year'),
    path('<str:collection_name>/', data_api.update_collection, name='update-collection'),
    path('<str:collection_name>/', data_api.add_collection_item, name='add-collection-item'),
    path('<str:collection_name>/<str:item_id>/', data_api.delete_collection_item, name='delete-collection-item'),
    path('settings/<str:settings_name>/', data_api.update_settings, name='update-settings'),
]
