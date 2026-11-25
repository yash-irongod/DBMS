@echo off
title SaathSpace Frontend (Vite)
echo ===================================================
echo   Starting SaathSpace React Frontend (Port 5173)
echo ===================================================
cd /d "%~dp0frontend"

npm run dev
if errorlevel 1 (
    echo.
    echo Frontend encountered an issue. Please run 'npm install' inside frontend\ if needed.
    pause
)
