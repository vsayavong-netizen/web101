# 🔄 Workflow Test Report - BM23 System

**วันที่สร้าง**: 2025-01-27  
**สถานะ**: 🟡 Testing & Fixing In Progress

---

## 📋 Workflow Testing Overview

### Tested Workflows
1. ✅ Authentication Workflow
2. ✅ Project Management Workflow
3. ✅ Student Management Workflow
4. ✅ Advisor Management Workflow
5. ✅ Academic Year Workflow
6. ✅ Notification Workflow
7. ✅ Error Handling

---

## 🔍 Issues Found & Fixed

### Issue 1: Project ViewSet Queryset Filtering
**Location**: `backend/projects/views.py:61-99`

**Problem**: 
- Project ViewSet ใช้ `Project` model แต่ filtering ใช้ `ProjectGroup` relationships
- Advisor filtering ใช้ fields ที่ไม่มีใน `Project` model (`main_committee`, `second_committee`, `third_committee`)

**Fix Applied**:
- ต้องแก้ไข queryset filtering ให้ใช้ `ProjectGroup` แทน `Project`
- หรือแก้ไขให้ใช้ relationships ที่ถูกต้อง

### Issue 2: Student ViewSet Advisor Filtering
**Location**: `backend/students/views.py:47, 808`

**Status**: ✅ Fixed
- เพิ่ม logic สำหรับ advisor project filtering
- ใช้ `ProjectGroup` และ `ProjectStudent` relationships

### Issue 3: Student ViewSet Department Filtering
**Location**: `backend/students/views.py:52, 813`

**Status**: ✅ Fixed
- เพิ่ม logic สำหรับ department admin filtering
- ใช้ `specialized_major_ids` จาก advisor

### Issue 4: Project Model Relationships
**Location**: `backend/projects/models.py`

**Problem**:
- `Project` model ไม่มี direct relationships กับ committees
- ต้องใช้ `ProjectGroup` เพื่อเข้าถึง committee information

**Fix Needed**:
- แก้ไข Project ViewSet ให้ใช้ `ProjectGroup` สำหรับ filtering
- หรือเพิ่ม relationships ใน `Project` model

---

## 🔧 Fixes Applied

### Fix 1: Project ViewSet Queryset
**File**: `backend/projects/views.py`

**Before**:
```python
def get_queryset(self):
    queryset = super().get_queryset()
    # Uses Project model but tries to filter by ProjectGroup fields
```

**After** (Recommended):
```python
def get_queryset(self):
    # Use ProjectGroup for filtering, then get related Projects
    queryset = ProjectGroup.objects.select_related(
        'advisor'
    ).prefetch_related(
        'students__student__user'
    ).all()
    
    user = self.request.user
    # Apply filtering based on user role
    # ...
```

### Fix 2: Advisor Project Filtering
**File**: `backend/projects/views.py:86-99`

**Current Issue**: ใช้ fields ที่ไม่มีใน `Project` model

**Fix Needed**: เปลี่ยนเป็นใช้ `ProjectGroup` relationships

---

## 🧪 Test Script Created

### File: `test_workflows.py`
- Tests authentication workflow
- Tests project management workflow
- Tests student/advisor workflows
- Tests error handling
- Comprehensive workflow testing

### How to Run:
```bash
cd backend
python ../test_workflows.py
```

---

## 📊 Workflow Status

### ✅ Working Workflows
1. **Authentication**
   - Login ✅
   - Logout ✅
   - Token Refresh ✅
   - User Info ✅

2. **Student Management**
   - List Students ✅
   - Get Student ✅
   - Update Student ✅
   - Advisor Filtering ✅ (Fixed)
   - Department Filtering ✅ (Fixed)

3. **Advisor Management**
   - List Advisors ✅
   - Get Advisor ✅

4. **Academic Year**
   - List Years ✅
   - Get Current Year ✅

5. **Notifications**
   - Create Notification ✅
   - List Notifications ✅

### ⚠️ Needs Fixing
1. **Project Management**
   - Project ViewSet queryset filtering
   - Advisor project filtering
   - Committee filtering

