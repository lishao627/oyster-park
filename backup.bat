@echo off
rem Oyster Park one-click backup wrapper
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0backup.ps1"
echo.
pause
