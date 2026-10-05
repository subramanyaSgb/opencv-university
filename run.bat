@echo off
setlocal
title OpenCV University
cd /d "%~dp0"

echo ============================================
echo   OpenCV University - local dev server
echo ============================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js is not installed or not on PATH.
  echo Install Node.js 22 LTS from https://nodejs.org and run this file again.
  pause
  exit /b 1
)

for /f "delims=" %%v in ('node -v') do set NODEVER=%%v
echo Node.js %NODEVER%
echo %NODEVER% | findstr /b "v22." >nul || echo [WARN] Node 22 LTS is recommended. Found %NODEVER%.

if not exist ".git" (
  where git >nul 2>&1 && (
    echo Initialising git repository...
    git init -b main >nul
  )
)

if not exist "node_modules" (
  echo.
  echo Installing dependencies - first run only, takes a minute...
  call npm install
  if errorlevel 1 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
  )
)

echo.
echo Starting the app. Your browser will open in a few seconds.
echo Address: http://localhost:3000
echo Press Ctrl+C in this window to stop the server.
echo.

start "" /min cmd /c "timeout /t 8 /nobreak >nul & start "" http://localhost:3000/learn/part-a/01-introduction/1.1-what-is-image-processing"

call npm run dev

echo.
echo Server stopped.
pause
endlocal
