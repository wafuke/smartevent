# SmartEvent Unified Launcher (Windows PowerShell)
# Starts Backend (5000), ML Service (8000), Frontend Web (5173), and Mobile Expo in separate windows.

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Starting SmartEvent Services from $root..." -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\backend'; Write-Host '=== SmartEvent Backend (Port 5000) ===' -ForegroundColor Green; node server.js"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\ml-service'; Write-Host '=== SmartEvent ML Service (Port 8000) ===' -ForegroundColor Yellow; python main.py"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\frontend'; Write-Host '=== SmartEvent Web Frontend (Port 5173) ===' -ForegroundColor Cyan; npm run dev -- --host 0.0.0.0 --port 5173"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\mobile'; Write-Host '=== SmartEvent Mobile (Expo SDK 58) ===' -ForegroundColor Magenta; npx expo start"

Write-Host "All 4 SmartEvent service windows launched!" -ForegroundColor Green
