@echo off
setlocal

set "ROOT=%~dp0"
set "MODE=%~1"
if /I "%MODE%"=="production" (
  set "NODE_ENV_VALUE=production"
  set "NPM_SCRIPT=start"
) else if /I "%MODE%"=="prod" (
  set "NODE_ENV_VALUE=production"
  set "NPM_SCRIPT=start"
) else (
  set "NODE_ENV_VALUE=development"
  set "NPM_SCRIPT=dev"
)

for %%D in (api web admin) do (
  if not exist "%ROOT%%%D\package.json" (
    echo [ERROR] Missing "%ROOT%%%D\package.json"
    exit /b 1
  )
)

echo [INFO] Starting apps with NODE_ENV=%NODE_ENV_VALUE%
echo [INFO] Starting API on port 3016...
start "fatsoma-api" cmd /k "cd /d \"%ROOT%api\" && set NODE_ENV=%NODE_ENV_VALUE% && set PORT=3016 && npm run %NPM_SCRIPT%"

echo [INFO] Starting Web on port 3001...
start "fatsoma-web" cmd /k "cd /d \"%ROOT%web\" && set NODE_ENV=%NODE_ENV_VALUE% && set PORT=3001 && npm run %NPM_SCRIPT%"

echo [INFO] Starting Admin on port 3003...
start "fatsoma-admin" cmd /k "cd /d \"%ROOT%admin\" && set NODE_ENV=%NODE_ENV_VALUE% && set PORT=3003 && npm run %NPM_SCRIPT%"

echo.
echo [DONE] Started api, web, and admin in separate terminals.
echo [TIP] Use: start-all.bat           for development mode.
echo [TIP] Use: start-all.bat production (or prod) for production mode.
exit /b 0

