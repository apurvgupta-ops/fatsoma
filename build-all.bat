@echo off
setlocal

cd /d %~dp0

echo ========================================
echo Building Fatsoma Applications
echo ========================================
echo.

echo [1/3] Building API...
cd api
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Failed to build api
    pause
    exit /b %errorlevel%
)
cd ..
echo API built successfully!
echo.

echo [2/3] Building Web App...
cd web
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Failed to build web
    pause
    exit /b %errorlevel%
)
cd ..
echo Web app built successfully!
echo.

echo [3/3] Building Admin App...
cd admin
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Failed to build admin
    pause
    exit /b %errorlevel%
)
cd ..
echo Admin app built successfully!
echo.

echo ========================================
echo All applications built successfully!
echo ========================================
echo.
echo Build outputs:
echo   - API:   api/dist/
echo   - Web:   web/.next/
echo   - Admin: admin/.next/
echo.

pause
endlocal
