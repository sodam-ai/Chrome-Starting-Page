@echo off
setlocal enabledelayedexpansion

set "SCRIPT_DIR=%~dp0"
set "LOCAL_NODE=%SCRIPT_DIR%node\node.exe"
set "DATA_DIR=%SCRIPT_DIR%data"
set "VBS_PATH=%SCRIPT_DIR%start_hidden.vbs"
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT=%STARTUP_FOLDER%\Dashboard_StartPage.lnk"

echo ============================================
echo   Dashboard Starting Page - Windows Setup
echo ============================================
echo.

:: ==========================================
:: Step 1: Protect existing data
:: ==========================================
if not exist "%DATA_DIR%\bookmarks.json" goto :fresh_install

echo [DATA] Existing data found - will be preserved.
echo [DATA] Creating safety backup before setup...
mkdir "%DATA_DIR%\backups" >nul 2>&1
if exist "%LOCAL_NODE%" (
    "%LOCAL_NODE%" -e "const fs=require('fs'),p=require('path'),D=p.join(__dirname,'data');try{const d={};['bookmarks','notes','config','todos','ddays','usage','trash','events'].forEach(f=>{try{d[f]=JSON.parse(fs.readFileSync(p.join(D,f+'.json'),'utf8'))}catch{}});d._backup_version='safety';d._backup_date=new Date().toISOString();fs.writeFileSync(p.join(D,'backups','safety-before-setup.json'),JSON.stringify(d,null,2))}catch{}" >nul 2>&1
) else (
    node -e "const fs=require('fs'),p=require('path'),D=p.join(__dirname,'data');try{const d={};['bookmarks','notes','config','todos','ddays','usage','trash','events'].forEach(f=>{try{d[f]=JSON.parse(fs.readFileSync(p.join(D,f+'.json'),'utf8'))}catch{}});d._backup_version='safety';d._backup_date=new Date().toISOString();fs.writeFileSync(p.join(D,'backups','safety-before-setup.json'),JSON.stringify(d,null,2))}catch{}" >nul 2>&1
)
if exist "%DATA_DIR%\backups\safety-before-setup.json" (
    echo [OK] Safety backup created
) else (
    echo [INFO] Backup skipped - data files will still be preserved
)
goto :step2

:fresh_install
echo [INFO] Fresh install - no existing data
mkdir "%DATA_DIR%" >nul 2>&1
mkdir "%DATA_DIR%\backups" >nul 2>&1
mkdir "%DATA_DIR%\icons" >nul 2>&1
mkdir "%DATA_DIR%\profiles" >nul 2>&1
mkdir "%SCRIPT_DIR%assets" >nul 2>&1

:step2
echo.

:: ==========================================
:: Step 2: Ensure Node.js is available
:: ==========================================
:: Check portable node first
if exist "%LOCAL_NODE%" (
    echo [OK] Portable Node.js found
    set "NODE_CMD=%LOCAL_NODE%"
    goto :node_ready
)

:: Check system node
where node >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] System Node.js found
    for /f "tokens=*" %%v in ('node -v 2^>nul') do echo      Version: %%v
    set "NODE_CMD=node"
    goto :node_ready
)

:: Neither found - download portable
echo [SETUP] No Node.js found. Downloading portable version...
echo         (This only needs to happen once, about 30MB)
echo.
mkdir "%SCRIPT_DIR%node" >nul 2>&1
powershell -Command "$ProgressPreference='SilentlyContinue'; $url='https://nodejs.org/dist/v22.19.0/node-v22.19.0-win-x64.zip'; $zip='%SCRIPT_DIR%node\_node.zip'; Write-Host '[SETUP] Downloading...'; Invoke-WebRequest -Uri $url -OutFile $zip; Write-Host '[SETUP] Extracting...'; Expand-Archive -Path $zip -DestinationPath '%SCRIPT_DIR%node\_tmp' -Force; Get-ChildItem '%SCRIPT_DIR%node\_tmp\node-*' | ForEach-Object { Copy-Item (Join-Path $_.FullName 'node.exe') '%SCRIPT_DIR%node\node.exe' -Force }; Remove-Item '%SCRIPT_DIR%node\_tmp' -Recurse -Force; Remove-Item $zip -Force"

if exist "%LOCAL_NODE%" (
    echo [OK] Portable Node.js installed
    set "NODE_CMD=%LOCAL_NODE%"
    goto :node_ready
)

echo [ERROR] Download failed. Please check your internet connection.
echo         Or install Node.js manually from https://nodejs.org
pause
exit /b 1

:node_ready
echo.

:: ==========================================
:: Step 3: Stop existing dashboard server
:: ==========================================
:: Read configured port
set "DASH_PORT=1111"
if exist "%SCRIPT_DIR%port.conf" (
    set /p DASH_PORT=<"%SCRIPT_DIR%port.conf"
)

