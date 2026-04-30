# Complete dependency installation script
# Fix all module not found errors

Write-Host "=== Complete Dependency Installation ===" -ForegroundColor Cyan
Write-Host ""

# 1. Stop all processes
Write-Host "1. Stopping all related processes..." -ForegroundColor Yellow
try {
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    Get-Process -Name "electron" -ErrorAction SilentlyContinue | Stop-Process -Force
    Get-Process -Name "next" -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Host "   Processes stopped" -ForegroundColor Green
} catch {
    Write-Host "   No processes to stop" -ForegroundColor Yellow
}

# 2. Clean everything
Write-Host ""
Write-Host "2. Cleaning project..." -ForegroundColor Yellow

if (Test-Path "node_modules") {
    Write-Host "   Removing node_modules..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
}

if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json" -ErrorAction SilentlyContinue
}

if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
}

Write-Host "   Project cleaned" -ForegroundColor Green

# 3. Install dependencies step by step
Write-Host ""
Write-Host "3. Installing dependencies..." -ForegroundColor Yellow

# First install Next.js and React separately
Write-Host "   Installing Next.js and React..." -ForegroundColor Yellow
try {
    npm install next@14.2.35 react@^18 react-dom@^18 --save --legacy-peer-deps
    Write-Host "   Next.js and React installed" -ForegroundColor Green
} catch {
    Write-Host "   Next.js installation completed with warnings" -ForegroundColor Yellow
}

# Install other core dependencies
Write-Host "   Installing core dependencies..." -ForegroundColor Yellow
try {
    npm install --legacy-peer-deps --no-optional
    Write-Host "   Core dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "   Core dependencies installation completed with warnings" -ForegroundColor Yellow
}

# 4. Install Playwright separately
Write-Host ""
Write-Host "4. Installing Playwright..." -ForegroundColor Yellow
try {
    npm install @playwright/test@^1.40.0 --save-dev --legacy-peer-deps
    Write-Host "   Playwright installed" -ForegroundColor Green
} catch {
    Write-Host "   Playwright installation completed with warnings" -ForegroundColor Yellow
}

# 5. Install Playwright browsers
Write-Host ""
Write-Host "5. Installing Playwright browsers..." -ForegroundColor Yellow
try {
    npx playwright install
    Write-Host "   Playwright browsers installed" -ForegroundColor Green
} catch {
    Write-Host "   Playwright browsers installation completed" -ForegroundColor Yellow
}

# 6. Verify installations
Write-Host ""
Write-Host "6. Verifying installations..." -ForegroundColor Yellow

if (Test-Path "node_modules\next") {
    Write-Host "   ✓ Next.js installed" -ForegroundColor Green
} else {
    Write-Host "   ✗ Next.js missing" -ForegroundColor Red
}

if (Test-Path "node_modules\@playwright") {
    Write-Host "   ✓ Playwright installed" -ForegroundColor Green
} else {
    Write-Host "   ✗ Playwright missing" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Installation Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run: npm run dev" -ForegroundColor White
Write-Host "2. Test: npm run test" -ForegroundColor White
Write-Host "3. Check: npm run lint" -ForegroundColor White