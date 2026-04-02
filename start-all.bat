@echo off
setlocal

set "ROOT=%~dp0"

for %%D in (api web admin) do (
  if not exist "%ROOT%%%D\package.json" (
    echo [ERROR] Missing "%ROOT%%%D\package.json"
    exit /b 1
  )
)

echo [INFO] Starting API on port 3016...
start "fatsoma-api" cmd /k "cd /d \"%ROOT%api\" && set PORT=3016 && npm run start"

echo [INFO] Starting Web on port 3001...
start "fatsoma-web" cmd /k "cd /d \"%ROOT%web\" && set PORT=3001 && npm run start"

echo [INFO] Starting Admin on port 3003...
start "fatsoma-admin" cmd /k "cd /d \"%ROOT%admin\" && set PORT=3003 && npm run start"

echo.
echo [DONE] Started api, web, and admin in separate terminals.
exit /b 0

