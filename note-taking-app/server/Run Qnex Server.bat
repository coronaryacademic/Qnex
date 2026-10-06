@echo off
title Qnex Server
cd /d "%~dp0"

if not exist "node_modules\express" (
  echo Installing Qnex server dependencies...
  call npm.cmd install
  if errorlevel 1 (
    echo.
    echo Dependency installation failed. Check your internet connection and try again.
    pause
    exit /b 1
  )
)

echo.
echo Qnex is starting on port 3001.
echo Keep this window open while using the app.
echo Laptop URL: http://localhost:3001
echo iPad URL:   http://192.168.100.143:3001
echo.
node server.js
echo.
echo Qnex server stopped.
pause
