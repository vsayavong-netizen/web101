# Database Schema Design - Final Project Management System

## Overview
This document outlines the database schema design for the Final Project Management System, supporting multi-year academic data and role-based access control.

## Core Design Principles

### 1. Multi-Year Support
- All academic data is isolated by academic year
- Easy data migration between years
- Historical data preservation

### 2. Role-Based Access Control
- Four user roles: Admin, Advisor, Student, DepartmentAdmin
- Granular permissions per role
- Department-based access for DepartmentAdmin

### 3. Scalable Architecture
- Normalized database design
- Efficient indexing strategy
- Support for future expansion

## Database Schema

### 1. User Management Tables

#### users_user (Custom User Model)
```sql
CREATE TABLE users_user (
    id SERIAL PRIMARY KEY,
    username VARCHAR(150) UNIQUE NOT NULL,
    email VARCHAR(254) UNIQUE NOT NULL,
    first_name VARCHAR(150),
    last_name VARCHAR(150),
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'advisor', 'student', 'dept_admin')),
    academic_year VARCHAR(4) NOT NULL,
    must_change_password BOOLEAN DEFAULT FALSE,
    is_ai_assistant_enabled BOOLEAN DEFAULT TRUE,
    last_login_ip INET,
    is_active BOOLEAN DEFAULT TRUE,
    is_staff BOOLEAN DEFAULT FALSE,
    is_superuser BOOLEAN DEFAULT FALSE,
    date_joined TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    password VARCHAR(128) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_role ON users_user(role);
CREATE INDEX idx_users_academic_year ON users_user(academic_year);
CREATE INDEX idx_users_username ON users_user(username);
```

#### students_student
```sql
CREATE TABLE students_student (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users_user(id) ON DELETE CASCADE,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Monk')),
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    major_id INTEGER REFERENCES majors_major(id),
    classroom_id INTEGER REFERENCES classrooms_classroom(id),
    tel VARCHAR(20),
    email VARCHAR(254),
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved')),
    academic_year VARCHAR(4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_students_student_id ON students_student(student_id);
CREATE INDEX idx_students_academic_year ON students_student(academic_year);
CREATE INDEX idx_students_major ON students_student(major_id);
CREATE UNIQUE INDEX idx_students_user_academic_year ON students_student(user_id, academic_year);
```

#### advisors_advisor
```sql
CREATE TABLE advisors_advisor (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users_user(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    quota INTEGER DEFAULT 3,
    main_committee_quota INTEGER DEFAULT 3,
    second_committee_quota INTEGER DEFAULT 3,
    third_committee_quota INTEGER DEFAULT 3,
    is_department_admin BOOLEAN DEFAULT FALSE,
    academic_year VARCHAR(4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_advisors_academic_year ON advisors_advisor(academic_year);
CREATE INDEX idx_advisors_name ON advisors_advisor(name);
```

### 2. Academic Structure Tables

#### majors_major
```sql
CREATE TABLE majors_major (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    abbreviation VARCHAR(20) NOT NULL,
    academic_year VARCHAR(4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_majors_academic_year ON majors_major(academic_year);
CREATE UNIQUE INDEX idx_majors_name_year ON majors_major(name, academic_year);
```

#### classrooms_classroom
```sql
CREATE TABLE classrooms_classroom (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    major_id INTEGER REFERENCES majors_major(id),
    major_name VARCHAR(200) NOT NULL,
    academic_year VARCHAR(4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_classrooms_academic_year ON classrooms_classroom(academic_year);
CREATE INDEX idx_classrooms_major ON classrooms_classroom(major_id);
```

### 3. Project Management Tables

#### projects_project
```sql
CREATE TABLE projects_project (
    id SERIAL PRIMARY KEY,
    project_id VARCHAR(20) UNIQUE NOT NULL,
    topic_lao TEXT NOT NULL,
    topic_eng TEXT NOT NULL,
    advisor_name VARCHAR(100) NOT NULL,
    advisor_id INTEGER REFERENCES advisors_advisor(id),
    comment TEXT,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    main_committee_id INTEGER REFERENCES advisors_advisor(id),
    second_committee_id INTEGER REFERENCES advisors_advisor(id),
    third_committee_id INTEGER REFERENCES advisors_advisor(id),
    defense_date DATE,
    defense_time TIME,
    defense_room VARCHAR(100),
    final_grade VARCHAR(10),
    main_advisor_score DECIMAL(5,2),
    main_committee_score DECIMAL(5,2),
    second_committee_score DECIMAL(5,2),
    third_committee_score DECIMAL(5,2),
    academic_year VARCHAR(4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_projects_project_id ON projects_project(project_id);
CREATE INDEX idx_projects_academic_year ON projects_project(academic_year);
CREATE INDEX idx_projects_status ON projects_project(status);
CREATE INDEX idx_projects_advisor ON projects_project(advisor_id);
```

#### projects_projectgroup
```sql
CREATE TABLE projects_projectgroup (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects_project(id) ON DELETE CASCADE,
    academic_year VARCHAR(4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_projectgroups_academic_year ON projects_projectgroup(academic_year);
```

#### projects_projectgroup_students
```sql
CREATE TABLE projects_projectgroup_students (
    id SERIAL PRIMARY KEY,
    projectgroup_id INTEGER REFERENCES projects_projectgroup(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES students_student(id) ON DELETE CASCADE,
    UNIQUE(projectgroup_id, student_id)
);
```

