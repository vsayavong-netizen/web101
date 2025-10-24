"""
Data API endpoints for frontend integration
"""
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import json
import logging

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([])  # No authentication required for development
def get_all_data_for_year(request, year):
    """
    Get all data for a specific academic year
    """
    try:
        # For development, return mock data
        # In production, you would query the actual database models
        
        # Mock data structure
        data = {
            'projectGroups': [],
            'students': [],
            'advisors': [],
            'majors': [
                {'id': 'M01', 'name': 'Business Administration (IBM)', 'abbreviation': 'IBM'},
                {'id': 'M02', 'name': 'Business Administration (BM)', 'abbreviation': 'BM'},
                {'id': 'M03', 'name': 'Business Administration (Continuing) (BMC)', 'abbreviation': 'BMC'},
                {'id': 'M04', 'name': 'Marketing (MK)', 'abbreviation': 'MK'},
            ],
            'classrooms': [
                {'id': 'C01', 'name': 'IBM-4A', 'majorId': 'M01', 'majorName': 'Business Administration (IBM)'},
                {'id': 'C02', 'name': 'IBM-4B', 'majorId': 'M01', 'majorName': 'Business Administration (IBM)'},
                {'id': 'C03', 'name': 'BM-4A', 'majorId': 'M02', 'majorName': 'Business Administration (BM)'},
                {'id': 'C04', 'name': 'BM-4B', 'majorId': 'M02', 'majorName': 'Business Administration (BM)'},
                {'id': 'C05', 'name': 'BMC-2A', 'majorId': 'M03', 'majorName': 'Business Administration (Continuing) (BMC)'},
                {'id': 'C06', 'name': 'MK-4A', 'majorId': 'M04', 'majorName': 'Marketing (MK)'},
                {'id': 'C07', 'name': 'MK-4B', 'majorId': 'M04', 'majorName': 'Marketing (MK)'},
            ],
            'milestoneTemplates': [
                {
                    'id': 'TPL01',
                    'name': 'Standard 5-Chapter Final Project',
                    'description': 'A standard template for research-based projects with five chapters.',
                    'tasks': [
                        {'id': 'TSK01', 'name': 'Chapter 1: Introduction', 'durationDays': 30},
                        {'id': 'TSK02', 'name': 'Chapter 2: Literature Review', 'durationDays': 30},
                        {'id': 'TSK03', 'name': 'Chapter 3: Methodology', 'durationDays': 30},
                        {'id': 'TSK04', 'name': 'Results & Discussion', 'durationDays': 30},
                        {'id': 'TSK05', 'name': 'Chapter 5: Conclusion & Defense Prep', 'durationDays': 30},
                    ]
                },
                {
                    'id': 'TPL02',
                    'name': 'Software Development Project',
                    'description': 'A template for software engineering projects focusing on development cycles.',
                    'tasks': [
                        {'id': 'TSK01', 'name': 'Requirement Analysis & Design Document', 'durationDays': 25},
                        {'id': 'TSK02', 'name': 'Prototype/Alpha Version Submission', 'durationDays': 40},
                        {'id': 'TSK03', 'name': 'Beta Version & Testing Report', 'durationDays': 45},
                        {'id': 'TSK04', 'name': 'Final Version & User Manual', 'durationDays': 30},
                        {'id': 'TSK05', 'name': 'Project Defense', 'durationDays': 20},
                    ]
                }
            ],
            'announcements': [
                {
                    'id': 'ANN01',
                    'title': 'Welcome to the New Academic Year!',
                    'content': 'Welcome everyone to the **2024 academic year**. Please ensure your personal information is up-to-date and start thinking about your final project topics. Good luck!',
                    'audience': 'All',
                    'authorName': 'Admin',
                    'createdAt': '2024-08-01T09:00:00Z',
                    'updatedAt': '2024-08-01T09:00:00Z'
                }
            ],
            'defenseSettings': {
                'startDefenseDate': '',
                'timeSlots': '09:00-10:00,10:15-11:15,13:00-14:00,14:15-15:15',
                'rooms': [],
                'stationaryAdvisors': {},
                'timezone': 'Asia/Bangkok'
            },
            'scoringSettings': {
                'mainAdvisorWeight': 60,
                'committeeWeight': 40,
                'gradeBoundaries': [],
                'advisorRubrics': [],
                'committeeRubrics': []
            }
        }
        
        return Response(data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error getting data for year {year}: {str(e)}")
        return Response(
            {'error': f'Failed to get data for year {year}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['PUT'])
@permission_classes([])  # No authentication required for development
def update_collection(request, year, collection_name):
    """
    Update a collection for a specific year
    """
    try:
        data = request.data
        
        # For now, just return the data as-is
        # In a real implementation, you would save this to the database
        return Response(data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error updating collection {collection_name} for year {year}: {str(e)}")
        return Response(
            {'error': f'Failed to update collection {collection_name}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([])  # No authentication required for development
def add_collection_item(request, year, collection_name):
    """
    Add an item to a collection for a specific year
    """
    try:
        data = request.data
        
        # For now, just return the data as-is
        # In a real implementation, you would save this to the database
        return Response(data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Error adding item to collection {collection_name} for year {year}: {str(e)}")
        return Response(
            {'error': f'Failed to add item to collection {collection_name}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
@permission_classes([])  # No authentication required for development
def delete_collection_item(request, year, collection_name, item_id):
    """
    Delete an item from a collection for a specific year
    """
    try:
        # For now, just return success
        # In a real implementation, you would delete from the database
        return Response({'success': True}, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error deleting item {item_id} from collection {collection_name} for year {year}: {str(e)}")
        return Response(
            {'error': f'Failed to delete item from collection {collection_name}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([])  # No authentication required for development
def update_settings(request, year, settings_name):
    """
    Update settings for a specific year
    """
    try:
        data = request.data
        
        # For now, just return the data as-is
        # In a real implementation, you would save this to the database
        return Response(data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error updating settings {settings_name} for year {year}: {str(e)}")
        return Response(
            {'error': f'Failed to update settings {settings_name}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
