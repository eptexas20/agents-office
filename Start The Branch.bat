@echo off
setlocal
title The Branch
cd /d "%~dp0"

echo.
echo   The Branch - starting up
echo   ------------------------
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo   Node.js is not installed yet.
  echo.
  echo   1. Your browser will open the Node.js download page.
  echo   2. Download and install the "LTS" version - keep all the default options.
  echo   3. Double-click "Start The Branch" again.
  echo.
  start "" "https://nodejs.org/en/download"
  pause
  exit /b 1
)

if not exist "node_modules\playwright-core\package.json" (
  echo   First run: installing what The Branch needs. This takes about a minute...
  echo.
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo.
    echo   The install did not finish. Check your internet connection and try again.
    pause
    exit /b 1
  )
  echo.
)

echo   Opening http://127.0.0.1:4173 in your browser...
echo.
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://127.0.0.1:4173"

node server.js
if errorlevel 1 (
  echo.
  echo   The Branch stopped with an error. If it says the address is already in use,
  echo   The Branch is probably already running in another window.
  pause
)
endlocal
