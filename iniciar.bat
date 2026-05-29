@echo off
title PhishShield - Servidor de Desarrollo
echo ====================================================
echo    🛡️  Iniciando PhishShield (Deteccion de Phishing)
echo ====================================================
echo.

:: Verificar si existe node_modules, si no, instalar dependencias
if not exist node_modules (
    echo [INFO] No se detecto la carpeta node_modules. Instalando dependencias...
    call npm install
    echo.
)

:: Abrir el navegador en el puerto configurado (3001)
echo [1/2] Abriendo el navegador en http://localhost:3001...
start http://localhost:3001
echo.

:: Iniciar el servidor de desarrollo
echo [2/2] Iniciando el servidor con npm run dev...
echo.
call npm run dev

pause
