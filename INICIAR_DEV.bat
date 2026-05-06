@echo off
title PMRV - Ambiente de Desenvolvimento
echo ==========================================
echo    INICIANDO AMBIENTE PMRV OPERACIONAL
echo ==========================================
echo.

:: Verifica se a pasta node_modules existe
if not exist "node_modules\" (
    echo [!] Pasta node_modules nao encontrada. Instalando dependencias...
    npm install
)

echo.
echo [+] Iniciando servidor Vite...
echo [+] O aplicativo estara disponivel em: http://localhost:5173
echo.
npm run dev
pause
