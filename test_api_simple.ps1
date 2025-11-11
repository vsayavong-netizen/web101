# Simple PowerShell script to test Settings API endpoints
# Usage: .\test_api_simple.ps1

$baseUrl = "http://localhost:8000"
$apiBase = "$baseUrl/api/settings"

# Colors for output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Error { Write-Host $args -ForegroundColor Red }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }

Write-Info "=========================================="
Write-Info "Testing Settings API Endpoints"
Write-Info "=========================================="
Write-Host ""

# Step 1: Login
Write-Info "Step 1: Authenticating..."
$loginBody = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login/" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.access
    if (-not $token) {
        $token = $loginResponse.token
    }
    
    if ($token) {
        Write-Success "✅ Authentication successful!"
        Write-Host "Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
    } else {
        Write-Error "❌ No token received"
        exit 1
    }
} catch {
    Write-Error "❌ Login failed: $($_.Exception.Message)"
    Write-Warning "Make sure Django server is running on $baseUrl"
    exit 1
}

Write-Host ""

# Step 2: Test GET (before creation)
Write-Info "Step 2: Testing GET endpoint (before creation)..."
$headers = @{
    "Authorization" = "Bearer $token"
}

$settingTypes = @("milestone_templates", "announcements", "defense_settings", "scoring_settings")
$academicYear = "2024"

foreach ($settingType in $settingTypes) {
    Write-Host "  Testing $settingType..." -NoNewline
    try {
        $url = "$apiBase/app-settings/$settingType/$academicYear/"
        $response = Invoke-RestMethod -Uri $url -Method Get -Headers $headers -ErrorAction Stop
        Write-Success " ✅"
        if ($response.value -eq $null) {
            Write-Host "    Value: null (not created yet)" -ForegroundColor Gray
        } else {
            Write-Host "    Value: exists" -ForegroundColor Gray
        }
    } catch {
        if ($_.Exception.Response.StatusCode -eq 404) {
            Write-Warning " ⚠️  (404 - not found, this is OK)"
        } else {
            Write-Error " ❌ Error: $($_.Exception.Message)"
        }
    }
}

Write-Host ""

# Step 3: Test POST (create)
Write-Info "Step 3: Testing POST endpoint (create)..."
$testData = @{
    milestone_templates = @(
        @{
            id = "TPL01"
            name = "Standard 5-Chapter Final Project"
            description = "A standard template for research-based projects"
            tasks = @(
                @{ id = "TSK01"; name = "Chapter 1: Introduction"; durationDays = 30 }
                @{ id = "TSK02"; name = "Chapter 2: Literature Review"; durationDays = 30 }
            )
        }
    )
    announcements = @(
        @{
            id = "ANN01"
            title = "Welcome to the New Academic Year!"
            content = "Welcome everyone to the **2024 academic year**."
            audience = "All"
            authorName = "Admin"
        }
    )
    defense_settings = @{
        startDefenseDate = "2024-12-01"
        timeSlots = "09:00-10:00,10:15-11:15,13:00-14:00,14:15-15:15"
        rooms = @("Room A", "Room B")
        stationaryAdvisors = @{}
        timezone = "Asia/Bangkok"
    }
    scoring_settings = @{
        mainAdvisorWeight = 60
        committeeWeight = 40
        gradeBoundaries = @()
        advisorRubrics = @()
        committeeRubrics = @()
    }
}

foreach ($settingType in $settingTypes) {
    Write-Host "  Creating $settingType..." -NoNewline
    try {
        $url = "$apiBase/app-settings/$settingType/$academicYear/"
        $body = @{
            value = $testData[$settingType]
        } | ConvertTo-Json -Depth 10
        
        $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body -ContentType "application/json" -ErrorAction Stop
        Write-Success " ✅"
        Write-Host "    Created: $($response.created)" -ForegroundColor Gray
    } catch {
        Write-Error " ❌ Error: $($_.Exception.Message)"
    }
}

Write-Host ""

# Step 4: Test GET (after creation)
Write-Info "Step 4: Testing GET endpoint (after creation)..."
foreach ($settingType in $settingTypes) {
    Write-Host "  Getting $settingType..." -NoNewline
    try {
        $url = "$apiBase/app-settings/$settingType/$academicYear/"
        $response = Invoke-RestMethod -Uri $url -Method Get -Headers $headers -ErrorAction Stop
        Write-Success " ✅"
        if ($response.value -ne $null) {
            $valueType = if ($response.value -is [Array]) { "Array[$($response.value.Count)]" } else { "Object" }
            Write-Host "    Value: $valueType" -ForegroundColor Gray
        }
    } catch {
        Write-Error " ❌ Error: $($_.Exception.Message)"
    }
}

Write-Host ""
Write-Info "=========================================="
Write-Success "✅ Testing completed!"
Write-Info "=========================================="
Write-Host ""
Write-Host "You can now test the endpoints manually or through the frontend." -ForegroundColor Gray

