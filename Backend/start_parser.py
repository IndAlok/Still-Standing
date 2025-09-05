#!/usr/bin/env python3
"""
Resume Parser Backend Server Startup Script
"""

import os
import sys
import subprocess
from pathlib import Path

def install_requirements():
    """Install Python requirements"""
    requirements_file = Path(__file__).parent / "requirements_parser.txt"
    
    if requirements_file.exists():
        print("📦 Installing Python dependencies...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", str(requirements_file)])
            print("✅ Dependencies installed successfully!")
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install dependencies: {e}")
            return False
    else:
        print("⚠️ Requirements file not found, skipping dependency installation")
    
    return True

def setup_environment():
    """Setup environment variables"""
    env_file = Path(__file__).parent / ".env"
    
    if not env_file.exists():
        print("🔑 Creating .env file for configuration...")
        env_content = """
# Resume Parser Configuration
GEMINI_API_KEY=your_gemini_api_key_here
FLASK_DEBUG=false
PORT=5000

# Add your Gemini API key above to enable AI-powered resume parsing
# Without it, the system will use fallback heuristic parsing
"""
        with open(env_file, 'w') as f:
            f.write(env_content.strip())
        
        print("✅ Created .env file. Please add your Gemini API key for AI parsing.")
    
    # Load environment variables
    try:
        from dotenv import load_dotenv
        load_dotenv(env_file)
        print("🔑 Environment variables loaded")
    except ImportError:
        print("⚠️ python-dotenv not installed, using system environment")

def start_server():
    """Start the Flask server"""
    print("🚀 Starting Resume Parser server...")
    
    try:
        # Import and run the optimized resume parser
        from resume_parser_optimized import app
        
        port = int(os.getenv('PORT', 5000))
        debug = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'
        
        print(f"📍 Server starting on http://localhost:{port}")
        print("📄 Resume parsing endpoints available:")
        print(f"   - POST http://localhost:{port}/api/parse-resume (file upload)")
        print(f"   - POST http://localhost:{port}/api/parse-text (text input)")
        print(f"   - GET  http://localhost:{port}/api/health (health check)")
        print("\n🔧 Press Ctrl+C to stop the server")
        
        app.run(host='0.0.0.0', port=port, debug=debug)
        
    except ImportError as e:
        print(f"❌ Failed to import resume parser: {e}")
        print("📦 Make sure all dependencies are installed")
        return False
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
        return True
    except Exception as e:
        print(f"❌ Server error: {e}")
        return False

def main():
    """Main startup function"""
    print("🎯 Resume Parser Backend Server")
    print("=" * 40)
    
    # Change to backend directory
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    
    # Install dependencies
    if not install_requirements():
        print("❌ Failed to set up dependencies")
        return 1
    
    # Setup environment
    setup_environment()
    
    # Start server
    if not start_server():
        print("❌ Server failed to start")
        return 1
    
    return 0

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
