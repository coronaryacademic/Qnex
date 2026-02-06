@echo off
cd /d "%~dp0"
if not exist "node_modules" (
    npm install
)

echo [INFO] Starting Backend Server (Port 3001)...
start /d "%~dp0..\server" /b node server.js

echo.
echo [CHECK] Verifying AI connectivity...
powershell -Command "$success = $false; for ($i=0; $i -lt 10; $i++) { try { $res = Invoke-RestMethod -Uri 'http://localhost:3001/api/health'; if ($res.status -eq 'ok') { Write-Host '------------------------------------------' -ForegroundColor Green; Write-Host '[SUCCESS] AI SERVER IS CONNECTED & READY' -ForegroundColor Green; Write-Host '------------------------------------------' -ForegroundColor Green; $success = $true; break; } } catch { Start-Sleep -Seconds 1 } }; if (-not $success) { Write-Host '[WARNING] AI server is taking too long to start...' -ForegroundColor Yellow }"
echo.

echo [INFO] Starting Electron Frontend (Port 8080)...
npm start
