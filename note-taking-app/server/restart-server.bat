@echo off
echo Restarting Notes Server...
echo.

REM Kill any existing node processes running the server
taskkill /F /IM node.exe /FI "WINDOWTITLE eq *server*" 2>nul

REM Wait a moment
timeout /t 2 /nobreak >nul

REM Start the server
cd /d "%~dp0"
echo Starting server...
npm start
