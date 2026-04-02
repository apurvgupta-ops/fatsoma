@echo off
setlocal

set "ROOT=%~dp0"

for %%D in (api web admin) do (
  if not exist "%ROOT%%%D\package.json" (
    echo [ERROR] Missing "%ROOT%%%D\package.json"
    exit /b 1
  )
)

for %%D in (api web admin) do (
  echo.
  echo [INFO] Installing dependencies in %%D...
  pushd "%ROOT%%%D"
  call npm install
  if errorlevel 1 (
    echo [ERROR] npm install failed in %%D
    popd
    exit /b 1
  )
  popd
)

echo.
echo [DONE] Dependencies installed for api, web, and admin.
exit /b 0

