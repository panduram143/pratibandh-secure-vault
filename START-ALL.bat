@echo off
echo ============================================
echo   PRATIBANDH - Complete Application Launcher
echo ============================================
echo.

cd /d "%~dp0"

echo [1/2] Starting Backend Server...
start "PRATIBANDH Backend" cmd /k "cd /d "%~dp0server" && npm run dev"
timeout /t 2 >nul

echo   ✓ Backend server starting on http://localhost:5000
echo.

echo [2/2] Starting Frontend Client...
start "PRATIBANDH Frontend" cmd /k "cd /d "%~dp0client" && npm run dev"

echo   ✓ Frontend client starting on http://localhost:3000
echo.
echo ============================================
echo   PRATIBANDH is launching!
echo ============================================
echo.
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:3000
echo.
echo   Open your browser at: http://localhost:3000
echo ============================================
pause
