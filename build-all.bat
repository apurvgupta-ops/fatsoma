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
  echo [INFO] Building %%D...
  pushd "%ROOT%%%D"
  call npm run build
  if errorlevel 1 (
    echo [ERROR] Build failed in %%D
    popd
    exit /b 1
  )
  popd
)

echo.
echo [DONE] Build completed for api, web, and admin.
exit /b 0

