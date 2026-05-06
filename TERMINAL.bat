@echo off
title PMRV - Terminal Remoto
echo ==========================================
echo       TERMINAL OPERACIONAL PMRV
echo ==========================================
echo.
echo [+] Diretorio atual: %CD%
echo [+] Digite 'exit' para fechar.
echo.
powershell.exe -NoExit -Command "Set-Location '%CD%'"
