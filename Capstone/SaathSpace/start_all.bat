@echo off
title SaathSpace Launcher
echo ================================================================
echo            Launching SaathSpace Full-Stack Application
echo ================================================================
echo.
echo 1. Starting Backend API on http://localhost:5000...
start "SaathSpace Backend (Flask)" cmd /k ""%~dp0start_backend.bat""

timeout /t 2 /nobreak >nul

echo 2. Starting Frontend Dev Server on http://localhost:5173...
start "SaathSpace Frontend (Vite)" cmd /k ""%~dp0start_frontend.bat""

echo.
echo ================================================================
echo   SaathSpace is launching!
echo   - Web UI:     http://localhost:5173
echo   - Backend:    http://localhost:5000/api/health
echo ================================================================
echo.
pause
