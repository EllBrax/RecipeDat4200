# PowerShell script to start the AI Model Service
# This keeps the model loaded in memory - run this ONCE

Write-Host "=== Starting AI Model Service ===" -ForegroundColor Cyan
Write-Host "This will load the model once and keep it in memory" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop the service" -ForegroundColor Yellow
Write-Host ""

$serviceScript = Join-Path $PSScriptRoot "ai_service.py"

if (-not (Test-Path $serviceScript)) {
    Write-Host "Error: ai_service.py not found!" -ForegroundColor Red
    exit 1
}

# Start the service (reads from stdin, writes to stdout)
python "$serviceScript"

