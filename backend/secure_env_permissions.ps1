# Secure .env File Permissions
# This script sets restrictive permissions on the .env file
# Run as Administrator

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Secure .env File Permissions Script" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "WARNING: Not running as Administrator!" -ForegroundColor Yellow
    Write-Host "Some operations may fail. Right-click and 'Run as Administrator' for full functionality.`n" -ForegroundColor Yellow
}

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$envFile = Join-Path $scriptDir ".env"

# Check if .env exists
if (-not (Test-Path $envFile)) {
    Write-Host "ERROR: .env file not found at: $envFile" -ForegroundColor Red
    Write-Host "Please ensure you're running this script from the backend directory.`n" -ForegroundColor Red
    exit 1
}

Write-Host "Found .env file at: $envFile`n" -ForegroundColor Green

# Show current permissions
Write-Host "Current Permissions:" -ForegroundColor Yellow
Write-Host "-------------------" -ForegroundColor Yellow
icacls $envFile
Write-Host ""

# Ask for confirmation
$confirm = Read-Host "Do you want to set restrictive permissions on this file? (Y/N)"

if ($confirm -ne 'Y' -and $confirm -ne 'y') {
    Write-Host "`nOperation cancelled.`n" -ForegroundColor Yellow
    exit 0
}

Write-Host "`nSetting restrictive permissions..." -ForegroundColor Cyan

try {
    # Remove inheritance
    Write-Host "1. Removing inherited permissions..." -ForegroundColor White
    icacls $envFile /inheritance:r | Out-Null
    
    # Get current user
    $currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
    Write-Host "2. Granting full control to: $currentUser" -ForegroundColor White
    icacls $envFile /grant:r "${currentUser}:F" | Out-Null
    
    # Deny access to Everyone
    Write-Host "3. Denying access to 'Everyone'..." -ForegroundColor White
    icacls $envFile /deny "Everyone:(R,W,X)" | Out-Null
    
    # Deny access to Users group
    Write-Host "4. Denying access to 'Users' group..." -ForegroundColor White
    icacls $envFile /deny "Users:(R,W,X)" | Out-Null
    
    Write-Host "`nSUCCESS! Permissions have been set.`n" -ForegroundColor Green
    
    # Show new permissions
    Write-Host "New Permissions:" -ForegroundColor Green
    Write-Host "---------------" -ForegroundColor Green
    icacls $envFile
    Write-Host ""
    
    # Security recommendations
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Security Recommendations" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
    
    Write-Host "1. Test middleware protection:" -ForegroundColor White
    Write-Host "   curl https://eduinfo.online/.env" -ForegroundColor Gray
    Write-Host "   Expected: 403 Forbidden`n" -ForegroundColor Gray
    
    Write-Host "2. Verify .env is in .gitignore:" -ForegroundColor White
    Write-Host "   git ls-files | grep .env" -ForegroundColor Gray
    Write-Host "   Expected: No output (file not tracked)`n" -ForegroundColor Gray
    
    Write-Host "3. Consider rotating credentials:" -ForegroundColor White
    Write-Host "   - Database password" -ForegroundColor Gray
    Write-Host "   - Django SECRET_KEY" -ForegroundColor Gray
    Write-Host "   - API keys`n" -ForegroundColor Gray
    
    Write-Host "4. Monitor security logs:" -ForegroundColor White
    Write-Host "   tail -f logs/security.log | grep '\.env'`n" -ForegroundColor Gray
    
    Write-Host "========================================`n" -ForegroundColor Cyan
    
} catch {
    Write-Host "`nERROR: Failed to set permissions!" -ForegroundColor Red
    Write-Host "Error details: $_`n" -ForegroundColor Red
    Write-Host "Try running this script as Administrator.`n" -ForegroundColor Yellow
    exit 1
}

# Additional security check
Write-Host "Running additional security checks...`n" -ForegroundColor Cyan

# Check if file is hidden
$isHidden = (Get-Item $envFile -Force).Attributes -band [System.IO.FileAttributes]::Hidden

if (-not $isHidden) {
    Write-Host "RECOMMENDATION: Consider hiding the .env file" -ForegroundColor Yellow
    $hideFile = Read-Host "Would you like to hide the .env file? (Y/N)"
    
    if ($hideFile -eq 'Y' -or $hideFile -eq 'y') {
        Set-ItemProperty $envFile -Name Attributes -Value ([System.IO.FileAttributes]::Hidden)
        Write-Host "File is now hidden. Use 'attrib -h .env' to unhide if needed.`n" -ForegroundColor Green
    }
}

# Check file size (ensure it's not empty or suspiciously large)
$fileSize = (Get-Item $envFile).Length

if ($fileSize -eq 0) {
    Write-Host "WARNING: .env file is empty!" -ForegroundColor Red
} elseif ($fileSize -gt 10KB) {
    Write-Host "WARNING: .env file is unusually large ($fileSize bytes)" -ForegroundColor Yellow
    Write-Host "This might indicate it contains more than just configuration.`n" -ForegroundColor Yellow
} else {
    Write-Host "File size check: OK ($fileSize bytes)`n" -ForegroundColor Green
}

# Check for common sensitive patterns
Write-Host "Checking for sensitive data patterns..." -ForegroundColor Cyan
$content = Get-Content $envFile -Raw

$patterns = @{
    "SECRET_KEY" = "Django secret key"
    "PASSWORD" = "Password"
    "API_KEY" = "API key"
    "TOKEN" = "Token"
    "DATABASE_URL" = "Database URL"
}

$foundPatterns = @()
foreach ($pattern in $patterns.Keys) {
    if ($content -match $pattern) {
        $foundPatterns += $patterns[$pattern]
    }
}

if ($foundPatterns.Count -gt 0) {
    Write-Host "Found sensitive data:" -ForegroundColor Yellow
    foreach ($found in $foundPatterns) {
        Write-Host "  - $found" -ForegroundColor Gray
    }
    Write-Host "`nEnsure these are properly protected!`n" -ForegroundColor Yellow
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Security Setup Complete!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Your .env file is now secured with restrictive permissions." -ForegroundColor Green
Write-Host "Only your user account can access it.`n" -ForegroundColor Green

Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Test your application to ensure it can still read .env" -ForegroundColor White
Write-Host "2. Test middleware protection (see recommendations above)" -ForegroundColor White
Write-Host "3. Consider moving .env outside web root for extra security" -ForegroundColor White
Write-Host "4. Read SECURE_ENV_FILE_GUIDE.md for complete security guide`n" -ForegroundColor White

# Pause at the end
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

