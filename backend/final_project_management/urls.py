"""
URL configuration for final_project_management project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.shortcuts import render
from rest_framework_simplejwt.views import TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

def health_check(request):
    """Health check endpoint for monitoring"""
    return JsonResponse({
        'status': 'healthy',
        'service': 'Final Project Management System',
        'version': '1.0.0',
        'timestamp': '2024-01-01T00:00:00Z'
    })

def root_view(request):
    """Root endpoint - serve frontend application or API info"""
    # Check if this is an API request (looking for JSON)
    if request.META.get('HTTP_ACCEPT', '').find('application/json') != -1:
        # Return API information for API requests
        return JsonResponse({
            'message': 'Welcome to Final Project Management System API',
            'version': '1.0.0',
            'documentation': '/api/docs/',
            'health_check': '/health/',
            'endpoints': {
                'authentication': '/api/auth/',
                'students': '/api/students/',
                'projects': '/api/projects/',
                'advisors': '/api/advisors/',
                'notifications': '/api/notifications/',
                'analytics': '/api/analytics/',
            }
        })
    else:
        # Serve the frontend application for browser requests
        try:
            from django.http import HttpResponse
            import os
            
            # Priority: Always try to serve the React frontend application first
            possible_paths = [
                os.path.join(settings.STATIC_ROOT, 'index.html'),
                os.path.join(settings.BASE_DIR, 'staticfiles', 'index.html'),
                os.path.join(settings.BASE_DIR, '..', 'frontend', 'dist', 'index.html'),
            ]
            
            # Try to find and serve the frontend index.html
            for frontend_path in possible_paths:
                if os.path.exists(frontend_path):
                    with open(frontend_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    return HttpResponse(content, content_type='text/html')
            
            # If no index.html found, return a beautiful welcome page
            return HttpResponse("""
            <!DOCTYPE html>
            <html lang="lo">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>ລະບົບບໍລິຫານບົດໂຄງການຈົບຊັ້ນ - Final Project Management System</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: 'Noto Sans Lao', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 20px;
                    }
                    .container {
                        background: white;
                        border-radius: 20px;
                        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                        max-width: 800px;
                        width: 100%;
                        padding: 50px;
                        text-align: center;
                        animation: fadeIn 0.6s ease-in;
                    }
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(-20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .logo {
                        width: 120px;
                        height: 120px;
                        margin: 0 auto 30px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        border-radius: 30px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 48px;
                        color: white;
                        font-weight: bold;
                        box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
                    }
                    h1 {
                        color: #2d3748;
                        font-size: 32px;
                        margin-bottom: 10px;
                        font-weight: 700;
                    }
                    .subtitle {
                        color: #667eea;
                        font-size: 18px;
                        margin-bottom: 30px;
                        font-weight: 500;
                    }
                    p {
                        color: #4a5568;
                        font-size: 16px;
                        line-height: 1.8;
                        margin-bottom: 30px;
                    }
                    .features {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 20px;
                        margin: 40px 0;
                    }
                    .feature {
                        background: #f7fafc;
                        padding: 25px;
                        border-radius: 15px;
                        transition: transform 0.3s ease, box-shadow 0.3s ease;
                    }
                    .feature:hover {
                        transform: translateY(-5px);
                        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                    }
                    .feature-icon {
                        font-size: 40px;
                        margin-bottom: 15px;
                    }
                    .feature-title {
                        font-weight: 600;
                        color: #2d3748;
                        margin-bottom: 8px;
                    }
                    .feature-desc {
                        font-size: 14px;
                        color: #718096;
                        margin: 0;
                    }
                    .btn-group {
                        display: flex;
                        gap: 15px;
                        justify-content: center;
                        flex-wrap: wrap;
                        margin-top: 30px;
                    }
                    .btn {
                        padding: 15px 35px;
                        border: none;
                        border-radius: 50px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        text-decoration: none;
                        display: inline-block;
                    }
                    .btn-primary {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                    }
                    .btn-primary:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
                    }
                    .btn-secondary {
                        background: white;
                        color: #667eea;
                        border: 2px solid #667eea;
                    }
                    .btn-secondary:hover {
                        background: #667eea;
                        color: white;
                    }
                    .spinner {
                        display: inline-block;
                        width: 20px;
                        height: 20px;
                        border: 3px solid rgba(255,255,255,.3);
                        border-radius: 50%;
                        border-top-color: white;
                        animation: spin 1s ease-in-out infinite;
                        margin-left: 10px;
                    }
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                    .footer {
                        margin-top: 40px;
                        padding-top: 30px;
                        border-top: 1px solid #e2e8f0;
                        color: #718096;
                        font-size: 14px;
                    }
                    .status {
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        padding: 8px 16px;
                        background: #48bb78;
                        color: white;
                        border-radius: 20px;
                        font-size: 14px;
                        font-weight: 600;
                        margin-bottom: 20px;
                    }
                    .status-dot {
                        width: 8px;
                        height: 8px;
                        background: white;
                        border-radius: 50%;
                        animation: pulse 2s ease-in-out infinite;
                    }
                    @keyframes pulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.5; }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="logo">BM23</div>
                    <div class="status">
                        <span class="status-dot"></span>
                        ລະບົບພ້ອມໃຊ້ງານ (System Online)
                    </div>
                    <h1>ລະບົບບໍລິຫານບົດໂຄງການຈົບຊັ້ນ</h1>
                    <p class="subtitle">Final Project Management System</p>
                    <p>ຍິນດີຕ້ອນຮັບສູ່ລະບົບບໍລິຫານບົດໂຄງການຈົບຊັ້ນ ສຳລັບມະຫາວິທະຍາໄລ<br>
                    ລະບົບທີ່ອອກແບບມາເພື່ອຊ່ວຍບໍລິຫານຈັດການໂຄງການຢ່າງມີປະສິດທິພາບ</p>
                    
                    <div class="features">
                        <div class="feature">
                            <div class="feature-icon">👥</div>
                            <div class="feature-title">ບໍລິຫານນັກສຶກສາ</div>
                            <p class="feature-desc">ຈັດການຂໍ້ມູນນັກສຶກສາແລະກຸ່ມໂຄງການ</p>
                        </div>
                        <div class="feature">
                            <div class="feature-icon">📊</div>
                            <div class="feature-title">ຕິດຕາມຄວາມຄືບໜ້າ</div>
                            <p class="feature-desc">ຕິດຕາມສະຖານະໂຄງການແບບ Real-time</p>
                        </div>
                        <div class="feature">
                            <div class="feature-icon">🤖</div>
                            <div class="feature-title">AI ວິເຄາະ</div>
                            <p class="feature-desc">ວິເຄາະແລະແນະນຳດ້ວຍ AI</p>
                        </div>
                        <div class="feature">
                            <div class="feature-icon">📱</div>
                            <div class="feature-title">ແຈ້ງເຕືອນ</div>
                            <p class="feature-desc">ລະບົບແຈ້ງເຕືອນອັດຕະໂນມັດ</p>
                        </div>
                    </div>
                    
                    <div class="btn-group">
                        <a href="/admin/" class="btn btn-primary">
                            🔐 ເຂົ້າສູ່ລະບົບ Admin
                        </a>
                        <a href="/api/docs/" class="btn btn-secondary">
                            📚 API Documentation
                        </a>
                    </div>
                    
                    <div class="footer">
                        <p>© 2025 Final Project Management System. All rights reserved.<br>
                        Version 1.0.0 | Powered by Django & React</p>
                    </div>
                </div>
                
                <script>
                    // Try to load the frontend application if exists
                    setTimeout(function() {
                        fetch('/static/index.html')
                            .then(response => {
                                if (response.ok) {
                                    window.location.href = '/static/index.html';
                                }
                            })
                            .catch(() => {
                                // Frontend not available, stay on welcome page
                                console.log('Frontend application not found, showing welcome page');
                            });
                    }, 2000);
                </script>
            </body>
            </html>
            """, content_type='text/html')
            
        except Exception as e:
            # Fallback to simple error page
            return HttpResponse(f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Error - Final Project Management</title>
                <meta charset="UTF-8">
            </head>
            <body>
                <h1>Application Error</h1>
                <p>Unable to load the frontend application.</p>
                <p>Error: {str(e)}</p>
            </body>
            </html>
            """, content_type='text/html')

