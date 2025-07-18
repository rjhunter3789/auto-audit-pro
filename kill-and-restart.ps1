# PowerShell script to kill Node processes and restart server

Write-Host "Stopping all Node.js processes..." -ForegroundColor Yellow
Stop-Process -Name node -Force -ErrorAction SilentlyContinue

Write-Host "Waiting for processes to stop..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host "Checking if processes are stopped..." -ForegroundColor Yellow
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Some Node processes still running, forcing stop..." -ForegroundColor Red
    $nodeProcesses | Stop-Process -Force
    Start-Sleep -Seconds 2
}

Write-Host "All Node processes stopped!" -ForegroundColor Green
Write-Host ""
Write-Host "Starting server with new ROI routes..." -ForegroundColor Cyan
Write-Host ""

# Start the server
npm start