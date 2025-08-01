@echo off
echo === DFS Portal - Port Conflict Resolver ===
echo.

echo Checking for processes using port 8080...
netstat -ano | findstr :8080
if %errorlevel% equ 0 (
    echo.
    echo Found processes using port 8080. Attempting to resolve...
    
    echo.
    echo Option 1: Kill processes using port 8080
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8080') do (
        echo Killing process ID: %%a
        taskkill /PID %%a /F 2>nul
    )
    
    echo.
    echo Checking again...
    netstat -ano | findstr :8080
    if %errorlevel% neq 0 (
        echo ✅ Port 8080 is now free!
    ) else (
        echo ❌ Some processes still using port 8080
    )
) else (
    echo ✅ Port 8080 is available!
)

echo.
echo Starting development server...
npm run dev