# Comprehensive Monitoring API Test Script
# Usage: .\test_monitoring_endpoints.ps1

$baseUrl = "http://localhost:8000"
$apiBase = "$baseUrl/api/monitoring"

# Colors
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Error { Write-Host $args -ForegroundColor Red }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }

Write-Info "=========================================="
Write-Info "🧪 Comprehensive Monitoring API Tests"
Write-Info "=========================================="
Write-Host ""

$results = @()

# Test 1: Health Check (Public)
Write-Info "Test 1: Health Check Endpoint (Public)"
Write-Host "  Testing: GET $apiBase/health/" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$apiBase/health/" -Method Get -ErrorAction Stop
    Write-Success "  ✅ PASS - Status: $($response.status)"
    Write-Host "    Database: $($response.checks.database)" -ForegroundColor Gray
    Write-Host "    Cache: $($response.checks.cache)" -ForegroundColor Gray
    Write-Host "    Redis: $($response.checks.redis)" -ForegroundColor Gray
    if ($response.system) {
        Write-Host "    Disk: $($response.system.disk_usage)%" -ForegroundColor Gray
        Write-Host "    Memory: $($response.system.memory_usage)%" -ForegroundColor Gray
        Write-Host "    CPU: $($response.system.cpu_usage)%" -ForegroundColor Gray
    }
    $results += @{Test="Health Check"; Status="PASS"}
} catch {
    Write-Error "  ❌ FAIL - $($_.Exception.Message)"
    $results += @{Test="Health Check"; Status="FAIL"}
    Write-Warning "  Make sure Django server is running on $baseUrl"
    exit 1
}

Write-Host ""

# Test 2: Login
Write-Info "Test 2: Authentication"
Write-Host "  Logging in as admin..." -ForegroundColor Gray
try {
    $loginBody = @{
        username = "admin"
        password = "admin123"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login/" -Method Post -Body $loginBody -ContentType "application/json" -ErrorAction Stop
    $token = $loginResponse.access
    if (-not $token) {
        $token = $loginResponse.token
    }
    
    if ($token) {
        Write-Success "  ✅ PASS - Authentication successful"
        $headers = @{
            "Authorization" = "Bearer $token"
        }
        $results += @{Test="Authentication"; Status="PASS"}
    } else {
        Write-Error "  ❌ FAIL - No token received"
        $results += @{Test="Authentication"; Status="FAIL"}
        exit 1
    }
} catch {
    Write-Error "  ❌ FAIL - $($_.Exception.Message)"
    Write-Warning "  Skipping admin endpoint tests"
    $results += @{Test="Authentication"; Status="FAIL"}
    exit 0
}

Write-Host ""

# Test 3: System Metrics Summary
Write-Info "Test 3: System Metrics Summary (Admin)"
Write-Host "  Testing: GET $apiBase/system-metrics/?hours=24" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$apiBase/system-metrics/?hours=24" -Method Get -Headers $headers -ErrorAction Stop
    Write-Success "  ✅ PASS"
    Write-Host "    Period: $($response.period_hours) hours" -ForegroundColor Gray
    Write-Host "    Total Requests: $($response.requests.total_requests)" -ForegroundColor Gray
    Write-Host "    Total Errors: $($response.errors.total_errors)" -ForegroundColor Gray
    Write-Host "    Metrics Types: $($response.metrics.Keys.Count)" -ForegroundColor Gray
    $results += @{Test="System Metrics"; Status="PASS"}
} catch {
    if ($_.Exception.Response.StatusCode -eq 403) {
        Write-Warning "  ⚠️  SKIP - Permission denied (need admin)"
        $results += @{Test="System Metrics"; Status="SKIP"}
    } else {
        Write-Error "  ❌ FAIL - $($_.Exception.Message)"
        $results += @{Test="System Metrics"; Status="FAIL"}
    }
}

Write-Host ""

# Test 4: Request Logs
Write-Info "Test 4: Request Logs (Admin)"
Write-Host "  Testing: GET $apiBase/request-logs/" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$apiBase/request-logs/" -Method Get -Headers $headers -ErrorAction Stop
    $logs = if ($response.results) { $response.results } else { $response }
    Write-Success "  ✅ PASS"
    Write-Host "    Total Logs: $($logs.Count)" -ForegroundColor Gray
    if ($logs.Count -gt 0) {
        $latest = $logs[0]
        Write-Host "    Latest: $($latest.method) $($latest.path) - $($latest.status_code) ($($latest.response_time)ms)" -ForegroundColor Gray
    }
    $results += @{Test="Request Logs"; Status="PASS"}
} catch {
    if ($_.Exception.Response.StatusCode -eq 403) {
        Write-Warning "  ⚠️  SKIP - Permission denied (need admin)"
        $results += @{Test="Request Logs"; Status="SKIP"}
    } else {
        Write-Error "  ❌ FAIL - $($_.Exception.Message)"
        $results += @{Test="Request Logs"; Status="FAIL"}
    }
}

Write-Host ""

