@echo off
echo =================================================
echo        WhatsApp API Auto-Updater (NSSM)
echo =================================================
echo.

:: The installer clones the project to C:\ERP-WHATSAPP-CONNECTION
:: The scheduled task should run this script from that directory.
set "PROJECT_DIR=C:\ERP-WHATSAPP-CONNECTION"
cd /d "%PROJECT_DIR%"
if not exist "%PROJECT_DIR%\main.js" (
    echo Project directory not found at %PROJECT_DIR%.
    echo Cannot continue with the update.
    exit /b 1
)

set "SERVICE_NAME=waapi"
set "NSSM_EXE_PATH=%PROJECT_DIR%\bin\nssm.exe"

if not exist "%NSSM_EXE_PATH%" (
    echo "NSSM executable not found at %NSSM_EXE_PATH%"
    echo "Please run the install.bat script first to set up NSSM."
    exit /b 1
)

echo --- Ensuring we are on the main branch...
git checkout main

echo --- Checking for updates on the main branch...
:: Fetch the latest changes from the remote
git fetch origin

:: Compare local main with remote main
git rev-list --left-right --count main...origin/main | findstr /R "^0[	]0$" >nul
if %errorlevel% equ 0 (
    echo --- No new updates found. The API is already up to date.
) else (
    echo --- Updates found. Pulling changes for the main branch...
    git pull origin main

    echo.
    echo --- Installing/updating dependencies...
    call npm install

    echo.
    echo --- Restarting the '%SERVICE_NAME%' service...
    "%NSSM_EXE_PATH%" restart %SERVICE_NAME%

    echo.
    echo --- Update process complete.
)

echo.
echo =================================================
echo           Auto-Updater Finished
echo =================================================
