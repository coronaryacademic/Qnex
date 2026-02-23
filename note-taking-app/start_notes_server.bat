@echo off
title Qnex Standalone Server
echo ==========================================
echo   Starting Standalone Qnex Server...
echo ==========================================
echo.

:: Hardcode the path to avoid any %~dp0 issues
cd /d "d:\My projects\Note taking app\notes-app-1.0\windsurf-project\note-taking-app\server"

if not exist "node_modules\" (
    echo [INFO] Installing dependencies...
    call npm install
)

echo [INFO] Starting server on port 3001...
node server.js
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] The server stopped with code %ERRORLEVEL%
)

echo.
echo Press any key to exit...
pause > nul
