from django.urls import path
from . import views

urlpatterns = [
    # File management
    path('', views.ProjectFileListView.as_view(), name='file-list'),
    path('<uuid:pk>/', views.ProjectFileDetailView.as_view(), name='file-detail'),
    path('upload/', views.upload_file, name='file-upload'),
    path('<uuid:file_id>/download/', views.download_file, name='file-download'),
    path('search/', views.search_files, name='file-search'),
    path('statistics/', views.file_statistics, name='file-statistics'),
    path('<uuid:file_id>/delete/', views.delete_file, name='file-delete'),
    
    # File versions
    path('<uuid:file_id>/versions/', views.FileVersionListView.as_view(), name='file-versions'),
    
    # File downloads
    path('<uuid:file_id>/downloads/', views.FileDownloadListView.as_view(), name='file-downloads'),
    
    # File sharing
    path('<uuid:file_id>/shares/', views.FileShareListView.as_view(), name='file-shares'),
    path('shares/<uuid:pk>/', views.FileShareDetailView.as_view(), name='file-share-detail'),
    path('shares/create/', views.create_file_share, name='file-share-create'),
]
