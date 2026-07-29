@echo off
start "Sabor Andino Backend" cmd /k call "%~dp0INICIAR-BACKEND.bat"
timeout /t 5 /nobreak >nul
start "Sabor Andino Frontend" cmd /k call "%~dp0INICIAR-FRONTEND.bat"
