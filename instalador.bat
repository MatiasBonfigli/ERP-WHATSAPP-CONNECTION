@echo off
title Configuración automática de API Node.js con PM2
setlocal enabledelayedexpansion

:: Verificar permisos de administrador
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Ejecuta este script como Administrador.
    pause
    exit /b
)

:: 1. Instalar dependencias del proyecto
echo [INFO] Instalando dependencias con npm...
npm install
if %errorlevel% neq 0 (
    echo [ERROR] Falló la instalación de dependencias.
    pause
    exit /b
)

:: 2. Instalar PM2 globalmente
echo [INFO] Instalando PM2 globalmente...
npm install -g pm2
if %errorlevel% neq 0 (
    echo [ERROR] Falló la instalación de PM2.
    pause
    exit /b
)

:: 3. Iniciar API con PM2
echo [INFO] Iniciando API con PM2...
pm2 start main.js --name mi-api-local
if %errorlevel% neq 0 (
    echo [ERROR] Falló el inicio de la API.
    pause
    exit /b
)

:: 4. Guardar la configuración de PM2
pm2 save

:: 5. Instalar pm2-windows-startup (solo primera vez)
echo [INFO] Configurando inicio automático con Windows...
npm install -g pm2-windows-startup
pm2-startup install

echo [✔] Todo listo. La API se ejecutará en segundo plano y se iniciará con Windows.
pause
