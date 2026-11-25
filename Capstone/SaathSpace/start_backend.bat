@echo off
title SaathSpace Backend (Flask)
echo ===================================================
echo   Starting SaathSpace Flask Backend API (Port 5000)
echo ===================================================
cd /d "%~dp0backend"

if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
) else if exist "..\.venv\Scripts\activate.bat" (
    call ..\.venv\Scripts\activate.bat
) else if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
)

python run.py
if errorlevel 1 (
    echo.
    echo Backend encountered an issue. Please verify database connection in backend\.env.
    pause
)
