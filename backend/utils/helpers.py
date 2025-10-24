"""
Helper utilities for the Final Project Management System
"""

import re
from django.http import HttpRequest
from django.utils import timezone
from django.core.exceptions import ValidationError


def get_client_ip(request: HttpRequest) -> str:
    """
    Get client IP address from request
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def validate_academic_year(year: str) -> bool:
    """
    Validate academic year format
    """
    if not year.isdigit() or len(year) != 4:
        return False
    
    year_int = int(year)
    current_year = timezone.now().year
    
    # Academic year should be within reasonable range
    return 2020 <= year_int <= current_year + 1


def generate_project_id(academic_year: str, sequence: int) -> str:
    """
    Generate project ID in format: P24001
    """
    year_suffix = academic_year[-2:]  # Last 2 digits of year
    return f"P{year_suffix}{sequence:03d}"


def generate_student_id(academic_year: str, sequence: int) -> str:
    """
    Generate student ID in format: 155N1000/21
    """
    year_suffix = academic_year[-2:]  # Last 2 digits of year
    return f"155N{sequence:04d}/{year_suffix}"


def validate_student_id(student_id: str) -> bool:
    """
    Validate student ID format
    """
    pattern = r'^\d{3}[A-Z]\d{4}/\d{2}$'
    return bool(re.match(pattern, student_id))


def validate_project_id(project_id: str) -> bool:
    """
    Validate project ID format
    """
    pattern = r'^P\d{2}\d{3}$'
    return bool(re.match(pattern, project_id))


def format_phone_number(phone: str) -> str:
    """
    Format phone number to standard format
    """
    # Remove all non-digit characters
    digits = re.sub(r'\D', '', phone)
    
    # Format as 020-555-1234
    if len(digits) == 10:
        return f"{digits[:3]}-{digits[3:6]}-{digits[6:]}"
    elif len(digits) == 11:
        return f"{digits[:3]}-{digits[3:6]}-{digits[6:]}"
    
    return phone


def calculate_age(birth_date) -> int:
    """
    Calculate age from birth date
    """
    if not birth_date:
        return 0
    
    today = timezone.now().date()
    return today.year - birth_date.year - (
        (today.month, today.day) < (birth_date.month, birth_date.day)
    )


def get_academic_year_range(year: str) -> tuple:
    """
    Get start and end dates for academic year
    """
    year_int = int(year)
    
    # Academic year typically runs from August to July
    start_date = timezone.datetime(year_int, 8, 1).date()
    end_date = timezone.datetime(year_int + 1, 7, 31).date()
    
    return start_date, end_date


def is_within_academic_year(date, academic_year: str) -> bool:
    """
    Check if date is within academic year
    """
    start_date, end_date = get_academic_year_range(academic_year)
    return start_date <= date <= end_date


def generate_username(first_name: str, last_name: str, academic_year: str) -> str:
    """
    Generate username from name and academic year
    """
    # Clean names
    first_clean = re.sub(r'[^a-zA-Z]', '', first_name.lower())
    last_clean = re.sub(r'[^a-zA-Z]', '', last_name.lower())
    
    # Generate base username
    base_username = f"{first_clean}.{last_clean}"
    
    # Add year suffix
    year_suffix = academic_year[-2:]
    username = f"{base_username}{year_suffix}"
    
    return username


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename for safe storage
    """
    # Remove or replace dangerous characters
    filename = re.sub(r'[^\w\-_\.]', '_', filename)
    
    # Limit length
    if len(filename) > 255:
        name, ext = filename.rsplit('.', 1) if '.' in filename else (filename, '')
        filename = name[:255-len(ext)-1] + '.' + ext if ext else name[:255]
    
    return filename


def format_file_size(size_bytes: int) -> str:
    """
    Format file size in human readable format
    """
    if size_bytes == 0:
        return "0 B"
    
    size_names = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes /= 1024.0
        i += 1
    
    return f"{size_bytes:.1f} {size_names[i]}"


def validate_file_type(filename: str, allowed_types: list) -> bool:
    """
    Validate file type based on extension
    """
    if not filename:
        return False
    
    extension = filename.split('.')[-1].lower()
    return extension in [ext.lower() for ext in allowed_types]


def get_file_extension(filename: str) -> str:
    """
    Get file extension from filename
    """
    if '.' in filename:
        return filename.split('.')[-1].lower()
    return ''


def truncate_text(text: str, max_length: int = 100, suffix: str = '...') -> str:
    """
    Truncate text to specified length
    """
    if len(text) <= max_length:
        return text
    
    return text[:max_length - len(suffix)] + suffix


def parse_time_slots(time_slots_str: str) -> list:
    """
    Parse time slots string into list of tuples
    Format: "09:00-10:00,10:15-11:15,13:00-14:00"
    """
    if not time_slots_str:
        return []
    
    slots = []
    for slot in time_slots_str.split(','):
        slot = slot.strip()
        if '-' in slot:
            start, end = slot.split('-', 1)
            slots.append((start.strip(), end.strip()))
    
    return slots


def format_time_slots(slots: list) -> str:
    """
    Format time slots list into string
    """
    if not slots:
        return ''
    
    return ','.join([f"{start}-{end}" for start, end in slots])


def get_defense_rooms_from_settings(settings) -> list:
    """
    Get defense rooms from settings
    """
    if not settings or 'rooms' not in settings:
        return []
    
    rooms = settings.get('rooms', [])
    if isinstance(rooms, list):
        return rooms
    
    return []


def calculate_project_score(scores: dict, weights: dict) -> float:
    """
    Calculate weighted project score
    """
    if not scores or not weights:
        return 0.0
    
    total_score = 0.0
    total_weight = 0.0
    
    for criterion, score in scores.items():
        if criterion in weights:
            weight = weights[criterion]
            total_score += score * weight
            total_weight += weight
    
    if total_weight == 0:
        return 0.0
    
    return round(total_score / total_weight, 2)


def get_grade_from_score(score: float, boundaries: list) -> str:
    """
    Get grade from score based on boundaries
    """
    if not boundaries:
        return 'N/A'
    
    # Sort boundaries by min_score descending
    sorted_boundaries = sorted(boundaries, key=lambda x: x.get('min_score', 0), reverse=True)
    
    for boundary in sorted_boundaries:
        if score >= boundary.get('min_score', 0):
            return boundary.get('grade', 'N/A')
    
    return 'F'  # Default to F if no boundary matches


def validate_email_domain(email: str, allowed_domains: list = None) -> bool:
    """
    Validate email domain
    """
    if not email or '@' not in email:
        return False
    
    domain = email.split('@')[1].lower()
    
    if allowed_domains:
        return domain in [d.lower() for d in allowed_domains]
    
    return True


def generate_secure_token(length: int = 32) -> str:
    """
    Generate secure random token
    """
    import secrets
    import string
    
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def is_valid_uuid(uuid_string: str) -> bool:
    """
    Check if string is valid UUID
    """
    import uuid
    
    try:
        uuid.UUID(uuid_string)
        return True
    except ValueError:
        return False
