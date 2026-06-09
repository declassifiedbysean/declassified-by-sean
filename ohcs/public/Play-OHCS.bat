@echo off
setlocal enabledelayedexpansion
title Only Humans Can Score - local server

rem Run from the folder this launcher lives in (must contain index.html).
cd /d "%~dp0"

if not exist "index.html" (
  echo.
  echo   Could not find index.html next to this launcher.
  echo   Put Play-OHCS.bat in the folder that has index.html, then double-click it again.
  echo.
  pause
  exit /b 1
)

set "PORT=8000"

echo.
echo   Only Humans Can Score - starting a local server...
echo.

rem --- Preferred: Python (clean MIME types + range requests). Try py, python, python3. ---
for %%P in (py python python3) do (
  where %%P >nul 2>nul
  if !errorlevel! == 0 (
    echo   Using %%P  ^>  http://localhost:%PORT%/
    echo   ^(close this window or press Ctrl+C to stop^)
    echo.
    rem open the browser a moment after the server binds (ping = reliable delay; timeout breaks here)
    start "" /b cmd /c "ping -n 3 127.0.0.1 >nul & explorer http://localhost:%PORT%/"
    %%P -m http.server %PORT% --bind 127.0.0.1
    goto :done
  )
)

rem --- Fallback: zero-install PowerShell server (no Python, no admin needed). ---
where powershell >nul 2>nul
if !errorlevel! == 0 (
  if exist "%~dp0serve.ps1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
    goto :done
  ) else (
    echo   serve.ps1 is missing. Keep Play-OHCS.bat and serve.ps1 together in the site folder.
    pause
    exit /b 1
  )
)

echo   No Python or PowerShell found.
echo   Install Python from https://www.python.org/downloads/ ^(tick "Add to PATH"^) and run this again.
pause

:done
echo.
echo   Server stopped. Press any key to close this window.
pause >nul
endlocal
