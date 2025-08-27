@echo off
:: BatchGotAdmin
:-------------------------------------
REM  --> Check for permissions
>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"

REM --> If error flag set, we do not have admin.
if '%errorlevel%' NEQ '0' (
    echo Requesting administrative privileges...
    goto UACPrompt
) else ( goto gotAdmin )

:UACPrompt
    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\getadmin.vbs"
    set params = %*:"="
    echo UAC.ShellExecute "cmd.exe", "/c %~s0 %params%", "", "runas", 1 >> "%temp%\getadmin.vbs"

    "%temp%\getadmin.vbs"
    del "%temp%\getadmin.vbs"
    exit /B

:gotAdmin
    if (exist "%temp%\getadmin.vbs") ( del "%temp%\getadmin.vbs" )
    pushd "%CD%"
    CD /D "%~dp0"
:--------------------------------------

:: End of UAC check

echo =================================================
echo            WhatsApp API Installer
echo =================================================
echo This script will install Node.js, Git, and Redis if they are not found.
echo It will then install project dependencies and start the API.
echo.

:: Check for winget
echo Checking for winget...
winget --version >nul 2>nul
if %errorlevel% neq 0 (
    echo winget not found. Please install App Installer from the Microsoft Store:
    echo ms-windows-store://pdp/?productid=9NBLGGH4NNS1
    pause
    exit /b 1
)
echo winget found.

:: Check for and install dependencies
:check_node
echo.
echo Checking for Node.js...
node --version >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js not found. Installing with winget...
    winget install --id OpenJS.NodeJS -e --accept-package-agreements
) else (
    echo Node.js is already installed.
)

:check_git
echo.
echo Checking for Git...
git --version >nul 2>nul
if %errorlevel% neq 0 (
    echo Git not found. Installing with winget...
    winget install --id Git.Git -e --accept-package-agreements
) else (
    echo Git is already installed.
)

:check_redis
echo.
echo Checking for Redis...
redis-cli --version >nul 2>nul
if %errorlevel% neq 0 (
    echo Redis not found. Installing with winget...
    winget install --id Redis.Redis -e --accept-package-agreements
) else (
    echo Redis is already installed.
)


:: Install project dependencies
echo.
echo =================================================
echo      Installing project dependencies...
echo =================================================
call npm install

:: Start the application with PM2
echo.
echo =================================================
echo         Starting the API with PM2...
echo =================================================
call npm start

:: Save the PM2 process list to start on reboot
echo.
echo =================================================
echo    Configuring PM2 to start on system reboot...
echo =================================================
call pm2 startup
call pm2 save

echo.
echo =================================================
echo              Installation Complete!
echo =================================================
echo The WhatsApp API is now running via PM2.
echo You can check the status by running: pm2 status
pause
exit /b 0
