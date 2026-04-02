@echo off
setlocal

cd /d %~dp0

echo ========================================
echo Installing Dependencies for Fatsoma
echo ========================================
echo.

echo [1/3] Installing api dependencies...
cd api
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install api dependencies
    pause
    exit /b %errorlevel%
)
cd ..
echo Api dependencies installed successfully!
echo.

echo [2/3] Installing web dependencies...
cd web
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install web dependencies
    pause
    exit /b %errorlevel%
)
cd ..
echo Web dependencies installed successfully!
echo.

echo [3/3] Installing admin dependencies...
cd admin
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install admin dependencies
    pause
    exit /b %errorlevel%
)
cd ..
echo Admin dependencies installed successfully!
echo.

echo ========================================
echo All dependencies installed successfully!
echo ========================================
pause

endlocal
