FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-client \
        build-essential \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . /app/

# Create logs directory
RUN mkdir -p /app/logs

# Create static and media directories
RUN mkdir -p /app/static /app/media

# Expose port
EXPOSE 8000

# Create startup script
RUN echo '#!/bin/bash\n\
set -e\n\
echo "🚀 Starting BM23 Application..."\n\
\n\
# Run migrations first\n\
echo "🗄️ Running database migrations..."\n\
python manage.py migrate --noinput\n\
\n\
# Create superuser if it doesn\'t exist\n\
echo "👤 Setting up superuser..."\n\
python manage.py shell -c "\n\
from django.contrib.auth import get_user_model\n\
User = get_user_model()\n\
if not User.objects.filter(username=\'admin\').exists():\n\
    User.objects.create_superuser(\'admin\', \'admin@bm23.com\', \'admin123\')\n\
    print(\'Superuser created: admin/admin123\')\n\
else:\n\
    print(\'Superuser already exists\')\n\
" || echo "Superuser setup completed"\n\
\n\
# Load initial data\n\
echo "📊 Loading initial data..."\n\
python manage.py loaddata fixtures/initial_data.json || echo "No initial data file found"\n\
\n\
# Collect static files\n\
echo "📦 Collecting static files..."\n\
python manage.py collectstatic --noinput\n\
\n\
# Start the application\n\
echo "🌐 Starting application..."\n\
exec gunicorn --bind 0.0.0.0:8000 --workers 3 final_project_management.wsgi:application\n\
' > /app/start.sh && chmod +x /app/start.sh

# Run the application
CMD ["/app/start.sh"]