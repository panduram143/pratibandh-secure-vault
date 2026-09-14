@echo off
echo Starting MongoDB Service...
echo.

REM Try to start MongoDB service
net start MongoDB

if %errorlevel% equ 0 (
    echo MongoDB service started successfully!
    echo You can now run the backend server.
) else (
    echo.
    echo MongoDB service could not be started automatically.
    echo Please ensure MongoDB is installed and try one of these:
    echo.
    echo Option 1: Start MongoDB service manually
    echo    net start MongoDB
    echo.
    echo Option 2: Run mongod directly
    echo    "C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe" --dbpath="C:\data\db"
    echo.
)

pause
