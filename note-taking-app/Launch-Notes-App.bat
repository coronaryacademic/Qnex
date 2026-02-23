@echo off
title Qnex Launcher
echo.
echo Welcome Back Momen 
echo.
echo Starting embedded server and app...
echo Your notes will be saved to: D:\MyNotes
echo.

REM Check which PC we're on and set the correct path
if exist "d:\My projects\Note taking app\notes-app-1.0\windsurf-project\note-taking-app\electron" (
    cd /d "d:\My projects\Note taking app\notes-app-1.0\windsurf-project\note-taking-app\electron"
) else (
    cd /d "d:\windsurf-project\note-taking-app\electron"
)

echo Checking dependencies...
if not exist "node_modules" (
    echo Installing dependencies for first time...
    npm install
    echo.
)

echo Launching Electron app with embedded server...
npm start

echo.
echo App closed. Press any key to exit...
pause >nul
