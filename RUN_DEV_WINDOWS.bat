@echo off
cd /d "%~dp0"
call npm install || pause
call npm run tauri dev
pause
