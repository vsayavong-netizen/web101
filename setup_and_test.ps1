# Setup and Test Script for Final Project Management System
# PowerShell script to setup environment and test connection

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Final Project Management System - Setup & Test" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Get current directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $scriptPath "backend"
$frontendPath = Join-Path $scriptPath "frontend"

Write-Host "📁 Checking Directories..." -ForegroundColor Yellow
Write-Host "Backend: $backendPath" -ForegroundColor Gray
Write-Host "Frontend: $frontendPath" -ForegroundColor Gray
Write-Host ""

# Check if directories exist
if (-not (Test-Path $backendPath)) {
    Write-Host "❌ Backend directory not found!" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $frontendPath)) {
    Write-Host "❌ Frontend directory not found!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Directories found" -ForegroundColor Green
Write-Host ""

# Step 1: Setup Backend Environment
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Step 1: Backend Environment Setup" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
$envFile = Join-Path $backendPath ".env"
$envExample = Join-Path $backendPath ".env.example"

if (Test-Path $envFile) {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
} else {
    if (Test-Path $envExample) {
        Write-Host "📝 Creating .env file from .env.example..." -ForegroundColor Yellow
        Copy-Item $envExample $envFile
        Write-Host "✅ .env file created" -ForegroundColor Green
        Write-Host "⚠️  Please review and update .env file with your configuration" -ForegroundColor Yellow
    } else {
        Write-Host "❌ .env.example not found!" -ForegroundColor Red
    }
}

# Create necessary directories
$directories = @(
    (Join-Path $backendPath "logs"),
    (Join-Path $backendPath "staticfiles"),
    (Join-Path $backendPath "media")
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "✅ Created directory: $dir" -ForegroundColor Green
    }
}

Write-Host ""

# Step 2: Check Python and Dependencies
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Step 2: Checking Python and Dependencies" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Check Python
try {
    $pythonVersion = py --version 2>&1
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found! Please install Python 3.10+" -ForegroundColor Red
    exit 1
}

# Check if Django is installed
Write-Host "📦 Checking Django installation..." -ForegroundColor Yellow
try {
    $djangoVersion = py -c "import django; print(django.__version__)" 2>&1
    Write-Host "✅ Django $djangoVersion installed" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Django not installed. Installing dependencies..." -ForegroundColor Yellow
    Set-Location $backendPath
    pip install -r requirements.txt
    Set-Location $scriptPath
}

Write-Host ""

# Step 3: Setup Database
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Step 3: Database Setup" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$dbFile = Join-Path $backendPath "db.sqlite3"
if (Test-Path $dbFile) {
    Write-Host "✅ Database file exists" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Database file will be created on first migration" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "To setup database, run:" -ForegroundColor Yellow
Write-Host "  cd backend" -ForegroundColor Gray
Write-Host "  py manage.py migrate" -ForegroundColor Gray
Write-Host "  py manage.py createsuperuser" -ForegroundColor Gray
Write-Host ""

# Step 4: Test API Connection
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Step 4: Testing API Connection" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "⚠️  Note: Backend server must be running for connection test" -ForegroundColor Yellow
Write-Host "To start backend server:" -ForegroundColor Yellow
Write-Host "  cd backend" -ForegroundColor Gray
Write-Host "  py manage.py runserver" -ForegroundColor Gray
Write-Host ""

# Check if server is running
$apiUrl = "http://localhost:8000/health/"
try {
    $response = Invoke-WebRequest -Uri $apiUrl -Method GET -TimeoutSec 2 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend server is running!" -ForegroundColor Green
        Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
        
        # Try to run connection test
        $testScript = Join-Path $backendPath "scripts\test_api_connection.py"
        if (Test-Path $testScript) {
            Write-Host ""
            Write-Host "Running API connection test..." -ForegroundColor Yellow
            Set-Location $backendPath
            py scripts\test_api_connection.py
            Set-Location $scriptPath
        }
    }
} catch {
    Write-Host "⚠️  Backend server is not running" -ForegroundColor Yellow
    Write-Host "   Start the server to test connection" -ForegroundColor Gray
}

Write-Host ""

# Step 5: Frontend Setup
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Step 5: Frontend Setup" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found! Please install Node.js 18+" -ForegroundColor Red
}

# Check if .env exists
$frontendEnvFile = Join-Path $frontendPath ".env"
$frontendEnvExample = Join-Path $frontendPath ".env.example"

if (Test-Path $frontendEnvFile) {
    Write-Host "✅ Frontend .env file exists" -ForegroundColor Green
} else {
    if (Test-Path $frontendEnvExample) {
        Write-Host "📝 Creating frontend .env file..." -ForegroundColor Yellow
        Copy-Item $frontendEnvExample $frontendEnvFile
        Write-Host "✅ Frontend .env file created" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "To start frontend server:" -ForegroundColor Yellow
Write-Host "  cd frontend" -ForegroundColor Gray
Write-Host "  npm install" -ForegroundColor Gray
Write-Host "  npm run dev" -ForegroundColor Gray
Write-Host ""

# Summary
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Review and update .env files" -ForegroundColor White
Write-Host "2. Run database migrations: cd backend && py manage.py migrate" -ForegroundColor White
Write-Host "3. Create superuser: cd backend && py manage.py createsuperuser" -ForegroundColor White
Write-Host "4. Start backend: cd backend && py manage.py runserver" -ForegroundColor White
Write-Host "5. Start frontend: cd frontend && npm run dev" -ForegroundColor White
Write-Host ""

