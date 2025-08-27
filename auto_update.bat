@echo off
echo =================================================
echo           WhatsApp API Auto-Updater
echo =================================================
echo.

:: Navigate to the script's directory to ensure commands run in the project root
cd /d "%~dp0"

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
    echo --- Restarting the API...
    call npm restart

    echo.
    echo --- Update process complete.
) else (
    echo --- No new updates found. The API is already up to date.
)

echo.
echo =================================================
echo           Auto-Updater Finished
echo =================================================
