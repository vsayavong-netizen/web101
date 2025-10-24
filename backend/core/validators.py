"""
Security validators for the Final Project Management System
"""

import re
import bleach
from django.core.exceptions import ValidationError
from django.core.validators import BaseValidator
from django.utils.translation import gettext_lazy as _
from django.conf import settings


class CustomPasswordValidator(BaseValidator):
    """
    Custom password validator with additional security checks
    """
    def __init__(self, min_length=8, require_uppercase=True, require_lowercase=True, 
                 require_numbers=True, require_special_chars=True):
        self.min_length = min_length
        self.require_uppercase = require_uppercase
        self.require_lowercase = require_lowercase
        self.require_numbers = require_numbers
        self.require_special_chars = require_special_chars

    def validate(self, password, user=None):
        errors = []
        
        if len(password) < self.min_length:
            errors.append(
                ValidationError(
                    f"Password must be at least {self.min_length} characters long.",
                    code='password_too_short',
                )
            )
        
        if self.require_uppercase and not re.search(r'[A-Z]', password):
            errors.append(
                ValidationError(
                    "Password must contain at least one uppercase letter.",
                    code='password_no_uppercase',
                )
            )
        
        if self.require_lowercase and not re.search(r'[a-z]', password):
            errors.append(
                ValidationError(
                    "Password must contain at least one lowercase letter.",
                    code='password_no_lowercase',
                )
            )
        
        if self.require_numbers and not re.search(r'\d', password):
            errors.append(
                ValidationError(
                    "Password must contain at least one number.",
                    code='password_no_numbers',
                )
            )
        
        if self.require_special_chars and not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            errors.append(
                ValidationError(
                    "Password must contain at least one special character.",
                    code='password_no_special_chars',
                )
            )
        
        # Check for common weak patterns
        if re.search(r'(.)\1{2,}', password):  # Repeated characters
            errors.append(
                ValidationError(
                    "Password cannot contain more than 2 consecutive identical characters.",
                    code='password_repeated_chars',
                )
            )
        
        if re.search(r'(123|abc|qwe|asd|zxc)', password.lower()):  # Common sequences
            errors.append(
                ValidationError(
                    "Password cannot contain common sequences.",
                    code='password_common_sequences',
                )
            )
        
        if errors:
            raise ValidationError(errors)

    def get_help_text(self):
        return _(
            "Password must be at least %(min_length)d characters long, "
            "contain uppercase and lowercase letters, numbers, and special characters."
        ) % {'min_length': self.min_length}


class FileTypeValidator:
    """
    Validator for file type security
    """
    def __init__(self, allowed_types=None):
        self.allowed_types = allowed_types or getattr(settings, 'ALLOWED_FILE_TYPES', [])

    def __call__(self, file):
        if not file:
            return
        
        if file.content_type not in self.allowed_types:
            raise ValidationError(
                f"File type '{file.content_type}' is not allowed. "
                f"Allowed types: {', '.join(self.allowed_types)}"
            )


class FileSizeValidator:
    """
    Validator for file size security
    """
    def __init__(self, max_size=None):
        self.max_size = max_size or getattr(settings, 'MAX_FILE_SIZE', 10 * 1024 * 1024)

    def __call__(self, file):
        if not file:
            return
        
        if file.size > self.max_size:
            raise ValidationError(
                f"File size ({file.size} bytes) exceeds maximum allowed size "
                f"({self.max_size} bytes)."
            )


class InputSanitizer:
    """
    Input sanitizer to prevent XSS and injection attacks
    """
    ALLOWED_TAGS = ['b', 'i', 'u', 'strong', 'em', 'p', 'br', 'ul', 'ol', 'li']
    ALLOWED_ATTRIBUTES = {}
    ALLOWED_PROTOCOLS = ['http', 'https', 'mailto']

    @classmethod
    def sanitize_text(cls, text):
        """
        Sanitize text input to prevent XSS attacks
        """
        if not text:
            return text
        
        # Remove potentially dangerous characters
        text = re.sub(r'[<>"\']', '', text)
        
        # Use bleach to clean HTML
        cleaned = bleach.clean(
            text,
            tags=cls.ALLOWED_TAGS,
            attributes=cls.ALLOWED_ATTRIBUTES,
            protocols=cls.ALLOWED_PROTOCOLS,
            strip=True
        )
        
        return cleaned

    @classmethod
    def sanitize_filename(cls, filename):
        """
        Sanitize filename to prevent path traversal attacks
        """
        if not filename:
            return filename
        
        # Remove path traversal attempts
        filename = re.sub(r'\.\./', '', filename)
        filename = re.sub(r'\.\.\\', '', filename)
        
        # Remove dangerous characters
        filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
        
        # Limit length
        if len(filename) > 255:
            name, ext = filename.rsplit('.', 1) if '.' in filename else (filename, '')
            filename = name[:255-len(ext)-1] + '.' + ext if ext else name[:255]
        
        return filename


class SQLInjectionValidator:
    """
    Validator to detect and prevent SQL injection attacks
    """
    DANGEROUS_PATTERNS = [
        r'union\s+select',
        r'drop\s+table',
        r'delete\s+from',
        r'insert\s+into',
        r'update\s+set',
        r'alter\s+table',
        r'create\s+table',
        r'exec\s*\(',
        r'execute\s*\(',
        r'sp_',
        r'xp_',
        r'--',
        r'/\*',
        r'\*/',
        r';\s*drop',
        r';\s*delete',
        r';\s*insert',
        r';\s*update',
        r';\s*alter',
    ]

    @classmethod
    def validate_input(cls, value):
        """
        Validate input for SQL injection patterns
        """
        if not value:
            return value
        
        value_lower = value.lower()
        
        for pattern in cls.DANGEROUS_PATTERNS:
            if re.search(pattern, value_lower, re.IGNORECASE):
                raise ValidationError(
                    "Input contains potentially dangerous SQL patterns."
                )
        
        return value


