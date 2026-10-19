@echo off
rem Double-click to run the game locally. Close the window to stop it.
rem The leading _ keeps this file off the published site.

set PORT=8913
set URL=http://localhost:%PORT%/

cd /d "%~dp0"

where npx >nul 2>nul
if errorlevel 1 (
    echo This needs Node.js. Install the LTS version from https://nodejs.org, then try again.
    pause
    exit /b 1
)

rem A second double-click shouldn't fail on the busy port; just open the page.
curl -s -o nul %URL% >nul 2>nul
if not errorlevel 1 (
    echo Already running at %URL%
    start "" %URL%
    exit /b 0
)

echo Game:     %URL%
echo Sliders:  %URL%_labs/tune.html
echo Close this window, or press Ctrl+C, to stop.
echo.
call npx --yes http-server . -p %PORT% -c-1 -o /
pause