# Test 5: Error Logs
Write-Info "Test 5: Error Logs (Admin)"
Write-Host "  Testing: GET $apiBase/error-logs/" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$apiBase/error-logs/" -Method Get -Headers $headers -ErrorAction Stop
    $logs = if ($response.results) { $response.results } else { $response }
    Write-Success "  ✅ PASS"
    Write-Host "    Total Errors: $($logs.Count)" -ForegroundColor Gray
    if ($logs.Count -gt 0) {
        $unresolved = $logs | Where-Object { -not $_.resolved }
        Write-Host "    Unresolved: $($unresolved.Count)" -ForegroundColor Gray
    }
    $results += @{Test="Error Logs"; Status="PASS"}
} catch {
    if ($_.Exception.Response.StatusCode -eq 403) {
        Write-Warning "  ⚠️  SKIP - Permission denied (need admin)"
        $results += @{Test="Error Logs"; Status="SKIP"}
    } else {
        Write-Error "  ❌ FAIL - $($_.Exception.Message)"
        $results += @{Test="Error Logs"; Status="FAIL"}
    }
}

Write-Host ""

# Test 6: Performance Metrics
Write-Info "Test 6: Performance Metrics (Admin)"
Write-Host "  Testing: GET $apiBase/performance/" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$apiBase/performance/" -Method Get -Headers $headers -ErrorAction Stop
    $metrics = if ($response.results) { $response.results } else { $response }
    Write-Success "  ✅ PASS"
    Write-Host "    Total Metrics: $($metrics.Count)" -ForegroundColor Gray
    if ($metrics.Count -gt 0) {
        $avgTime = ($metrics | Measure-Object -Property response_time -Average).Average
        Write-Host "    Avg Response Time: $([math]::Round($avgTime, 2))ms" -ForegroundColor Gray
    }
    $results += @{Test="Performance Metrics"; Status="PASS"}
} catch {
    if ($_.Exception.Response.StatusCode -eq 403) {
        Write-Warning "  ⚠️  SKIP - Permission denied (need admin)"
        $results += @{Test="Performance Metrics"; Status="SKIP"}
    } else {
        Write-Error "  ❌ FAIL - $($_.Exception.Message)"
        $results += @{Test="Performance Metrics"; Status="FAIL"}
    }
}

Write-Host ""

# Test 7: Health History
Write-Info "Test 7: Health History (Admin)"
Write-Host "  Testing: GET $apiBase/health-history/" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$apiBase/health-history/" -Method Get -Headers $headers -ErrorAction Stop
    $history = if ($response.results) { $response.results } else { $response }
    Write-Success "  ✅ PASS"
    Write-Host "    Total Checks: $($history.Count)" -ForegroundColor Gray
    if ($history.Count -gt 0) {
        $latest = $history[0]
        Write-Host "    Latest Status: $($latest.status)" -ForegroundColor Gray
    }
    $results += @{Test="Health History"; Status="PASS"}
} catch {
    if ($_.Exception.Response.StatusCode -eq 403) {
        Write-Warning "  ⚠️  SKIP - Permission denied (need admin)"
        $results += @{Test="Health History"; Status="SKIP"}
    } else {
        Write-Error "  ❌ FAIL - $($_.Exception.Message)"
        $results += @{Test="Health History"; Status="FAIL"}
    }
}

Write-Host ""

# Test 8: Filtering and Search
Write-Info "Test 8: Filtering and Search (Admin)"
Write-Host "  Testing: GET $apiBase/request-logs/?method=GET&ordering=-timestamp" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$apiBase/request-logs/?method=GET&ordering=-timestamp" -Method Get -Headers $headers -ErrorAction Stop
    Write-Success "  ✅ PASS - Filtering works"
    $results += @{Test="Filtering"; Status="PASS"}
} catch {
    if ($_.Exception.Response.StatusCode -eq 403) {
        Write-Warning "  ⚠️  SKIP - Permission denied"
        $results += @{Test="Filtering"; Status="SKIP"}
    } else {
        Write-Error "  ❌ FAIL - $($_.Exception.Message)"
        $results += @{Test="Filtering"; Status="FAIL"}
    }
}

Write-Host ""

# Summary
Write-Info "=========================================="
Write-Info "📊 Test Summary"
Write-Info "=========================================="

$passed = ($results | Where-Object { $_.Status -eq "PASS" }).Count
$failed = ($results | Where-Object { $_.Status -eq "FAIL" }).Count
$skipped = ($results | Where-Object { $_.Status -eq "SKIP" }).Count

foreach ($result in $results) {
    $status = switch ($result.Status) {
        "PASS" { "✅ PASS" }
        "FAIL" { "❌ FAIL" }
        "SKIP" { "⚠️  SKIP" }
    }
    Write-Host "$($result.Test):30 $status"
}

Write-Host ""
Write-Info "=========================================="
Write-Host "Total: $($results.Count) tests" -ForegroundColor Gray
Write-Success "Passed: $passed"
if ($failed -gt 0) {
    Write-Error "Failed: $failed"
}
if ($skipped -gt 0) {
    Write-Warning "Skipped: $skipped"
}
Write-Info "=========================================="

if ($failed -eq 0) {
    Write-Host ""
    Write-Success "🎉 All tests passed!"
} else {
    Write-Host ""
    Write-Warning "⚠️  Some tests failed. Check the output above."
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Check Django Admin: http://localhost:8000/admin/" -ForegroundColor Gray
Write-Host "  2. View monitoring data in System Monitoring section" -ForegroundColor Gray
Write-Host "  3. Set up cleanup cron job for old data" -ForegroundColor Gray

