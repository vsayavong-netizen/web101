# Simple PowerShell script to test Monitoring API endpoints
# Usage: .\test_monitoring_simple.ps1

$baseUrl = "http://localhost:8000"
$apiBase = "$baseUrl/api/monitoring"

# Colors for output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Error { Write-Host $args -ForegroundColor Red }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }

Write-Info "=========================================="
Write-Info "Testing Monitoring API Endpoints"
Write-Info "=========================================="
Write-Host ""

# Step 1: Test Health Check (Public)
Write-Info "Step 1: Testing Health Check (Public Endpoint)..."
try {
    $response = Invoke-RestMethod -Uri "$apiBase/health/" -Method Get -ErrorAction Stop
    Write-Success "✅ Health Check successful!"
    Write-Host "   Status: $($response.status)" -ForegroundColor Gray
    Write-Host "   Database: $($response.checks.database)" -ForegroundColor Gray
    Write-Host "   Cache: $($response.checks.cache)" -ForegroundColor Gray
    Write-Host "   Redis: $($response.checks.redis)" -ForegroundColor Gray
    if ($response.system) {
        Write-Host "   Disk Usage: $($response.system.disk_usage)%" -ForegroundColor Gray
        Write-Host "   Memory Usage: $($response.system.memory_usage)%" -ForegroundColor Gray
        Write-Host "   CPU Usage: $($response.system.cpu_usage)%" -ForegroundColor Gray
    }
} catch {
    Write-Error "❌ Health Check failed: $($_.Exception.Message)"
    Write-Warning "Make sure Django server is running on $baseUrl"
    exit 1
}

Write-Host ""

# Step 2: Login and Test Admin Endpoints
Write-Info "Step 2: Authenticating for Admin Endpoints..."
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
        $headers = @{
            "Authorization" = "Bearer $token"
        }
    } else {
        Write-Error "❌ No token received"
        exit 1
    }
} catch {
    Write-Error "❌ Login failed: $($_.Exception.Message)"
    Write-Warning "Skipping admin endpoint tests"
    exit 0
}

Write-Host ""

# Step 3: Test System Metrics
Write-Info "Step 3: Testing System Metrics Endpoint..."
try {
    $response = Invoke-RestMethod -Uri "$apiBase/system-metrics/?hours=24" -Method Get -Headers $headers -ErrorAction Stop
    Write-Success "✅ System Metrics retrieved!"
    Write-Host "   Period: $($response.period_hours) hours" -ForegroundColor Gray
    Write-Host "   Total Requests: $($response.requests.total_requests)" -ForegroundColor Gray
    Write-Host "   Total Errors: $($response.errors.total_errors)" -ForegroundColor Gray
} catch {
    if ($_.Exception.Response.StatusCode -eq 403) {
        Write-Warning "⚠️  Permission denied (need admin access)"
    } else {
        Write-Error "❌ Error: $($_.Exception.Message)"
    }
}

Write-Host ""

# Step 4: Test Request Logs
Write-Info "Step 4: Testing Request Logs Endpoint..."
try {
    $response = Invoke-RestMethod -Uri "$apiBase/request-logs/" -Method Get -Headers $headers -ErrorAction Stop
    $logs = if ($response.results) { $response.results } else { $response }
    Write-Success "✅ Request Logs retrieved!"
    Write-Host "   Total Logs: $($logs.Count)" -ForegroundColor Gray
    if ($logs.Count -gt 0) {
        $latest = $logs[0]
        Write-Host "   Latest: $($latest.method) $($latest.path) - $($latest.status_code)" -ForegroundColor Gray
    }
} catch {
    if ($_.Exception.Response.StatusCode -eq 403) {
        Write-Warning "⚠️  Permission denied (need admin access)"
    } else {
        Write-Error "❌ Error: $($_.Exception.Message)"
    }
}

Write-Host ""

# Step 5: Test Error Logs
Write-Info "Step 5: Testing Error Logs Endpoint..."
try {
    $response = Invoke-RestMethod -Uri "$apiBase/error-logs/" -Method Get -Headers $headers -ErrorAction Stop
    $logs = if ($response.results) { $response.results } else { $response }
    Write-Success "✅ Error Logs retrieved!"
    Write-Host "   Total Errors: $($logs.Count)" -ForegroundColor Gray
    if ($logs.Count -gt 0) {
        $unresolved = $logs | Where-Object { -not $_.resolved }
        Write-Host "   Unresolved: $($unresolved.Count)" -ForegroundColor Gray
    }
} catch {
    if ($_.Exception.Response.StatusCode -eq 403) {
        Write-Warning "⚠️  Permission denied (need admin access)"
    } else {
        Write-Error "❌ Error: $($_.Exception.Message)"
    }
}

Write-Host ""

# Step 6: Test Performance Metrics
Write-Info "Step 6: Testing Performance Metrics Endpoint..."
try {
    $response = Invoke-RestMethod -Uri "$apiBase/performance/" -Method Get -Headers $headers -ErrorAction Stop
    $metrics = if ($response.results) { $response.results } else { $response }
    Write-Success "✅ Performance Metrics retrieved!"
    Write-Host "   Total Metrics: $($metrics.Count)" -ForegroundColor Gray
    if ($metrics.Count -gt 0) {
        $avgTime = ($metrics | Measure-Object -Property response_time -Average).Average
        Write-Host "   Average Response Time: $([math]::Round($avgTime, 2))ms" -ForegroundColor Gray
    }
} catch {
    if ($_.Exception.Response.StatusCode -eq 403) {
        Write-Warning "⚠️  Permission denied (need admin access)"
    } else {
        Write-Error "❌ Error: $($_.Exception.Message)"
    }
}

Write-Host ""
Write-Info "=========================================="
Write-Success "✅ Testing completed!"
Write-Info "=========================================="
Write-Host ""
Write-Host "You can now access monitoring data through:" -ForegroundColor Gray
Write-Host "  - Django Admin: http://localhost:8000/admin/" -ForegroundColor Gray
Write-Host "  - API Endpoints: http://localhost:8000/api/monitoring/" -ForegroundColor Gray

