@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo ============================================================================
echo   YouTube Premium (Tizen 3.0 Edition) - Samsung TV Installer
echo   Automatic Certificate Signer ^& Installer / Automaticka instalace do TV
echo ============================================================================
echo.

set "TIZEN_DIR=C:\tizen-studio"
if not exist "%TIZEN_DIR%\tools\sdb.exe" (
    set /p TIZEN_DIR="Enter Tizen Studio path / Zadejte cestu k Tizen Studio (default C:\tizen-studio): "
)

if not exist "%TIZEN_DIR%\tools\sdb.exe" (
    echo [ERROR / CHYBA] Not found / Nebyl nalezen: %TIZEN_DIR%\tools\sdb.exe!
    echo Please install Tizen Studio first (https://developer.tizen.org/development/tizen-studio/download).
    pause
    exit /b 1
)

:: Auto-detect active certificate profile from C:\tizen-studio-data\profile\profiles.xml
set "DETECTED_PROFILE="
for /f "usebackq delims=" %%P in (`powershell -NoProfile -Command "$p='C:\tizen-studio-data\profile\profiles.xml'; if (Test-Path $p) { [xml]$x = Get-Content $p; if ($x.profiles.active) { Write-Output $x.profiles.active } elseif ($x.profiles.profile.name) { Write-Output $x.profiles.profile[0].name } }"`) do (
    set "DETECTED_PROFILE=%%P"
)

if not "%DETECTED_PROFILE%"=="" (
    echo [INFO] Detected Tizen Certificate Profile / Nalezen certifikacni profil: %DETECTED_PROFILE%
    set /p CERT_PROFILE="Certificate profile name / Nazev certifikatu [%DETECTED_PROFILE%] (Press Enter to confirm): "
    if "!CERT_PROFILE!"=="" set "CERT_PROFILE=%DETECTED_PROFILE%"
) else (
    set /p CERT_PROFILE="Enter your Tizen Certificate Profile name / Zadejte nazev certifikacniho profilu: "
)

set /p TV_IP="Enter your Samsung TV IP address / Zadejte IP adresu Samsung TV (e.g. 192.168.1.50): "
if "%TV_IP%"=="" (
    echo [ERROR / CHYBA] TV IP address is required / Musite zadat IP adresu televize!
    pause
    exit /b 1
)

echo.
echo [1/4] Connecting to TV / Pripojuji se k televizi %TV_IP%:26101...
"%TIZEN_DIR%\tools\sdb.exe" connect %TV_IP%
if errorlevel 1 (
    echo [ERROR / CHYBA] Failed to connect to %TV_IP%. Ensure Developer Mode is ON on your TV.
    pause
    exit /b 1
)

echo.
echo [2/4] Building ^& signing YouTubePremium.wgt with certificate "%CERT_PROFILE%"...
set "PROJECT_DIR=%~dp0"
if "%PROJECT_DIR:~-1%"=="\" set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"

:: Build outside PROJECT_DIR (%TEMP%) so a .wgt can NEVER be nested inside the package
set "BUILD_DIR=%TEMP%\YouTubePremium_Tizen3_Build"
if exist "%BUILD_DIR%" rd /s /q "%BUILD_DIR%" 2>nul
mkdir "%BUILD_DIR%"
del /q "%PROJECT_DIR%\*.wgt" 2>nul
del /q "%PROJECT_DIR%\author-signature.xml" 2>nul
del /q "%PROJECT_DIR%\signature1.xml" 2>nul
del /q "%PROJECT_DIR%\.manifest.tmp" 2>nul

call "%TIZEN_DIR%\tools\ide\bin\tizen.bat" package -t wgt -s "%CERT_PROFILE%" -o "%BUILD_DIR%" -- "%PROJECT_DIR%"

:: Immediately clean temporary signature XMLs from project root
del /q "%PROJECT_DIR%\author-signature.xml" 2>nul
del /q "%PROJECT_DIR%\signature1.xml" 2>nul
del /q "%PROJECT_DIR%\.manifest.tmp" 2>nul

if not exist "%BUILD_DIR%\YouTubePremium.wgt" (
    echo [ERROR / CHYBA] Failed to build YouTubePremium.wgt. Check profile name "%CERT_PROFILE%".
    rd /s /q "%BUILD_DIR%" 2>nul
    pause
    exit /b 1
)

echo.
echo [3/4] Pushing YouTubePremium.wgt to TV / Nahravam do televize...
"%TIZEN_DIR%\tools\sdb.exe" -s %TV_IP%:26101 push "%BUILD_DIR%\YouTubePremium.wgt" "/home/owner/share/tmp/sdk_tools/tmp/YouTubePremium.wgt"

echo.
echo [4/4] Installing app on Samsung TV / Instaluji aplikaci do TV...
"%TIZEN_DIR%\tools\sdb.exe" -s %TV_IP%:26101 shell 0 vd_appinstall xvvl3S1bvH.TizenBrewStandalone /home/owner/share/tmp/sdk_tools/tmp/YouTubePremium.wgt

:: Clean up temporary .wgt both on PC and on TV after installation
rd /s /q "%BUILD_DIR%" 2>nul
"%TIZEN_DIR%\tools\sdb.exe" -s %TV_IP%:26101 shell 0 rm -f /home/owner/share/tmp/sdk_tools/tmp/YouTubePremium.wgt >nul 2>&1

echo.
echo ============================================================================
echo   DONE / HOTOVO! YouTubePremium is installed on your TV (Apps section).
echo   Temporary .wgt files were automatically cleaned up.
echo ============================================================================
pause