:: 3a: PID-based stop
if exist "%SCRIPT_DIR%.server.pid" (
    for /f "tokens=*" %%a in ('powershell -Command "try{(Get-Content '%SCRIPT_DIR%.server.pid' | ConvertFrom-Json).pid}catch{}" 2^>nul') do (
        set "OLD_PID=%%a"
    )
    if defined OLD_PID (
        powershell -Command "try{$p=Get-Process -Id !OLD_PID! -ErrorAction Stop;if($p.ProcessName -match 'node'){Stop-Process -Id !OLD_PID! -Force;Write-Host '[CLEANUP] Stopped old server (PID: !OLD_PID!)'}}catch{}"
    )
    del "%SCRIPT_DIR%.server.pid" >nul 2>&1
)

:: 3b: API-based stop (catches servers without PID file)
powershell -Command "try{Invoke-WebRequest -Uri 'http://127.0.0.1:!DASH_PORT!/api/shutdown' -Method POST -TimeoutSec 2 -ErrorAction Stop|Out-Null;Write-Host '[CLEANUP] Sent stop signal to port !DASH_PORT!'}catch{}" 2>nul
timeout /t 2 /nobreak >nul

:: ==========================================
:: Step 4: Register auto-start
:: ==========================================
:: 2026-09-01: register BOTH the Registry Run key AND the Startup folder shortcut
:: (previously only one, whichever succeeded first). Some antivirus products flag/remove
:: "a script silently launched at every login via wscript.exe" because it matches common
:: malware persistence patterns -- if that happens to ONE of the two methods, the other
:: still survives and the dashboard keeps auto-starting. See server.js's ensureAutoStart()
:: for the matching self-heal check that repairs either one if it goes missing later.
schtasks /delete /tn "DashboardStartPage" /f >nul 2>&1

echo [SETUP] Registering auto-start (2 methods, for redundancy)...
set "AUTOSTART_REG_OK=0"
set "AUTOSTART_SHORTCUT_OK=0"

reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "DashboardStartPage" /t REG_SZ /d "wscript.exe \"%VBS_PATH%\"" /f >nul 2>&1
if not errorlevel 1 set "AUTOSTART_REG_OK=1"

powershell -Command "$s=(New-Object -COM WScript.Shell).CreateShortcut('%SHORTCUT%');$s.TargetPath='wscript.exe';$s.Arguments='\"'+\"%VBS_PATH%\"+'\"';$s.WorkingDirectory='%SCRIPT_DIR%';$s.WindowStyle=7;$s.Save()" >nul 2>&1
if exist "%SHORTCUT%" set "AUTOSTART_SHORTCUT_OK=1"

if "!AUTOSTART_REG_OK!"=="1" (
    if "!AUTOSTART_SHORTCUT_OK!"=="1" (
        echo [OK] Auto-start registered via Registry + Startup shortcut ^(both^)
    ) else (
        echo [OK] Auto-start registered via Registry ^(shortcut method failed^)
    )
) else (
    if "!AUTOSTART_SHORTCUT_OK!"=="1" (
        echo [OK] Auto-start registered via Startup shortcut ^(registry method failed^)
    ) else (
        echo [WARN] Auto-start registration failed for both methods -- you can still start
        echo        the dashboard manually any time by double-clicking restart.bat
    )
)

:: Marker: tells THIS folder's server.js it is a real install, so its self-heal check
:: (ensureAutoStart in server.js) is allowed to repair auto-start for this folder if
:: it goes missing later. A folder without this marker (e.g. a second copy used only
:: for development) never touches Windows auto-start settings.
if "!AUTOSTART_REG_OK!"=="1" (
    echo installed> "%SCRIPT_DIR%.autostart-installed"
) else if "!AUTOSTART_SHORTCUT_OK!"=="1" (
    echo installed> "%SCRIPT_DIR%.autostart-installed"
)

:: ==========================================
:: Step 5: Start server
:: ==========================================
echo.
echo [SETUP] Starting server...
cd /d "%SCRIPT_DIR%"
powershell -WindowStyle Hidden -Command "Start-Process '!NODE_CMD!' -ArgumentList 'server.js' -WorkingDirectory '%SCRIPT_DIR%' -WindowStyle Hidden"

:: Wait for PID file
timeout /t 3 /nobreak >nul
set "ACTIVE_PORT="
if exist ".server.pid" (
    for /f "tokens=*" %%a in ('powershell -Command "try{(Get-Content '.server.pid' | ConvertFrom-Json).port}catch{}" 2^>nul') do (
        set "ACTIVE_PORT=%%a"
    )
)

:: ==========================================
:: Done
:: ==========================================
echo.
echo ============================================
echo   Setup Complete!
echo ============================================
echo.
if defined ACTIVE_PORT (
    echo   URL:        http://localhost:!ACTIVE_PORT!
) else (
    echo   URL:        http://localhost:!DASH_PORT!
)
echo   Auto-start: On login (no popup, no admin needed)
if "!NODE_CMD!"=="node" (
    echo   Node.js:    SYSTEM (using installed Node.js)
) else (
    echo   Node.js:    PORTABLE (fully independent)
)
echo.
echo   Your data is safe in the data\ folder.
echo   Re-running this setup will NEVER delete your data.
echo.
echo   To uninstall: run uninstall.bat
echo   To restart:   run restart.bat
echo   To change port: run set-port.bat
echo.
pause
