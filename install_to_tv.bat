@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo ============================================================================
echo   YouTube Premium (Tizen 3.0 Edition) - Automaticka instalace do Samsung TV
echo   Automatic Installer & Certificate Signer for Samsung Tizen TVs
echo ============================================================================
echo.

set "TIZEN_DIR=C:\tizen-studio"
if not exist "%TIZEN_DIR%\tools\sdb.exe" (
    set /p TIZEN_DIR="Zadejte cestu k Tizen Studio (default C:\tizen-studio): "
)

if not exist "%TIZEN_DIR%\tools\sdb.exe" (
    echo [CHYBA / ERROR] Nebyl nalezen %TIZEN_DIR%\tools\sdb.exe!
    echo Nainstalujte nejdrive Tizen Studio (https://developer.tizen.org/development/tizen-studio/download).
    pause
    exit /b 1
)

:: Auto-detect active certificate profile from C:\tizen-studio-data\profile\profiles.xml
set "DETECTED_PROFILE="
for /f "usebackq delims=" %%P in (`powershell -NoProfile -Command "$p='C:\tizen-studio-data\profile\profiles.xml'; if (Test-Path $p) { [xml]$x = Get-Content $p; if ($x.profiles.active) { Write-Output $x.profiles.active } elseif ($x.profiles.profile.name) { Write-Output $x.profiles.profile[0].name } }"`) do (
    set "DETECTED_PROFILE=%%P"
)

if not "%DETECTED_PROFILE%"=="" (
    echo [INFO] Nalezen certifikacni profil v Tizen Studiu: %DETECTED_PROFILE%
    set /p CERT_PROFILE="Nazev vaseho certifikatu [%DETECTED_PROFILE%] (stisknete Enter pro potvrzeni): "
    if "!CERT_PROFILE!"=="" set "CERT_PROFILE=%DETECTED_PROFILE%"
) else (
    set /p CERT_PROFILE="Zadejte nazev vaseho certifikacniho profilu v Tizen Certificate Manageru: "
)

set /p TV_IP="Zadejte IP adresu vasi Samsung TV (napr. 192.168.1.50): "
if "%TV_IP%"=="" (
    echo [CHYBA / ERROR] Musite zadat IP adresu televize!
    pause
    exit /b 1
)

echo.
echo [1/4] Pripojuji se k televizi %TV_IP%:26101...
"%TIZEN_DIR%\tools\sdb.exe" connect %TV_IP%
if errorlevel 1 (
    echo [CHYBA] Nepodarilo se pripojit k %TV_IP%. Zkontrolujte, ze je v TV zapnuty Developer Mode a TV je zapnuta.
    pause
    exit /b 1
)

echo.
echo [2/4] Sestavuji a podepisuji balicek YouTubePremium.wgt certifikatem "%CERT_PROFILE%"...
set "PROJECT_DIR=%~dp0"
if "%PROJECT_DIR:~-1%"=="\" set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"
set "BUILD_DIR=%PROJECT_DIR%\build"
if not exist "%BUILD_DIR%" mkdir "%BUILD_DIR%"
del /q "%BUILD_DIR%\*.wgt" 2>nul
del /q "%PROJECT_DIR%\*.wgt" 2>nul

call "%TIZEN_DIR%\tools\ide\bin\tizen.bat" package -t wgt -s "%CERT_PROFILE%" -o "%BUILD_DIR%" -- "%PROJECT_DIR%"
if not exist "%BUILD_DIR%\YouTubePremium.wgt" (
    echo [CHYBA / ERROR] Nepodarilo se vytvorit YouTubePremium.wgt. Zkontrolujte nazev profilu "%CERT_PROFILE%".
    pause
    exit /b 1
)

:: Clean temporary personal signature XMLs from project root so Git stays clean
del /q "%PROJECT_DIR%\author-signature.xml" 2>nul
del /q "%PROJECT_DIR%\signature1.xml" 2>nul
del /q "%PROJECT_DIR%\.manifest.tmp" 2>nul

echo.
echo [3/4] Nahravam YouTubePremium.wgt do televize...
"%TIZEN_DIR%\tools\sdb.exe" -s %TV_IP%:26101 push "%BUILD_DIR%\YouTubePremium.wgt" "/home/owner/share/tmp/sdk_tools/tmp/YouTubePremium.wgt"

echo.
echo [4/4] Instaluji aplikaci do Samsung TV...
"%TIZEN_DIR%\tools\sdb.exe" -s %TV_IP%:26101 shell 0 vd_appinstall xvvl3S1bvH.TizenBrewStandalone /home/owner/share/tmp/sdk_tools/tmp/YouTubePremium.wgt

echo.
echo ============================================================================
echo   HOTOVO! Aplikace YouTubePremium je nainstalovana v televizi (sekce Apps).
echo ============================================================================
pause
