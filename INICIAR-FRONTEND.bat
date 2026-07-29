@echo off
cd /d "%~dp0saborAndino-frontend"
if not exist node_modules (
  echo Instalando dependencias del frontend...
  call npm install
  if errorlevel 1 exit /b 1
)
call npm start
pause
