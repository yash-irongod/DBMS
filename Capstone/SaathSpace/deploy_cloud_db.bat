@echo off
title SaathSpace Cloud Database Restorer
echo ================================================================
echo         SaathSpace Cloud PostgreSQL Database Deployment
echo ================================================================
echo.
cd /d "%~dp0"

if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
) else if exist "backend\.venv\Scripts\activate.bat" (
    call backend\.venv\Scripts\activate.bat
)

python scripts\deploy_database.py %*
if errorlevel 1 (
    echo.
    echo Database deployment encountered an issue. See details above.
)
echo.
pause
