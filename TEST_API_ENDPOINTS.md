# 🧪 Testing Settings API Endpoints

## Prerequisites

1. **Start Django Server**
   ```bash
   cd backend
   python manage.py runserver
   ```
   Server will run on `http://localhost:8000`

2. **Get Authentication Token**
   You need to be logged in as an admin user to test settings endpoints.

## Manual Testing with cURL

### 1. Login and Get Token

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Save the token from response
export TOKEN="your_access_token_here"
```

### 2. Test GET Settings (Before Creation)

```bash
# Get milestone templates
curl -X GET "http://localhost:8000/api/settings/app-settings/milestone_templates/2024/" \
  -H "Authorization: Bearer $TOKEN"

# Get announcements
curl -X GET "http://localhost:8000/api/settings/app-settings/announcements/2024/" \
  -H "Authorization: Bearer $TOKEN"

# Get defense settings
curl -X GET "http://localhost:8000/api/settings/app-settings/defense_settings/2024/" \
  -H "Authorization: Bearer $TOKEN"

# Get scoring settings
curl -X GET "http://localhost:8000/api/settings/app-settings/scoring_settings/2024/" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response (if not exists):**
```json
{
  "setting_type": "milestone_templates",
  "academic_year": "2024",
  "value": null,
  "updated_at": null
}
```

### 3. Test POST (Create Settings)

```bash
# Create milestone templates
curl -X POST "http://localhost:8000/api/settings/app-settings/milestone_templates/2024/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "value": [
      {
        "id": "TPL01",
        "name": "Standard 5-Chapter Final Project",
        "description": "A standard template for research-based projects",
        "tasks": [
          {"id": "TSK01", "name": "Chapter 1: Introduction", "durationDays": 30},
          {"id": "TSK02", "name": "Chapter 2: Literature Review", "durationDays": 30}
        ]
      }
    ]
  }'

# Create announcements
curl -X POST "http://localhost:8000/api/settings/app-settings/announcements/2024/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "value": [
      {
        "id": "ANN01",
        "title": "Welcome to the New Academic Year!",
        "content": "Welcome everyone to the **2024 academic year**.",
        "audience": "All",
        "authorName": "Admin"
      }
    ]
  }'

# Create defense settings
curl -X POST "http://localhost:8000/api/settings/app-settings/defense_settings/2024/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "value": {
      "startDefenseDate": "2024-12-01",
      "timeSlots": "09:00-10:00,10:15-11:15,13:00-14:00,14:15-15:15",
      "rooms": ["Room A", "Room B"],
      "stationaryAdvisors": {},
      "timezone": "Asia/Bangkok"
    }
  }'

# Create scoring settings
curl -X POST "http://localhost:8000/api/settings/app-settings/scoring_settings/2024/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "value": {
      "mainAdvisorWeight": 60,
      "committeeWeight": 40,
      "gradeBoundaries": [],
      "advisorRubrics": [],
      "committeeRubrics": []
    }
  }'
```

**Expected Response:**
```json
{
  "setting_type": "milestone_templates",
  "academic_year": "2024",
  "value": [...],
  "updated_at": "2024-01-01T00:00:00Z",
  "created": true
}
```

### 4. Test GET Settings (After Creation)

```bash
# Get milestone templates (should return data now)
curl -X GET "http://localhost:8000/api/settings/app-settings/milestone_templates/2024/" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "setting_type": "milestone_templates",
  "academic_year": "2024",
  "value": [...],
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### 5. Test PUT (Update Settings)

```bash
# Update milestone templates
curl -X PUT "http://localhost:8000/api/settings/app-settings/milestone_templates/2024/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "value": [
      {
        "id": "TPL01",
        "name": "Updated Template Name",
        "description": "Updated description",
        "tasks": [...]
      }
    ]
  }'
```

### 6. Test DELETE Settings

```bash
# Delete milestone templates
curl -X DELETE "http://localhost:8000/api/settings/app-settings/milestone_templates/2024/" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "message": "milestone_templates for academic year 2024 deleted successfully"
}
```

## Testing with Python Script

### Option 1: Use the test script

```bash
# Install requests if not already installed
pip install requests

# Run the test script
python test_settings_api.py
```

### Option 2: Use Django Test Client

```bash
cd backend
python manage.py test settings.tests
```

## Testing with Postman

### Import Collection

1. Create a new collection in Postman
2. Add the following requests:

**Base URL:** `http://localhost:8000/api/settings`

**Endpoints:**
- `GET /app-settings/{setting_type}/{academic_year}/`
- `POST /app-settings/{setting_type}/{academic_year}/`
- `PUT /app-settings/{setting_type}/{academic_year}/`
- `DELETE /app-settings/{setting_type}/{academic_year}/`

**Headers:**
- `Authorization: Bearer {token}`
- `Content-Type: application/json`

**Variables:**
- `setting_type`: `milestone_templates`, `announcements`, `defense_settings`, `scoring_settings`
- `academic_year`: `2024`, `2024-2025`, etc.

## Testing with Frontend

1. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

2. Login to the application
3. Navigate to Settings page
4. Test creating/updating settings:
   - Milestone Templates
   - Announcements
   - Defense Settings
   - Scoring Settings

5. Check browser console for API calls
6. Verify data persists after page refresh

## Expected Test Results

### ✅ Success Criteria

1. **GET** returns `200 OK` with data or `200 OK` with `null` if not exists
2. **POST** returns `201 Created` with created data
3. **PUT** returns `200 OK` with updated data
4. **DELETE** returns `200 OK` with success message
5. Data persists in database
6. Frontend can retrieve and display data
7. Fallback to localStorage works when API fails

### ❌ Error Cases to Test

1. **Invalid setting type** - Should return `400 Bad Request`
2. **Missing academic year** - Should use current active year or return `400`
3. **Unauthorized access** - Should return `401 Unauthorized`
4. **Permission denied** - Should return `403 Forbidden` (non-admin users)
5. **Invalid JSON** - Should return `400 Bad Request`

## Troubleshooting

### Issue: "Cannot connect to server"
- **Solution:** Make sure Django server is running on port 8000

### Issue: "401 Unauthorized"
- **Solution:** Check that your token is valid and not expired

### Issue: "403 Forbidden"
- **Solution:** Make sure you're logged in as Admin or DepartmentAdmin

### Issue: "400 Bad Request"
- **Solution:** Check that:
  - Setting type is valid (`milestone_templates`, `announcements`, etc.)
  - JSON payload is valid
  - Academic year format is correct

### Issue: "404 Not Found"
- **Solution:** Check that:
  - URL path is correct
  - Academic year exists in database
  - Setting hasn't been deleted

## Test Checklist

- [ ] GET settings (before creation) - returns null
- [ ] POST create settings - creates successfully
- [ ] GET settings (after creation) - returns data
- [ ] PUT update settings - updates successfully
- [ ] GET settings (after update) - returns updated data
- [ ] DELETE settings - deletes successfully
- [ ] GET settings (after delete) - returns null
- [ ] Test with different academic years
- [ ] Test permission restrictions
- [ ] Test error handling
- [ ] Test frontend integration
- [ ] Test localStorage fallback

