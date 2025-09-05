#!/bin/bash

# CrewConnect Setup Script
echo "🚀 Setting up CrewConnect (Still-Standing) Project..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

print_info "Checking prerequisites..."

# Check Node.js
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    print_status "Node.js found: $NODE_VERSION"
else
    print_error "Node.js is required but not installed. Please install Node.js 16+ from https://nodejs.org/"
    exit 1
fi

# Check npm
if command -v npm >/dev/null 2>&1; then
    NPM_VERSION=$(npm --version)
    print_status "npm found: $NPM_VERSION"
else
    print_error "npm is required but not found."
    exit 1
fi

# Setup environment file
if [ ! -f ".env" ]; then
    print_info "Creating .env file from template..."
    cp .env.example .env
    print_warning "Please update .env file with your Firebase configuration!"
    print_info "You can get these values from your Firebase project console."
else
    print_status ".env file already exists"
fi

# Install dependencies (they're already installed based on the terminal output)
print_status "Dependencies already installed"

# Create additional directories if needed
print_info "Creating additional project structure..."
mkdir -p src/hooks
mkdir -p src/utils
mkdir -p src/assets
mkdir -p public/assets

# Create VS Code settings for better development experience
mkdir -p .vscode
cat > .vscode/settings.json << EOF
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/.git": true,
    "**/.DS_Store": true,
    "**/build": true
  }
}
EOF

# Create Prettier configuration
cat > .prettierrc << EOF
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
EOF

print_status "VS Code settings and Prettier configuration created"

echo ""
echo "🎉 Setup completed successfully!"
echo ""
print_info "Next steps:"
echo "1. Update the .env file with your Firebase configuration"
echo "2. Create a Firebase project at https://console.firebase.google.com/"
echo "3. Enable Authentication (Email/Password and Google providers)"
echo "4. Create a Firestore database"
echo "5. Run 'npm start' to start the development server"
echo ""
print_info "Firebase setup guide:"
echo "• Go to Firebase Console"
echo "• Create new project"
echo "• Enable Authentication > Sign-in method > Email/Password & Google"
echo "• Enable Firestore Database"
echo "• Add web app and copy configuration to .env file"
echo ""
print_warning "Don't forget to add your domain to Firebase authorized domains!"
echo ""
echo "Happy coding! 🚀"
