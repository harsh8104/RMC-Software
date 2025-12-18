@echo off
echo ========================================
echo  Building Windows Installer
echo  Vasudevnarayan RMC Infra
echo ========================================
echo.

echo [1/4] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b %errorlevel%
)

echo.
echo [2/4] Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo.
echo [3/4] Building React frontend...
cd frontend
call npm run build
cd ..

if not exist "frontend\build" (
    echo ERROR: Frontend build failed
    pause
    exit /b 1
)

echo.
echo [4/4] Creating Windows installer...
call npm run pack

if %errorlevel% neq 0 (
    echo ERROR: Failed to create installer
    pause
    exit /b %errorlevel%
)

echo.
echo ========================================
echo  BUILD SUCCESSFUL!
echo ========================================
echo.
echo Installer location: dist\VDN-RMC-Setup-1.0.0.exe
echo.
pause
