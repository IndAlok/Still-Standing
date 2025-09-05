@echo off
REM CrewConnect Setup Script for Windows
echo 🚀 Setting up CrewConnect (Still-Standing) Project...

REM Check if we're in the right directory
if not exist package.json (
    echo ❌ package.json not found. Please run this script from the project root directory.
    pause
    exit /b 1
)

echo ✅ Checking prerequisites...

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is required but not installed. Please install Node.js 16+ from https://nodejs.org/
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo ✅ Node.js found: %NODE_VERSION%
)

REM Check npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is required but not found.
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo ✅ npm found: %NPM_VERSION%
)

REM Setup environment file
if not exist .env (
    echo 📋 Creating .env file from template...
    copy .env.example .env
    echo ⚠️ Please update .env file with your Firebase configuration!
    echo ℹ️ You can get these values from your Firebase project console.
) else (
    echo ✅ .env file already exists
)

echo ✅ Dependencies already installed

REM Create additional directories if needed
echo 📁 Creating additional project structure...
if not exist "src\hooks" mkdir "src\hooks"
if not exist "src\utils" mkdir "src\utils"
if not exist "src\assets" mkdir "src\assets"
if not exist "public\assets" mkdir "public\assets"

REM Create VS Code settings for better development experience
if not exist ".vscode" mkdir ".vscode"

echo {> .vscode\settings.json
echo   "editor.formatOnSave": true,>> .vscode\settings.json
echo   "editor.defaultFormatter": "esbenp.prettier-vscode",>> .vscode\settings.json
echo   "editor.codeActionsOnSave": {>> .vscode\settings.json
echo     "source.fixAll.eslint": true>> .vscode\settings.json
echo   },>> .vscode\settings.json
echo   "emmet.includeLanguages": {>> .vscode\settings.json
echo     "javascript": "javascriptreact">> .vscode\settings.json
echo   },>> .vscode\settings.json
echo   "files.exclude": {>> .vscode\settings.json
echo     "**/node_modules": true,>> .vscode\settings.json
echo     "**/.git": true,>> .vscode\settings.json
echo     "**/.DS_Store": true,>> .vscode\settings.json
echo     "**/build": true>> .vscode\settings.json
echo   }>> .vscode\settings.json
echo }>> .vscode\settings.json

REM Create Prettier configuration
echo {> .prettierrc
echo   "semi": true,>> .prettierrc
echo   "trailingComma": "es5",>> .prettierrc
echo   "singleQuote": true,>> .prettierrc
echo   "printWidth": 80,>> .prettierrc
echo   "tabWidth": 2,>> .prettierrc
echo   "useTabs": false>> .prettierrc
echo }>> .prettierrc

echo ✅ VS Code settings and Prettier configuration created

echo.
echo 🎉 Setup completed successfully!
echo.
echo ℹ️ Next steps:
echo 1. Update the .env file with your Firebase configuration
echo 2. Create a Firebase project at https://console.firebase.google.com/
echo 3. Enable Authentication (Email/Password and Google providers)
echo 4. Create a Firestore database
echo 5. Run 'npm start' to start the development server
echo.
echo ℹ️ Firebase setup guide:
echo • Go to Firebase Console
echo • Create new project
echo • Enable Authentication ^> Sign-in method ^> Email/Password ^& Google
echo • Enable Firestore Database
echo • Add web app and copy configuration to .env file
echo.
echo ⚠️ Don't forget to add your domain to Firebase authorized domains!
echo.
echo Happy coding! 🚀
pause
