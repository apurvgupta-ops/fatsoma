@echo off
setlocal

echo ========================================
echo Starting Fatsoma Services
echo ========================================
echo.

set ROOT=%~dp0

echo Starting API Server...
start "Fatsoma - API Server" cmd /k "cd /d %ROOT%api && title Fatsoma - API Server && npm run dev"
timeout /t 2 /nobreak >nul

echo Starting Web App (Port 3001)...
start "Fatsoma - Web App (Port 3001)" cmd /k "cd /d %ROOT%web && title Fatsoma - Web App && npm run dev"
timeout /t 2 /nobreak >nul

echo Starting Admin App (Port 3003)...
start "Fatsoma - Admin App (Port 3003)" cmd /k "cd /d %ROOT%admin && title Fatsoma - Admin App && npm run dev"

echo.
echo ========================================
echo All applications are starting!
echo ========================================
echo.
echo Access the apps at:
echo   - API:   http://localhost:3000
echo   - Web:   http://localhost:3001
echo   - Admin: http://localhost:3003
echo.

endlocal
