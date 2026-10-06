@echo off
setlocal enabledelayedexpansion
title OpenCV University - commit chapters and push
cd /d "%~dp0"
echo.
echo  OpenCV University - commit new chapters one by one, then push
echo  ============================================================
echo.
where git >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Git is not installed or not on PATH.
  pause
  exit /b 1
)
if not exist "chapter-patches\*.patch" (
  echo No new chapter commits waiting.
  goto push
)
if not exist "chapter-patches\applied" mkdir "chapter-patches\applied"
dir /b /on "chapter-patches\*.patch" > "%TEMP%\ocu-patches.txt"
for /f "usebackq delims=" %%F in ("%TEMP%\ocu-patches.txt") do (
  set "P=chapter-patches\%%F"
  git apply --cached --binary --check "!P!" >nul 2>nul
  if !errorlevel! equ 0 (
    git apply --cached --binary "!P!"
    git commit -q -F "chapter-patches\%%~nF.msg"
    echo   committed  %%~nF
  ) else (
    echo   skipped    %%~nF  ^(already committed, or your files differ^)
  )
  move /y "!P!" "chapter-patches\applied\" >nul
  if exist "chapter-patches\%%~nF.msg" move /y "chapter-patches\%%~nF.msg" "chapter-patches\applied\" >nul
)
:push
echo.
echo Pushing to GitHub...
git push
if errorlevel 1 (
  echo.
  echo [ERROR] Push failed. Check your internet connection and GitHub login, then run this again.
) else (
  echo.
  echo Done. Vercel will redeploy in a minute or two.
)
echo.
pause
