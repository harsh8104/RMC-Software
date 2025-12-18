@echo off
echo ========================================
echo  Vasudevnarayan RMC Infra Desktop App
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
echo [2/4] Checking frontend build...
if not exist "frontend\build" (
    echo Frontend not built. Building now...
    cd frontend
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install frontend dependencies
        cd ..
        pause
        exit /b %errorlevel%
    )
    call npm run build
    if %errorlevel% neq 0 (
        echo ERROR: Failed to build frontend
        cd ..
        pause
        exit /b %errorlevel%
    )
    cd ..
    echo Frontend built successfully!
) else (
    echo Frontend already built. Skipping...
)

echo.
echo [3/4] Installing Electron...
echo.

echo.
echo [4/4] Starting Desktop Application...
echo.
call npm run electron:start

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to start application
    echo.
    echo Troubleshooting:
    echo 1. Make sure backend\.env file exists
    echo 2. Check MongoDB connection
    echo 3. Ensure port 5000 is available
    echo.
    pause
    exit /b %errorlevel%
)