class XSSValidator:
    """
    Validator to detect and prevent XSS attacks
    """
    XSS_PATTERNS = [
        r'<script.*?>.*?</script>',
        r'javascript:',
        r'vbscript:',
        r'onload\s*=',
        r'onerror\s*=',
        r'onclick\s*=',
        r'onmouseover\s*=',
        r'onfocus\s*=',
        r'onblur\s*=',
        r'onchange\s*=',
        r'onsubmit\s*=',
        r'onreset\s*=',
        r'onkeydown\s*=',
        r'onkeyup\s*=',
        r'onkeypress\s*=',
        r'expression\s*\(',
        r'url\s*\(',
        r'@import',
        r'<iframe',
        r'<object',
        r'<embed',
        r'<applet',
        r'<form',
        r'<input',
        r'<textarea',
        r'<select',
        r'<option',
        r'<button',
    ]

    @classmethod
    def validate_input(cls, value):
        """
        Validate input for XSS patterns
        """
        if not value:
            return value
        
        for pattern in cls.XSS_PATTERNS:
            if re.search(pattern, value, re.IGNORECASE):
                raise ValidationError(
                    "Input contains potentially dangerous XSS patterns."
                )
        
        return value


class EmailValidator:
    """
    Enhanced email validator with security checks
    """
    EMAIL_REGEX = re.compile(
        r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    )
    
    DANGEROUS_EMAIL_PATTERNS = [
        r'<script',
        r'javascript:',
        r'vbscript:',
        r'data:',
        r'file:',
    ]

    @classmethod
    def validate_email(cls, email):
        """
        Validate email format and security
        """
        if not email:
            return email
        
        # Check basic email format
        if not cls.EMAIL_REGEX.match(email):
            raise ValidationError("Invalid email format.")
        
        # Check for dangerous patterns
        email_lower = email.lower()
        for pattern in cls.DANGEROUS_EMAIL_PATTERNS:
            if re.search(pattern, email_lower):
                raise ValidationError("Email contains potentially dangerous content.")
        
        # Check email length
        if len(email) > 254:
            raise ValidationError("Email address is too long.")
        
        return email


class PhoneNumberValidator:
    """
    Phone number validator with security checks
    """
    PHONE_REGEX = re.compile(r'^[\+]?[0-9\s\-\(\)]{7,20}$')
    
    @classmethod
    def validate_phone(cls, phone):
        """
        Validate phone number format and security
        """
        if not phone:
            return phone
        
        # Remove all non-digit characters for validation
        digits_only = re.sub(r'\D', '', phone)
        
        # Check if it's a valid phone number
        if not cls.PHONE_REGEX.match(phone):
            raise ValidationError("Invalid phone number format.")
        
        # Check length
        if len(digits_only) < 7 or len(digits_only) > 15:
            raise ValidationError("Phone number must be between 7 and 15 digits.")
        
        return phone


class AcademicYearValidator:
    """
    Academic year validator
    """
    @classmethod
    def validate_year(cls, year):
        """
        Validate academic year format and range
        """
        if not year:
            return year
        
        # Check if it's a 4-digit year
        if not re.match(r'^\d{4}$', year):
            raise ValidationError("Academic year must be a 4-digit year.")
        
        year_int = int(year)
        current_year = 2024  # You might want to get this dynamically
        
        # Check if year is within reasonable range
        if year_int < 2020 or year_int > current_year + 1:
            raise ValidationError(
                f"Academic year must be between 2020 and {current_year + 1}."
            )
        
        return year


class StudentIDValidator:
    """
    Student ID validator
    """
    STUDENT_ID_REGEX = re.compile(r'^\d{3}[A-Z]\d{4}/\d{2}$')
    
    @classmethod
    def validate_student_id(cls, student_id):
        """
        Validate student ID format
        """
        if not student_id:
            return student_id
        
        if not cls.STUDENT_ID_REGEX.match(student_id):
            raise ValidationError(
                "Student ID must be in format: 155N1000/21"
            )
        
        return student_id


class ProjectIDValidator:
    """
    Project ID validator
    """
    PROJECT_ID_REGEX = re.compile(r'^P\d{2}\d{3}$')
    
    @classmethod
    def validate_project_id(cls, project_id):
        """
        Validate project ID format
        """
        if not project_id:
            return project_id
        
        if not cls.PROJECT_ID_REGEX.match(project_id):
            raise ValidationError(
                "Project ID must be in format: P24001"
            )
        
        return project_id


class SecurityValidator:
    """
    Comprehensive security validator
    """
    @classmethod
    def validate_all(cls, data):
        """
        Validate all input data for security issues
        """
        if not isinstance(data, dict):
            return data
        
        for key, value in data.items():
            if isinstance(value, str):
                # Sanitize text input
                data[key] = InputSanitizer.sanitize_text(value)
                
                # Check for SQL injection
                SQLInjectionValidator.validate_input(value)
                
                # Check for XSS
                XSSValidator.validate_input(value)
        
        return data
