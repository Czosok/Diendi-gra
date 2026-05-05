@echo off
:: D&D 5e RPG - Auto Launcher (Windows)
:: Run this .bat file to start both client and server

echo 🎲 D&D 5e Tabletop RPG - Starting...

cd /d "%~dp0"

:: Check if node_modules exist
if not exist "server\node_modules" (
    echo 📦 Installing server dependencies...
    cd server && call npm install && cd ..
)

if not exist "client\node_modules" (
    echo 📦 Installing client dependencies...
    cd client && call npm install && cd ..
)

:: Build client
echo 🏗️ Building client...
cd client && call npm run build && cd ..

:: Start server in background
echo Starting server...
start /b cmd /c "cd /d "%~dp0server" && node index.js"

timeout /t 3 /nobreak > nul

echo Server started on port 3001
echo ✅ Client built to static files
echo.
echo 🎮 Open http://localhost:3001 in your browser!
echo.
pause