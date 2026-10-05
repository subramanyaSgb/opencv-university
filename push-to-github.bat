@echo off
setlocal
title Push OpenCV University to GitHub
cd /d "%~dp0"

where git >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Git is not installed or not on PATH.
  echo Install it from https://git-scm.com/download/win and run this file again.
  pause
  exit /b 1
)

if not exist ".git" (
  echo Initialising git repository...
  git init -b main >nul
)

git config user.name >nul 2>&1 || git config user.name "Subramanya GB"
git config user.email >nul 2>&1 || git config user.email "subramanya.bellary@deeviasoftware.com"

git remote get-url origin >nul 2>&1
if errorlevel 1 (
  echo.
  echo Create an EMPTY repository on github.com first ^(no README, no .gitignore^).
  set /p REPO_URL=Paste its URL, e.g. https://github.com/subramanyabellary-lang/opencv-university.git : 
  call git remote add origin %%REPO_URL%%
)

echo.
set "MSG=Update OpenCV University"
set /p MSG=Commit message [Update OpenCV University]: 
git add -A
git commit -m "%MSG%"
if errorlevel 1 echo Nothing new to commit, pushing anyway.

git branch -M main
echo.
echo Pushing to:
git remote get-url origin
git push -u origin main
if errorlevel 1 (
  echo.
  echo [ERROR] Push failed. If a sign-in window opened, sign in to GitHub and run this file again.
  pause
  exit /b 1
)

echo.
echo Done. Vercel redeploys automatically after every push once the project is imported.
pause
endlocal