### 4. Milestone Management Tables

#### milestones_milestone
```sql
CREATE TABLE milestones_milestone (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects_project(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Submitted', 'Approved', 'Requires Revision')),
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    submitted_date TIMESTAMP WITH TIME ZONE,
    feedback TEXT,
    academic_year VARCHAR(4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_milestones_project ON milestones_milestone(project_id);
CREATE INDEX idx_milestones_academic_year ON milestones_milestone(academic_year);
CREATE INDEX idx_milestones_status ON milestones_milestone(status);
```

#### milestones_milestonetemplate
```sql
CREATE TABLE milestones_milestonetemplate (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    academic_year VARCHAR(4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_milestone_templates_academic_year ON milestones_milestonetemplate(academic_year);
```

### 5. Communication & Logging Tables

#### communication_logentry
```sql
CREATE TABLE communication_logentry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id INTEGER REFERENCES projects_project(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('message', 'event')),
    author_id INTEGER REFERENCES users_user(id),
    author_name VARCHAR(100) NOT NULL,
    author_role VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    file_id UUID,
    file_name VARCHAR(255),
    file_type VARCHAR(100),
    file_size BIGINT,
    academic_year VARCHAR(4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_logentries_project ON communication_logentry(project_id);
CREATE INDEX idx_logentries_academic_year ON communication_logentry(academic_year);
CREATE INDEX idx_logentries_author ON communication_logentry(author_id);
CREATE INDEX idx_logentries_created_at ON communication_logentry(created_at);
```

### 6. Notification System Tables

#### notifications_notification
```sql
CREATE TABLE notifications_notification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200),
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    project_id INTEGER REFERENCES projects_project(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('Submission', 'Approval', 'Feedback', 'Mention', 'Message', 'System')),
    academic_year VARCHAR(4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_academic_year ON notifications_notification(academic_year);
CREATE INDEX idx_notifications_type ON notifications_notification(type);
CREATE INDEX idx_notifications_created_at ON notifications_notification(created_at);
```

#### notifications_notification_users
```sql
CREATE TABLE notifications_notification_users (
    id SERIAL PRIMARY KEY,
    notification_id UUID REFERENCES notifications_notification(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users_user(id) ON DELETE CASCADE,
    UNIQUE(notification_id, user_id)
);

-- Indexes
CREATE INDEX idx_notification_users_user ON notifications_notification_users(user_id);
```

### 7. File Management Tables

#### files_uploadedfile
```sql
CREATE TABLE files_uploadedfile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    project_id INTEGER REFERENCES projects_project(id),
    uploaded_by INTEGER REFERENCES users_user(id),
    academic_year VARCHAR(4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_files_project ON files_uploadedfile(project_id);
CREATE INDEX idx_files_academic_year ON files_uploadedfile(academic_year);
CREATE INDEX idx_files_uploaded_by ON files_uploadedfile(uploaded_by);
```

### 8. Settings & Configuration Tables

#### settings_defensesettings
```sql
CREATE TABLE settings_defensesettings (
    id SERIAL PRIMARY KEY,
    start_defense_date DATE NOT NULL,
    time_slots TEXT NOT NULL,
    rooms JSONB,
    stationary_advisors JSONB,
    timezone VARCHAR(50) DEFAULT 'Asia/Bangkok',
    academic_year VARCHAR(4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX idx_defense_settings_year ON settings_defensesettings(academic_year);
```

#### settings_scoringsettings
```sql
CREATE TABLE settings_scoringsettings (
    id SERIAL PRIMARY KEY,
    main_advisor_weight INTEGER DEFAULT 60,
    committee_weight INTEGER DEFAULT 40,
    grade_boundaries JSONB,
    advisor_rubrics JSONB,
    committee_rubrics JSONB,
    academic_year VARCHAR(4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX idx_scoring_settings_year ON settings_scoringsettings(academic_year);
```

## Database Constraints & Relationships

### 1. Multi-Year Data Isolation
- All tables include `academic_year` field
- Unique constraints on academic year for settings
- Foreign key relationships respect academic year boundaries

### 2. Role-Based Access Patterns
- User role determines data access scope
- DepartmentAdmin can only access their specialized majors
- Advisor can only access their assigned projects

### 3. Data Integrity
- Foreign key constraints ensure referential integrity
- Check constraints validate enum values
- Unique constraints prevent duplicates

## Performance Optimization

### 1. Indexing Strategy
- Primary keys on all tables
- Foreign key indexes for join performance
- Composite indexes for common query patterns
- Academic year indexes for multi-year queries

### 2. Query Optimization
- Use `select_related()` for foreign key relationships
- Use `prefetch_related()` for many-to-many relationships
- Academic year filtering on all queries
- Pagination for large result sets

### 3. Caching Strategy
- Redis for session storage
- Query result caching for frequently accessed data
- Academic year data caching
- User permission caching

## Migration Strategy

### 1. Academic Year Transitions
- Copy master data (majors, classrooms, templates) to new year
- Archive previous year data
- Update user academic year assignments
- Reset project data for new year

### 2. Data Backup & Recovery
- Regular database backups
- Academic year data export/import
- Point-in-time recovery capabilities
- Data validation after migrations

This schema design provides a solid foundation for the Final Project Management System with proper multi-year support and role-based access control.
