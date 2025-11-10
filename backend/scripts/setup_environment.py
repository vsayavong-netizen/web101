"""
Environment Setup Script
Automatically sets up development environment
"""

import os
import sys
from pathlib import Path
import secrets

BASE_DIR = Path(__file__).resolve().parent.parent


def generate_secret_key():
    """Generate a secure secret key"""
    return secrets.token_urlsafe(50)


def create_env_file():
    """Create .env file if it doesn't exist"""
    env_file = BASE_DIR / '.env'
    env_example = BASE_DIR / '.env.example'
    
    if env_file.exists():
        print("✅ .env file already exists")
        return
    
    if not env_example.exists():
        print("❌ .env.example not found")
        return
    
    # Read example file
    with open(env_example, 'r') as f:
        content = f.read()
    
    # Replace placeholder values
    content = content.replace(
        'your-secret-key-here-change-in-production',
        generate_secret_key()
    )
    
    # Write .env file
    with open(env_file, 'w') as f:
        f.write(content)
    
    print("✅ Created .env file")
    print("⚠️  Please review and update .env file with your configuration")


def create_directories():
    """Create necessary directories"""
    directories = [
        BASE_DIR / 'logs',
        BASE_DIR / 'staticfiles',
        BASE_DIR / 'media',
    ]
    
    for directory in directories:
        directory.mkdir(exist_ok=True)
        print(f"✅ Created directory: {directory}")


def check_dependencies():
    """Check if required dependencies are installed"""
    try:
        import django
        print(f"✅ Django {django.__version__} installed")
    except ImportError:
        print("❌ Django not installed. Run: pip install -r requirements.txt")
        return False
    
    try:
        import rest_framework
        print("✅ Django REST Framework installed")
    except ImportError:
        print("❌ Django REST Framework not installed")
        return False
    
    try:
        import corsheaders
        print("✅ django-cors-headers installed")
    except ImportError:
        print("❌ django-cors-headers not installed")
        return False
    
    return True


def setup_database():
    """Setup database"""
    print("\n📊 Database Setup")
    print("=" * 60)
    
    # Check if database exists
    db_file = BASE_DIR / 'db.sqlite3'
    if db_file.exists():
        print("✅ Database file exists")
    else:
        print("ℹ️  Database file will be created on first migration")
    
    print("\nTo setup database, run:")
    print("  python manage.py migrate")
    print("  python manage.py createsuperuser")


def main():
    """Main setup function"""
    print("=" * 60)
    print("Environment Setup")
    print("=" * 60)
    print()
    
    # Check dependencies
    print("📦 Checking Dependencies")
    print("-" * 60)
    if not check_dependencies():
        print("\n❌ Please install dependencies first:")
        print("  pip install -r requirements.txt")
        return
    print()
    
    # Create directories
    print("📁 Creating Directories")
    print("-" * 60)
    create_directories()
    print()
    
    # Create .env file
    print("⚙️  Environment Configuration")
    print("-" * 60)
    create_env_file()
    print()
    
    # Database setup
    setup_database()
    print()
    
    print("=" * 60)
    print("✅ Setup Complete!")
    print("=" * 60)
    print()
    print("Next steps:")
    print("1. Review and update .env file")
    print("2. Run: python manage.py migrate")
    print("3. Run: python manage.py createsuperuser")
    print("4. Run: python manage.py runserver")
    print()


if __name__ == '__main__':
    main()

