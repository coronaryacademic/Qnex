@echo off
echo Starting Qnex File System Server...
echo.
echo Installing dependencies...
npm install
echo.
echo Starting server on port 3001 (LAN access enabled)
echo.
echo The server will save your notes to: D:\MyNotes
echo.
echo Press Ctrl+C to stop the server
echo.
node server.js
pause
