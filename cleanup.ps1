# NightShift project cleanup script
# Fix dependency conflicts and compilation issues

Write-Host "Starting NightShift project cleanup..." -ForegroundColor Green

# 1. Stop any running processes
Write-Host "Stopping related processes..." -ForegroundColor Yellow
try {
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    Get-Process -Name "electron" -ErrorAction SilentlyContinue | Stop-Process -Force
    Get-Process -Name "next" -ErrorAction SilentlyContinue | Stop-Process -Force
} catch {
    Write-Host "Processes stopped" -ForegroundColor Green
}

# 2. Clean node_modules
if (Test-Path "node_modules") {
    Write-Host "Removing node_modules directory..." -ForegroundColor Yellow
    try {
        Remove-Item -Recurse -Force "node_modules" -ErrorAction Stop
        Write-Host "node_modules removed successfully" -ForegroundColor Green
    } catch {
        Write-Host "node_modules removal failed, trying alternative method..." -ForegroundColor Red
        # Alternative method
        cmd /c "rmdir /s /q node_modules"
    }
}

# 3. Remove lock files
$lockFiles = @("package-lock.json", "yarn.lock", "pnpm-lock.yaml")
foreach ($file in $lockFiles) {
    if (Test-Path $file) {
        Remove-Item -Force $file -ErrorAction SilentlyContinue
        Write-Host "Removed $file" -ForegroundColor Green
    }
}

# 4. Clean cache directories
$cacheDirs = @(
    ".next",
    "dist",
    "dist-electron",
    "out",
    "test-results"
)

foreach ($dir in $cacheDirs) {
    if (Test-Path $dir) {
        try {
            Remove-Item -Recurse -Force $dir -ErrorAction SilentlyContinue
            Write-Host "Cleaned $dir" -ForegroundColor Green
        } catch {
            Write-Host "Failed to clean $dir" -ForegroundColor Yellow
        }
    }
}

Write-Host "Cleanup completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run: npm install --legacy-peer-deps" -ForegroundColor White
Write-Host "2. Run: npx playwright install" -ForegroundColor White
Write-Host "3. Run: npm run dev" -ForegroundColor White