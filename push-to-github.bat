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

set "REPO_URL="
for /f "delims=" %%u in ('git remote get-url origin 2^>nul') do set "REPO_URL=%%u"
echo.
if defined REPO_URL (
  echo Current GitHub repository: %REPO_URL%
  set /p NEW_URL=Press Enter to keep it, or paste a different repository URL: 
) else (
  echo Create an EMPTY repository on github.com first ^(no README, no .gitignore^).
  set /p NEW_URL=Paste its URL, e.g. https://github.com/subramanyabellary-lang/opencv-university.git : 
)
if defined NEW_URL (
  git remote remove origin >nul 2>&1
  call git remote add origin %%NEW_URL%%
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
  echo [ERROR] Push failed.
  echo  - "Repository not found": open the URL above in your browser. If GitHub shows 404,
  echo    the repository does not exist under that name, or you are signed in as another account.
  echo  - Wrong account saved on this PC: Control Panel ^> Credential Manager ^> Windows Credentials,
  echo    remove the entries for git:https://github.com, then run this file again and sign in.
  pause
  exit /b 1
)

echo.
echo Done. Vercel redeploys automatically after every push once the project is imported.
pause
endlocal
