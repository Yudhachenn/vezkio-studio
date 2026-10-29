@echo off
setlocal
cd /d "%~dp0"
echo === VEZKIO Studio 1.2.0 - Windows Release Candidate ===
call npm install || goto :failed
call npm run release:preflight || goto :failed
call npm run check || goto :failed
call npm run test:creative || goto :failed
call npm run tauri build -- --bundles nsis || goto :failed
if not exist "src-tauri\target\release\bundle\nsis" goto :failed
for %%F in ("src-tauri\target\release\bundle\nsis\*-setup.exe") do echo Installer: %%~fF
echo IMPORTANT: Test the installer before public release.
pause
exit /b 0
:failed
echo Build failed - inspect logs; installer not verified.
pause
exit /b 1