urlpatterns = [
    # Root and health check endpoints
    path('', root_view, name='root'),
    path('health/', health_check, name='health_check'),
    
    # Admin
    path('admin/', admin.site.urls),
    
    # JWT Authentication (canonical routes are defined in accounts.urls)
    # Token refresh is provided under /api/auth/token/refresh/ via accounts.urls
    
    # API endpoints
    path('api/auth/', include('authentication.urls')),
    path('api/users/', include('accounts.urls')),
    path('api/projects/', include('projects.urls')),
    path('api/students/', include('students.urls')),
    path('api/advisors/', include('advisors.urls')),
    path('api/committees/', include('committees.urls')),
    path('api/majors/', include('majors.urls')),
    path('api/classrooms/', include('classrooms.urls')),
    path('api/milestones/', include('milestones.urls')),
    path('api/scoring/', include('scoring.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/ai/', include('ai_services.urls')),
    path('api/analytics/', include('analytics.urls')),
    path('api/settings/', include('settings.urls')),
    path('api/reports/', include('reports.urls')),
    path('api/monitoring/', include('system_monitoring.urls')),
    
    # New API endpoints
    path('api/files/', include('file_management.urls')),
    path('api/communication/', include('communication.urls')),
    path('api/ai-enhancement/', include('ai_enhancement.urls')),
    path('api/defense/', include('defense_management.urls')),
    
    # Data API endpoints for frontend
    path('api/data/<str:year>/', include('final_project_management.data_urls')),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

# Serve static files in production with WhiteNoise
if not settings.DEBUG:
    # In production, WhiteNoise will handle static files
    # But we need to ensure the static files are properly served
    from django.views.static import serve
    from django.urls import re_path
    
    urlpatterns += [
        re_path(r'^static/(?P<path>.*)$', serve, {'document_root': settings.STATIC_ROOT}),
        re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
    ]
else:
    # In development, use Django's static file serving
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
