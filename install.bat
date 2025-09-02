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
    echo UAC.ShellExecute "cmd.exe", "/k %~s0 %params%", "", "runas", 1 >> "%temp%\getadmin.vbs"

    "%temp%\getadmin.vbs"
    del "%temp%\getadmin.vbs"
    exit /B

:gotAdmin
    if (exist "%temp%\getadmin.vbs") ( del "%temp%\getadmin.vbs" )
    pushd "%CD%"
    CD /D "%~dp0"
:--------------------------------------

:: End of UAC check

set "REPO_URL=https://github.com/MatiasBonfigli/ERP-WHATSAPP-CONNECTION.git"
set "CLONE_DIR=C:\ERP-WHATSAPP-CONNECTION"
set "SERVICE_NAME=waapi"
set "NSSM_URL=https://nssm.cc/release/nssm-2.24.zip"
set "NSSM_ZIP_PATH=%temp%\nssm.zip"
set "NSSM_EXTRACT_PATH=%temp%\nssm"

echo =================================================
echo       WhatsApp API Bootstrapper Installer
echo =================================================
echo This script will clone the API repository and set it up as a Windows service.
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

:: Check for Git first, as it's needed for cloning
echo.
echo Checking for Git...
git --version >nul 2>nul
if %errorlevel% neq 0 (
    echo Git not found. Installing with winget...
    winget install --id Git.Git -e --accept-package-agreements
) else (
    echo Git is already installed.
)

:: Clone the repository
echo.
echo =================================================
echo      Cloning the repository...
echo =================================================
if exist "%CLONE_DIR%" (
    echo Directory %CLONE_DIR% already exists. Skipping clone.
) else (
    echo Cloning %REPO_URL% into %CLONE_DIR%...
    git clone %REPO_URL% "%CLONE_DIR%"
    if %errorlevel% neq 0 (
        echo Failed to clone the repository.
        pause
        exit /b 1
    )
)

:: Change to the repository directory
cd /d "%CLONE_DIR%"

echo.
echo =================================================
echo      Now working inside %CD%
echo =================================================
echo.

:: Check for Node.js
echo Checking for Node.js...
node --version >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js not found. Installing with winget...
    winget install --id OpenJS.NodeJS -e --accept-package-agreements
) else (
    echo Node.js is already installed.
)

:: Check for Redis
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
if %errorlevel% neq 0 (
    echo Failed to install npm dependencies.
    pause
    exit /b 1
)

:: Download and set up NSSM
echo.
echo =================================================
echo      Downloading and setting up NSSM...
echo =================================================
if exist "%NSSM_EXTRACT_PATH%" rmdir /s /q "%NSSM_EXTRACT_PATH%"
echo Downloading NSSM from %NSSM_URL%...
powershell -Command "Invoke-WebRequest -Uri %NSSM_URL% -OutFile %NSSM_ZIP_PATH%"
if %errorlevel% neq 0 (
    echo Failed to download NSSM. & pause & exit /b 1
)
echo Extracting NSSM...
powershell -Command "Expand-Archive -Path %NSSM_ZIP_PATH% -DestinationPath %NSSM_EXTRACT_PATH% -Force"
if %errorlevel% neq 0 (
    echo Failed to extract NSSM. & pause & exit /b 1
)
set "NSSM_EXE_TEMP_PATH=%NSSM_EXTRACT_PATH%\nssm-2.24\win64\nssm.exe"
if not exist "%NSSM_EXE_TEMP_PATH%" (
    echo "Could not find nssm.exe in the extracted folder." & pause & exit /b 1
)
if not exist "%CD%\bin" mkdir "%CD%\bin"
copy "%NSSM_EXE_TEMP_PATH%" "%CD%\bin\nssm.exe" >nul
set "NSSM_EXE_PATH=%CD%\bin\nssm.exe"
echo NSSM is ready and copied to the local bin directory.

:: Configure and install the service
echo.
echo =================================================
echo    Installing '%SERVICE_NAME%' Windows Service...
echo =================================================
for /f "delims=" %%i in ('where node') do set "NODE_PATH=%%i"
if not defined NODE_PATH (
    echo Could not find node.exe path. & pause & exit /b 1
)
"%NSSM_EXE_PATH%" status %SERVICE_NAME% >nul 2>nul
if %errorlevel% equ 0 (
    echo Service '%SERVICE_NAME%' already exists. Stopping and removing it before reinstalling.
    "%NSSM_EXE_PATH%" stop %SERVICE_NAME% >nul 2>nul
    "%NSSM_EXE_PATH%" remove %SERVICE_NAME% confirm
)
"%NSSM_EXE_PATH%" install %SERVICE_NAME% "%NODE_PATH%"
"%NSSM_EXE_PATH%" set %SERVICE_NAME% AppParameters "%CD%\main.js"
"%NSSM_EXE_PATH%" set %SERVICE_NAME% AppDirectory "%CD%"
"%NSSM_EXE_PATH%" set %SERVICE_NAME% AppStdout "%CD%\waapi.log"
"%NSSM_EXE_PATH%" set %SERVICE_NAME% AppStderr "%CD%\waapi-error.log"
"%NSSM_EXE_PATH%" set %SERVICE_NAME% Start SERVICE_AUTO_START
echo Starting the '%SERVICE_NAME%' service...
"%NSSM_EXE_PATH%" start %SERVICE_NAME%

echo.
echo =================================================
echo              Installation Complete!
echo =================================================
echo The WhatsApp API has been installed as a Windows service named '%SERVICE_NAME%'.
echo It is now running in the background from the %CD% directory.
pause
exit /b 0
