@echo off
echo Starting CrewConnect Backend Services...

REM Navigate to backend directory
cd /d "%~dp0Backend"

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not installed or not in PATH
    echo Please install Python 3.8 or later
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
if exist "requirements_parser.txt" (
    echo Installing Python dependencies...
    pip install -r requirements_parser.txt
) else (
    echo Installing basic dependencies...
    pip install flask flask-cors flask-sqlalchemy flask-jwt-extended flask-socketio python-dotenv redis pdfplumber python-docx google-generativeai pydantic
)

REM Check if .env file exists
if not exist ".env" (
    echo Creating .env configuration file...
    echo SECRET_KEY=dev-secret-key-change-in-production > .env
    echo JWT_SECRET_KEY=jwt-secret-key-change-in-production >> .env
    echo CORS_ORIGINS=http://localhost:3000 >> .env
    echo GEMINI_API_KEY=your_gemini_api_key_here >> .env
    echo FLASK_DEBUG=true >> .env
    echo PORT=5000 >> .env
    echo.
    echo ⚠️  .env file created with default values.
    echo    Please update GEMINI_API_KEY in .env file for AI resume parsing.
)

REM Initialize database
echo Initializing database...
python -c "from app import app, db; app.app_context().push(); db.create_all(); print('✅ Database initialized')"

echo.
echo 🚀 Starting Flask backend server...
echo    Backend will be available at: http://localhost:5000
echo    Health check: http://localhost:5000/api/health
echo    Resume parser: http://localhost:5000/api/parse-resume
echo.

REM Start the Flask application
python app.py

pause
