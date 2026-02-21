@echo off
cd /d "%~dp0"
if not exist "node_modules" (
    npm install
)

echo [INFO] Starting Backend Server (Port 3001)...
start /d "%~dp0..\server" /b node server.js

echo.
echo [CHECK] Verifying AI Evolution ^& Learning Engine...
powershell -Command "$health = $false; $learning = $false; for ($i=0; $i -lt 12; $i++) { try { if (-not $health) { $res = Invoke-RestMethod -Uri 'http://localhost:3001/api/health'; if ($res.status -eq 'ok') { $health = $true; } }; if (-not $learning) { $res2 = Invoke-RestMethod -Uri 'http://localhost:3001/api/ai/learning-data'; if ($res2.stats) { $learning = $true; } }; if ($health -and $learning) { Write-Host '------------------------------------------' -ForegroundColor Green; Write-Host '[SUCCESS] AI SERVER IS CONNECTED' -ForegroundColor Green; Write-Host '[SUCCESS] LEARNING ENGINE IS INITIALIZED' -ForegroundColor Green; Write-Host '------------------------------------------' -ForegroundColor Green; break; } } catch { Start-Sleep -Seconds 1 } }; if (-not $health -or -not $learning) { Write-Host '[WARNING] AI system is taking too long to initialize...' -ForegroundColor Yellow }"
echo.

echo [INFO] Starting Electron Frontend (Port 8080)...
npm start