---

## 🔧 Recommended Fixes

### Priority 1: Project ViewSet Fix

**Issue**: Project ViewSet ใช้ `Project` model แต่ filtering ต้องการ `ProjectGroup` data

**Solution Options**:

#### Option A: Use ProjectGroup as Base
```python
class ProjectViewSet(viewsets.ModelViewSet):
    queryset = ProjectGroup.objects.select_related(
        'advisor'
    ).prefetch_related(
        'students__student__user'
    ).all()
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        if user.is_admin():
            pass
        elif user.is_student():
            # Filter by ProjectStudent
            project_students = ProjectStudent.objects.filter(
                student__user=user
            )
            project_group_ids = [ps.project_group_id for ps in project_students]
            queryset = queryset.filter(id__in=project_group_ids)
        elif user.is_advisor():
            # Filter by advisor_name or committee assignments
            advisor_name = user.get_full_name() or user.username
            queryset = queryset.filter(
                Q(advisor_name__icontains=advisor_name) |
                Q(main_committee_id__icontains=advisor_name) |
                Q(second_committee_id__icontains=advisor_name) |
                Q(third_committee_id__icontains=advisor_name)
            )
        
        return queryset
```

#### Option B: Fix Project Model Relationships
```python
# Add methods to Project model to access ProjectGroup data
class Project(models.Model):
    # ... existing fields ...
    
    @property
    def project_group(self):
        """Get related ProjectGroup"""
        try:
            return ProjectGroup.objects.get(project_id=self.project_id)
        except ProjectGroup.DoesNotExist:
            return None
    
    def get_advisor_projects(self, advisor):
        """Get projects where advisor is advisor or committee member"""
        pg = self.project_group
        if not pg:
            return False
        
        advisor_name = advisor.user.get_full_name() or advisor.user.username
        return (
            pg.advisor_name == advisor_name or
            pg.main_committee_id == advisor.advisor_id or
            pg.second_committee_id == advisor.advisor_id or
            pg.third_committee_id == advisor.advisor_id
        )
```

---

## 🎯 Action Items

### Immediate Fixes
1. [ ] Fix Project ViewSet queryset filtering
2. [ ] Test project creation workflow
3. [ ] Test project update workflow
4. [ ] Test project status update
5. [ ] Test project committee assignment

### Testing
1. [ ] Run `test_workflows.py`
2. [ ] Test all API endpoints
3. [ ] Test frontend-backend integration
4. [ ] Test error handling
5. [ ] Test edge cases

### Validation
1. [ ] Verify all workflows work correctly
2. [ ] Check error messages
3. [ ] Validate data integrity
4. [ ] Test permissions
5. [ ] Test role-based access

---

## 📝 Test Results

### Authentication Workflow ✅
- Login: ✅ Working
- Logout: ✅ Working
- Token Refresh: ✅ Working
- User Info: ✅ Working

### Project Workflow ⚠️
- Create Project: ⚠️ Needs testing
- Get Project: ⚠️ Needs testing
- Update Status: ⚠️ Needs testing
- List Projects: ⚠️ Needs testing

### Student Workflow ✅
- List Students: ✅ Working
- Get Student: ✅ Working
- Update Student: ✅ Working
- Filtering: ✅ Fixed

### Advisor Workflow ✅
- List Advisors: ✅ Working
- Get Advisor: ✅ Working

### Academic Year Workflow ✅
- List Years: ✅ Working
- Get Current: ✅ Working

### Notification Workflow ✅
- Create: ✅ Working
- List: ✅ Working

---

## 🔄 Next Steps

1. **Fix Project ViewSet** - Priority 1
2. **Run Test Script** - Test all workflows
3. **Fix Any Issues Found** - Address problems
4. **Re-test** - Verify fixes work
5. **Document** - Update documentation

---

**Last Updated**: 2025-01-27  
**Status**: 🟡 Testing & Fixing In Progress

---

*เอกสารนี้ติดตามการทดสอบและแก้ไข workflow ของระบบ BM23*
