# Performance Analysis Script
# Runs both Bundle Analyzer and Lighthouse for comprehensive performance analysis

Write-Host "🚀 Starting Performance Analysis..." -ForegroundColor Green

# 1. Bundle Analysis
Write-Host "`n📦 Running Bundle Analyzer..." -ForegroundColor Yellow
Write-Host "Building production bundle with analyzer..."

$env:ANALYZE="true"
$env:NODE_ENV="production"
pnpm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Bundle analysis complete! Reports saved to .next/analyze/" -ForegroundColor Green
    Write-Host "Opening bundle analyzer reports..." -ForegroundColor Yellow
    
    # Open all analyzer reports
    if (Test-Path ".next/analyze/client.html") { start .next/analyze/client.html }
    if (Test-Path ".next/analyze/nodejs.html") { start .next/analyze/nodejs.html }
    if (Test-Path ".next/analyze/edge.html") { start .next/analyze/edge.html }
} else {
    Write-Host "❌ Bundle analysis failed!" -ForegroundColor Red
    exit 1
}

# 2. Lighthouse Analysis
Write-Host "`n🔍 Starting Lighthouse Analysis..." -ForegroundColor Yellow

# Check if dev server is running
$devServerRunning = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq "node" }

if (-not $devServerRunning) {
    Write-Host "Starting development server for Lighthouse analysis..."
    Start-Process -FilePath "pnpm" -ArgumentList "run", "dev" -NoNewWindow -PassThru
    Start-Sleep -Seconds 10  # Wait for server to start
}

# Run Lighthouse
Write-Host "Running Lighthouse analysis on http://localhost:3000..."
npx lighthouse http://localhost:3000 --output=html --output-path=lighthouse-report.html --no-enable-error-reporting

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Lighthouse analysis complete!" -ForegroundColor Green
    Write-Host "Opening Lighthouse report..." -ForegroundColor Yellow
    start lighthouse-report.html
} else {
    Write-Host "❌ Lighthouse analysis failed!" -ForegroundColor Red
}

# 3. Performance Summary
Write-Host "`n📊 Performance Analysis Complete!" -ForegroundColor Green
Write-Host "Reports generated:" -ForegroundColor Yellow
Write-Host "  • Bundle Analyzer: .next/analyze/" -ForegroundColor White
Write-Host "  • Lighthouse Report: lighthouse-report.html" -ForegroundColor White
Write-Host "  • Live Performance Monitor: Available via user menu toggle in development" -ForegroundColor White

Write-Host "`n💡 Performance Optimization Tools Available:" -ForegroundColor Cyan
Write-Host "  • Bundle analysis: pnpm run analyze" -ForegroundColor White
Write-Host "  • Lighthouse audit: npx lighthouse http://localhost:3000" -ForegroundColor White
Write-Host "  • Real-time monitoring: Built-in Performance Monitor" -ForegroundColor White
Write-Host "  • Testing tools: /testing-tools/performance" -ForegroundColor White 