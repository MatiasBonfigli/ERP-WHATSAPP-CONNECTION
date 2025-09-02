@echo off
echo =================================================
echo        WhatsApp API Auto-Updater (NSSM)
echo =================================================
echo.

:: Navigate to the script's directory to ensure commands run in the project root
cd /d "%~dp0"

set "SERVICE_NAME=waapi"
set "NSSM_EXE_PATH=%CD%\bin\nssm.exe"

if not exist "%NSSM_EXE_PATH%" (
    echo "NSSM executable not found at %NSSM_EXE_PATH%"
    echo "Please run the install.bat script first to set up NSSM."
    exit /b 1
)

echo --- Checking for updates...
:: Fetch the latest changes from the remote, but don't apply them yet
git fetch

:: Check if the local branch is behind the remote branch
git status -uno | findstr /B /C:"Your branch is behind"
if %errorlevel% equ 0 (
    echo --- Updates found. Pulling changes...
    git pull

    echo.
    echo --- Installing/updating dependencies...
    call npm install

    echo.
    echo --- Restarting the '%SERVICE_NAME%' service...
    "%NSSM_EXE_PATH%" restart %SERVICE_NAME%

    echo.
    echo --- Update process complete.
) else (
    echo --- No new updates found. The API is already up to date.
)

echo.
echo =================================================
echo           Auto-Updater Finished
echo =================================================
