@echo off
cd /d "%~dp0saborandino-api"
call mvnw.cmd spring-boot:run
pause
