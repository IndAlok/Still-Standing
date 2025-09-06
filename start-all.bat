@echo off
title CrewConnect - Full Stack Startup
echo =====================================
echo    CrewConnect Full Stack Startup
echo =====================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org/
    pause
    exit /b 1
)

echo ✅ Node.js and Python are available

REM Set up frontend
echo.
echo 📦 Installing frontend dependencies...
npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)

REM Set up backend
echo.
echo 🐍 Setting up backend...
cd Backend

if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat

if exist "requirements_parser.txt" (
    pip install -r requirements_parser.txt
) else (
    pip install flask flask-cors flask-sqlalchemy flask-jwt-extended flask-socketio python-dotenv redis pdfplumber python-docx google-generativeai pydantic werkzeug
)

REM Initialize database
python -c "from app import app, db; app.app_context().push(); db.create_all(); print('✅ Database initialized')" 2>nul

cd ..

REM Apply CORS configuration (if gsutil is available)
echo.
echo 🌐 Checking Firebase Storage CORS...
gsutil version >nul 2>&1
if %errorlevel% equ 0 (
    echo Applying CORS configuration...
    gsutil cors set cors.json gs://crewconnect00.firebasestorage.app 2>nul
    if %errorlevel% equ 0 (
        echo ✅ CORS configuration applied
    ) else (
        echo ⚠️  CORS configuration failed - resumes will use fallback method
    )
) else (
    echo ⚠️  gsutil not found - CORS configuration skipped
    echo    Resumes will use data URL fallback method
)

echo.
echo 🚀 Starting services...
echo.
echo Frontend will be available at: http://localhost:3000
echo Backend will be available at: http://localhost:5000
echo.
echo To stop services, press Ctrl+C in both windows
echo.

REM Start backend in new window
start "CrewConnect Backend" cmd /c "cd Backend && call venv\Scripts\activate.bat && python app.py"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend
echo 🎨 Starting React frontend...
npm start

pause
