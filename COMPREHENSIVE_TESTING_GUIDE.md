# 🧪 Comprehensive Testing Guide
## Final Project Management System - Complete Test Scenarios

**Version**: 1.0.0  
**Date**: October 24, 2025  
**Test Environment**: https://eduinfo.online/

---

## 📋 Table of Contents

1. [Pre-Test Setup](#pre-test-setup)
2. [Authentication Tests](#authentication-tests)
3. [User Management Tests](#user-management-tests)
4. [Project Management Tests](#project-management-tests)
5. [API Endpoint Tests](#api-endpoint-tests)
6. [Performance Tests](#performance-tests)
7. [Security Tests](#security-tests)
8. [Browser Compatibility Tests](#browser-compatibility-tests)

---

## 🔧 Pre-Test Setup

### Environment Check
```bash
# Verify backend is running
curl -I https://eduinfo.online/api/

# Expected Response: HTTP 200 or 401 (depends on authentication)
```

### Test User Accounts (To Create After Deployment)
```
Admin Account:
- Username: admin
- Email: admin@eduinfo.online
- Password: SecurePassword123!

Advisor Account:
- Username: advisor01
- Email: advisor@eduinfo.online
- Password: AdvisorPass123!

Student Account:
- Username: student01
- Email: student@eduinfo.online
- Password: StudentPass123!

Department Admin Account:
- Username: deptadmin
- Email: deptadmin@eduinfo.online
- Password: DeptPass123!
```

---

## 🔐 Authentication Tests

### Test 1.1: Login Page Loads
**Steps**:
1. Navigate to https://eduinfo.online/
2. Click "Login"

**Expected Result**:
- [ ] Login page displays
- [ ] Email/Username field visible
- [ ] Password field visible
- [ ] "Login" button present
- [ ] "Forgot Password" link visible

### Test 1.2: Successful Login
**Steps**:
1. Enter valid admin credentials
2. Click "Login"

**Expected Result**:
- [ ] Redirected to dashboard
- [ ] User profile visible in header
- [ ] Sidebar menu appears
- [ ] No error messages

### Test 1.3: Failed Login - Invalid Credentials
**Steps**:
1. Enter wrong password
2. Click "Login"

**Expected Result**:
- [ ] Error message displays: "Invalid credentials"
- [ ] Stays on login page
- [ ] Fields not cleared (good UX)

### Test 1.4: Failed Login - Empty Fields
**Steps**:
1. Leave fields empty
2. Click "Login"

**Expected Result**:
- [ ] Validation error appears
- [ ] "Email/Username required" message
- [ ] "Password required" message

### Test 1.5: Session Persistence
**Steps**:
1. Login successfully
2. Close browser
3. Reopen and go to site

**Expected Result**:
- [ ] Still logged in
- [ ] Session cookie persists
- [ ] No re-login required

### Test 1.6: Logout
**Steps**:
1. Click profile icon → "Logout"

**Expected Result**:
- [ ] Redirected to login page
- [ ] Session cleared
- [ ] Cannot access protected pages

### Test 1.7: Token Expiration
**Steps**:
1. Login
2. Wait 24 hours (or manipulate system time)
3. Try to make API request

**Expected Result**:
- [ ] 401 Unauthorized response
- [ ] User redirected to login
- [ ] Token refresh mechanism works

---

## 👥 User Management Tests

### Test 2.1: View Users List
**Steps**:
1. Login as admin
2. Go to Users/Management section

**Expected Result**:
- [ ] User list displays
- [ ] Search functionality works
- [ ] Pagination works (if >20 users)
- [ ] Sort by name/email works

### Test 2.2: Create New User
**Steps**:
1. Click "Add User" button
2. Fill in form:
   - Email: test@example.com
   - Name: Test User
   - Role: Student
3. Click "Create"

**Expected Result**:
- [ ] User created successfully
- [ ] Confirmation message appears
- [ ] User appears in list
- [ ] Email notification sent

### Test 2.3: Edit User
**Steps**:
1. Click on a user
2. Modify: name or role
3. Click "Save"

**Expected Result**:
- [ ] Changes saved
- [ ] Updated in list
- [ ] Success notification
- [ ] Audit log recorded

### Test 2.4: Delete User
**Steps**:
1. Select user
2. Click "Delete"
3. Confirm deletion

**Expected Result**:
- [ ] User removed from list
- [ ] Confirmation message
- [ ] Cannot login with deleted account
- [ ] Soft delete (data preserved)

### Test 2.5: User Roles & Permissions
**Steps**:
1. Test with different roles:
   - Admin: Full access
   - Advisor: Limited access
   - Student: Read-only access

**Expected Result**:
- [ ] Each role has correct permissions
- [ ] Unauthorized actions blocked
- [ ] Error messages appropriate

---

## 📊 Project Management Tests

### Test 3.1: View Projects List
**Steps**:
1. Login as admin/advisor
2. Go to Projects

**Expected Result**:
- [ ] List loads with projects
- [ ] Project cards display:
  - Title
  - Student names
  - Status
  - Progress bar
- [ ] Filters work (by status, date)
- [ ] Search functionality works

### Test 3.2: Create Project
**Steps**:
1. Click "Create Project"
2. Fill form:
   - Title: "AI Chatbot System"
   - Description: Test description
   - Student: Select student
   - Advisor: Select advisor
3. Click "Create"

**Expected Result**:
- [ ] Project created
- [ ] Redirects to project detail
- [ ] All fields saved
- [ ] Notification sent to team

### Test 3.3: Edit Project
**Steps**:
1. Open existing project
2. Click "Edit"
3. Change title or description
4. Save

**Expected Result**:
- [ ] Changes saved
- [ ] Updated in list
- [ ] Version history recorded
- [ ] Audit log entry created

### Test 3.4: Project Status Workflow
**Steps**:
1. Create project (Initial status)
2. Change status: Initiation → Planning → Development → Testing → Completion

**Expected Result**:
- [ ] Each status transition works
- [ ] Cannot skip statuses
- [ ] Status-appropriate actions available
- [ ] Timeline updated

### Test 3.5: Project Comments
**Steps**:
1. Open project
2. Click "Comments"
3. Add comment: "Test comment"
4. Click "Post"

**Expected Result**:
- [ ] Comment appears immediately
- [ ] User/timestamp visible
- [ ] Edit own comment works
- [ ] Delete own comment works

### Test 3.6: Project Files/Attachments
**Steps**:
1. Go to project
2. Click "Files" tab
3. Upload file (< 10MB)

**Expected Result**:
- [ ] File uploads successfully
- [ ] Progress indicator shows
- [ ] File appears in list
- [ ] Can download file
- [ ] File size correct

### Test 3.7: Project Milestones
**Steps**:
1. Open project
2. View "Milestones" tab
3. Mark milestone complete

**Expected Result**:
- [ ] Milestones display
- [ ] Can mark complete
- [ ] Progress updates
- [ ] Notifications sent

---

## 🔌 API Endpoint Tests

### Test 4.1: Authentication Endpoints

#### POST /api/auth/login/
```bash
curl -X POST https://eduinfo.online/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"pass123"}'
```
**Expected**: 200 OK with JWT token

#### POST /api/auth/logout/
```bash
curl -X POST https://eduinfo.online/api/auth/logout/ \
  -H "Authorization: Bearer TOKEN"
```
**Expected**: 200 OK

#### GET /api/auth/profile/
```bash
curl -X GET https://eduinfo.online/api/auth/profile/ \
  -H "Authorization: Bearer TOKEN"
```
**Expected**: 200 OK with user profile

### Test 4.2: User Endpoints

#### GET /api/users/
```bash
curl -X GET https://eduinfo.online/api/users/ \
  -H "Authorization: Bearer TOKEN"
```
**Expected**: 200 OK with user list

#### POST /api/users/
```bash
curl -X POST https://eduinfo.online/api/users/ \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email":"newuser@test.com",
    "name":"New User",
    "role":"student"
  }'
```
**Expected**: 201 Created

### Test 4.3: Project Endpoints

#### GET /api/projects/
**Expected**: 200 OK with projects list

#### POST /api/projects/
**Expected**: 201 Created

#### GET /api/projects/{id}/
**Expected**: 200 OK with project detail

#### PATCH /api/projects/{id}/
**Expected**: 200 OK with updated project

### Test 4.4: Error Handling

#### 401 Unauthorized
```bash
curl -X GET https://eduinfo.online/api/projects/
```
**Expected**: 401 Unauthorized

#### 403 Forbidden (Insufficient Permissions)
```bash
curl -X DELETE https://eduinfo.online/api/users/123/ \
  -H "Authorization: Bearer STUDENT_TOKEN"
```
**Expected**: 403 Forbidden

#### 404 Not Found
```bash
curl -X GET https://eduinfo.online/api/projects/999999/
```
**Expected**: 404 Not Found

#### 400 Bad Request
```bash
curl -X POST https://eduinfo.online/api/users/ \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Invalid"}'
```
**Expected**: 400 Bad Request (missing email)

---

## ⚡ Performance Tests

### Test 5.1: Page Load Time
**Steps**:
1. Open DevTools (F12)
2. Go to Network tab
3. Load pages:
   - Login page
   - Dashboard
   - Projects list
   - Project detail

**Expected Result**:
- [ ] Login page: < 2s
- [ ] Dashboard: < 3s
- [ ] Projects list: < 3s
- [ ] Project detail: < 2s

### Test 5.2: API Response Time
**Steps**:
1. Monitor API calls in DevTools
2. Check response times

**Expected Result**:
- [ ] List endpoints: < 500ms
- [ ] Single resource: < 200ms
- [ ] Create operations: < 500ms
- [ ] No N+1 queries

### Test 5.3: Memory Usage
**Steps**:
1. Open DevTools → Memory tab
2. Take heap snapshot
3. Perform actions (add projects, comments)
4. Take another snapshot

**Expected Result**:
- [ ] No memory leaks
- [ ] Heap size stable
- [ ] No constantly growing memory

### Test 5.4: Database Query Performance
**Steps**:
1. Enable Django Debug Toolbar (dev only)
2. Monitor queries on each page

**Expected Result**:
- [ ] < 20 queries per page load
- [ ] No duplicate queries
- [ ] Proper query optimization

---

## 🔒 Security Tests

### Test 6.1: SQL Injection Prevention
**Steps**:
1. Try search with: `'; DROP TABLE users; --`

**Expected Result**:
- [ ] Query sanitized
- [ ] No error
- [ ] No data loss

### Test 6.2: XSS Prevention
**Steps**:
1. Try posting comment with: `<script>alert('XSS')</script>`

**Expected Result**:
- [ ] Script not executed
- [ ] HTML escaped
- [ ] Shows as plain text

### Test 6.3: CSRF Protection
**Steps**:
1. Make POST request without CSRF token

**Expected Result**:
- [ ] 403 Forbidden
- [ ] "CSRF token missing" message

### Test 6.4: Rate Limiting
**Steps**:
1. Make 31 requests to API within 1 minute

**Expected Result**:
- [ ] 31st request: 429 Too Many Requests
- [ ] Rate limit resets after 1 minute

### Test 6.5: HTTPS Enforcement
**Steps**:
1. Try HTTP: http://eduinfo.online/

**Expected Result**:
- [ ] Redirects to HTTPS
- [ ] No mixed content warnings

### Test 6.6: Authentication Required
**Steps**:
1. Try accessing: https://eduinfo.online/api/projects/ without token

**Expected Result**:
- [ ] 401 Unauthorized
- [ ] No data leaked

### Test 6.7: Authorization Checks
**Steps**:
1. Login as Student
2. Try to delete another user

**Expected Result**:
- [ ] 403 Forbidden
- [ ] Action not allowed

---

## 🌐 Browser Compatibility Tests

### Test 7.1: Chrome (Latest)
**Steps**:
1. Open in Chrome
2. Test all major features

**Expected Result**:
- [ ] All features work
- [ ] No console errors
- [ ] Layout correct

### Test 7.2: Firefox (Latest)
**Steps**:
1. Open in Firefox
2. Test all major features

**Expected Result**:
- [ ] All features work
- [ ] No console errors
- [ ] Layout correct

### Test 7.3: Safari (Latest)
**Steps**:
1. Open in Safari
2. Test all major features

**Expected Result**:
- [ ] All features work
- [ ] No console errors
- [ ] Layout correct

### Test 7.4: Mobile Browser (Chrome Mobile)
**Steps**:
1. Open on mobile device
2. Test responsive design
3. Test touch interactions

**Expected Result**:
- [ ] Layout responsive
- [ ] Buttons clickable
- [ ] Forms usable
- [ ] No horizontal scroll

### Test 7.5: Tablet (iPad)
**Steps**:
1. Open on tablet
2. Test landscape/portrait

**Expected Result**:
- [ ] Adapts to tablet size
- [ ] All controls accessible
- [ ] Readability good

---

## ✅ Test Execution Checklist

### Phase 1: Smoke Testing (30 min)
- [ ] Site loads
- [ ] Login works
- [ ] Can view dashboard
- [ ] API responds

### Phase 2: Functional Testing (2 hours)
- [ ] All CRUD operations
- [ ] User workflows
- [ ] Project management
- [ ] File uploads

### Phase 3: API Testing (1 hour)
- [ ] All endpoints
- [ ] Error handling
- [ ] Authentication
- [ ] Authorization

### Phase 4: Performance Testing (30 min)
- [ ] Page load times
- [ ] API response times
- [ ] Database queries
- [ ] Memory usage

### Phase 5: Security Testing (1 hour)
- [ ] SQL injection
- [ ] XSS attacks
- [ ] CSRF protection
- [ ] Rate limiting
- [ ] HTTPS

### Phase 6: Browser Testing (1 hour)
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Mobile
- [ ] Tablet

### Phase 7: UAT (User Acceptance Testing) (2+ hours)
- [ ] Real users test
- [ ] Business logic verification
- [ ] Data accuracy
- [ ] User experience

---

## 📊 Test Results Template

```
Test Date: ___________
Tester: ___________
Environment: https://eduinfo.online/

SMOKE TESTS:
- Login: PASS / FAIL
- Dashboard: PASS / FAIL
- Projects: PASS / FAIL
- API: PASS / FAIL

FUNCTIONAL TESTS:
- CRUD Operations: PASS / FAIL
- File Upload: PASS / FAIL
- Comments: PASS / FAIL
- Workflows: PASS / FAIL

ISSUES FOUND:
1. [Description] - Severity: High/Medium/Low

NOTES:
[Any additional notes]

Sign-off: ___________
```

---

## 🐛 Bug Reporting Template

When finding issues, report with:

```
Title: [Clear, concise description]

Environment:
- Browser: [Chrome 120, Firefox 121, etc.]
- OS: [Windows, Mac, Linux]
- URL: [Full URL where issue occurs]

Steps to Reproduce:
1. 
2. 
3. 

Expected Result:
[What should happen]

Actual Result:
[What actually happened]

Screenshots:
[Attach if possible]

Severity:
- Critical: Application broken
- High: Major feature not working
- Medium: Feature degraded
- Low: Minor UI issue
```

---

## ✨ Sign-Off

**Test Plan Status**: ✅ **READY FOR EXECUTION**

Once deployed to https://eduinfo.online/, execute these tests in the order listed to ensure all functionality works correctly.

**Estimated Total Testing Time**: 6-8 hours

---

**Last Updated**: October 24, 2025

Good luck with testing! 🚀
