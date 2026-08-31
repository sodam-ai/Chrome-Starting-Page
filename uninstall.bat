@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

set "SCRIPT_DIR=%~dp0"
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT=%STARTUP_FOLDER%\Dashboard_StartPage.lnk"

echo ============================================
echo   Dashboard Starting Page - Uninstall
echo ============================================
echo.
echo   This will:
echo     1. Stop the dashboard server
echo     2. Remove auto-start (Registry + Startup shortcut)
echo     3. Optionally delete your data
echo.
echo   This will NOT affect any other programs.
echo.

:: ==========================================
:: Step 1: Stop server (PID-based only — safe)
:: ==========================================
echo [STEP 1] Stopping server...
if exist ".server.pid" (
    for /f "tokens=*" %%a in ('powershell -Command "(Get-Content '.server.pid' | ConvertFrom-Json).pid"') do (
        set "OLD_PID=%%a"
    )
    if defined OLD_PID (
        powershell -Command "try { $p = Get-Process -Id !OLD_PID! -ErrorAction Stop; if ($p.ProcessName -match 'node') { Stop-Process -Id !OLD_PID! -Force; Write-Host '[OK] Server stopped (PID: !OLD_PID!)' } else { Write-Host '[SKIP] PID !OLD_PID! is not node' } } catch { Write-Host '[OK] Server was not running' }"
    )
    del ".server.pid" >nul 2>&1
) else (
    echo [OK] Server was not running
)
echo.

:: ==========================================
:: Step 2: Remove auto-start (all methods)
:: ==========================================
echo [STEP 2] Removing auto-start...

:: Remove Registry entry
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "DashboardStartPage" /f >nul 2>&1
echo [OK] Registry auto-start removed

:: Remove Startup shortcut (if exists)
if exist "%SHORTCUT%" (
    del "%SHORTCUT%" >nul 2>&1
    echo [OK] Startup shortcut removed
)

:: Remove Task Scheduler entry (if exists)
schtasks /delete /tn "DashboardStartPage" /f >nul 2>&1
echo.

:: ==========================================
:: Step 3: Ask about data
:: ==========================================
echo [STEP 3] Your data (bookmarks, notes, settings, etc.)
echo.
if exist "data\bookmarks.json" (
    echo   Your data folder contains:
    echo     - Bookmarks, Notes, Todos, D-Days
    echo     - Settings, Usage history
    echo     - Backups, Icons, Profiles
    echo.
    echo   Do you want to KEEP your data?
    echo   (You can use it if you reinstall later)
    echo.
    choice /C YN /M "Keep data (Y=Keep, N=Delete)"
    if !errorlevel! equ 2 (
        echo.
        echo   Are you REALLY sure? This cannot be undone.
        choice /C YN /M "DELETE all data permanently (Y=Delete, N=Keep)"
        if !errorlevel! equ 1 (
            rmdir /s /q "data" >nul 2>&1
            echo [OK] Data deleted
        ) else (
            echo [OK] Data preserved
        )
    ) else (
        echo [OK] Data preserved in data\ folder
    )
) else (
    echo [OK] No data found
)
echo.

:: ==========================================
:: Step 4: Clean up runtime files
:: ==========================================
echo [STEP 4] Cleaning up runtime files...
del "server.log" >nul 2>&1
del "server.error.log" >nul 2>&1
del "server.error.log.old" >nul 2>&1
del ".server.pid" >nul 2>&1
del ".autostart-installed" >nul 2>&1
echo [OK] Runtime files cleaned
echo.

:: ==========================================
:: Done
:: ==========================================
echo ============================================
echo   Uninstall Complete!
echo ============================================
echo.
echo   What was removed:
echo     - Server stopped
echo     - Auto-start disabled
echo     - Runtime files cleaned
echo.
if exist "data\bookmarks.json" (
    echo   Your data is still in the data\ folder.
    echo   You can safely delete the entire folder now,
    echo   or keep it for reinstalling later.
) else (
    echo   You can safely delete the entire folder now.
)
echo.
echo   No system files were modified.
echo   No other programs were affected.
echo.
pause
