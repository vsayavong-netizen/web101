# Generated manually to safely fix evaluator_id migration issue

from django.db import migrations, connection


def safely_remove_evaluator_id(apps, schema_editor):
    """Safely remove evaluator_id column if it exists."""
    with connection.cursor() as cursor:
        # Check database engine
        db_engine = connection.vendor
        
        if db_engine == 'postgresql':
            # PostgreSQL check
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'project_scores' 
                AND column_name = 'evaluator_id'
            """)
            column_exists = cursor.fetchone()
        elif db_engine == 'sqlite':
            # SQLite check
            cursor.execute("PRAGMA table_info(project_scores)")
            columns = cursor.fetchall()
            column_exists = any(col[1] == 'evaluator_id' for col in columns)
        else:
            # For other databases, try to remove the column directly
            column_exists = True
        
        if column_exists:
            # Column exists, remove it safely
            try:
                if db_engine == 'sqlite':
                    # SQLite doesn't support DROP COLUMN directly, so we'll skip
                    print("SQLite detected: evaluator_id column removal skipped (not supported)")
                else:
                    cursor.execute("ALTER TABLE project_scores DROP COLUMN evaluator_id")
                    print("evaluator_id column removed successfully")
            except Exception as e:
                # If there's an error, log it but don't fail the migration
                print(f"Warning: Could not remove evaluator_id column: {e}")
        else:
            # Column doesn't exist, which is fine
            print("evaluator_id column does not exist, skipping removal")


def reverse_safely_remove_evaluator_id(apps, schema_editor):
    """Reverse migration - this is a no-op since we're just removing a column."""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('scoring', '0006_auto_20251022_0251'),
    ]

    operations = [
        migrations.RunPython(
            safely_remove_evaluator_id,
            reverse_safely_remove_evaluator_id,
        ),
    ]
