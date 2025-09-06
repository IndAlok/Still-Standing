#!/usr/bin/env python3
"""
Complete Resume Parser with Gemini AI Integration
Comprehensive resume parsing and data extraction system
"""

import os
import re
import json
import logging
import tempfile
import traceback
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, asdict
from enum import Enum

import pdfplumber
import docx
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])

# Configuration
class Config:
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
    FLASK_DEBUG = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'
    PORT = int(os.getenv('PORT', 5000))
    UPLOAD_FOLDER = tempfile.gettempdir()
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'txt'}

# Data Models
class SkillLevel(Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"

@dataclass
class ContactInfo:
    email: Optional[str] = None
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    website: Optional[str] = None
    location: Optional[str] = None

@dataclass
class Education:
    degree: Optional[str] = None
    institution: Optional[str] = None
    graduation_year: Optional[str] = None
    gpa: Optional[str] = None
    major: Optional[str] = None
    minor: Optional[str] = None

@dataclass
class Experience:
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    duration: Optional[str] = None
    description: Optional[str] = None
    responsibilities: List[str] = None
    achievements: List[str] = None

@dataclass
class Skill:
    name: str
    category: Optional[str] = None
    level: Optional[SkillLevel] = None
    years_experience: Optional[int] = None

@dataclass
class Project:
    name: Optional[str] = None
    description: Optional[str] = None
    technologies: List[str] = None
    url: Optional[str] = None
    duration: Optional[str] = None

@dataclass
class Certification:
    name: Optional[str] = None
    issuer: Optional[str] = None
    date: Optional[str] = None
    expiry_date: Optional[str] = None
    credential_id: Optional[str] = None

@dataclass
class ResumeData:
    # Basic Information
    full_name: Optional[str] = None
    professional_title: Optional[str] = None
    summary: Optional[str] = None
    
    # Contact Information
    contact_info: Optional[ContactInfo] = None
    
    # Experience and Education
    experience: List[Experience] = None
    education: List[Education] = None
    
    # Skills and Competencies
    technical_skills: List[Skill] = None
    soft_skills: List[str] = None
    languages: List[str] = None
    
    # Additional Information
    projects: List[Project] = None
    certifications: List[Certification] = None
    awards: List[str] = None
    publications: List[str] = None
    
    # Metadata
    years_experience: Optional[int] = None
    career_level: Optional[str] = None
    industries: List[str] = None
    
    def __post_init__(self):
        """Initialize empty lists to avoid None values"""
        if self.experience is None:
            self.experience = []
        if self.education is None:
            self.education = []
        if self.technical_skills is None:
            self.technical_skills = []
        if self.soft_skills is None:
            self.soft_skills = []
        if self.languages is None:
            self.languages = []
        if self.projects is None:
            self.projects = []
        if self.certifications is None:
            self.certifications = []
        if self.awards is None:
            self.awards = []
        if self.publications is None:
            self.publications = []
        if self.industries is None:
            self.industries = []

# Initialize Gemini AI
def initialize_gemini():
    """Initialize Gemini AI with proper error handling"""
    if not Config.GEMINI_API_KEY or Config.GEMINI_API_KEY == 'YOUR_GEMINI_API_KEY':
        logger.warning("Gemini API key not configured. AI parsing will be unavailable.")
        return None
    
    try:
        genai.configure(api_key=Config.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-flash")
        logger.info("Gemini AI initialized successfully")
        return model
    except Exception as e:
        logger.error(f"Failed to initialize Gemini AI: {e}")
        return None

# Global AI model
gemini_model = initialize_gemini()

class ResumeParser:
    """Complete resume parsing system"""
    
    def __init__(self):
        self.model = gemini_model
    
    def extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF file"""
        try:
            text = ""
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            return text.strip()
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            raise
    
    def extract_text_from_docx(self, file_path: str) -> str:
        """Extract text from DOCX file"""
        try:
            doc = docx.Document(file_path)
            text = []
            for paragraph in doc.paragraphs:
                if paragraph.text.strip():
                    text.append(paragraph.text.strip())
            return "\n".join(text)
        except Exception as e:
            logger.error(f"Error extracting text from DOCX: {e}")
            raise
    
    def extract_text_from_txt(self, file_path: str) -> str:
        """Extract text from TXT file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                return file.read()
        except UnicodeDecodeError:
            # Try with different encoding
            with open(file_path, 'r', encoding='latin-1') as file:
                return file.read()
        except Exception as e:
            logger.error(f"Error extracting text from TXT: {e}")
            raise
    
    def extract_text(self, file_path: str, file_type: str) -> str:
        """Extract text from file based on type"""
        file_type = file_type.lower()
        
        if file_type == 'pdf' or file_path.endswith('.pdf'):
            return self.extract_text_from_pdf(file_path)
        elif file_type in ['doc', 'docx'] or file_path.endswith(('.doc', '.docx')):
            return self.extract_text_from_docx(file_path)
        elif file_type == 'txt' or file_path.endswith('.txt'):
            return self.extract_text_from_txt(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")
    
    def parse_with_gemini(self, resume_text: str) -> Dict[str, Any]:
        """Parse resume using Gemini AI with comprehensive prompt"""
        if not self.model:
            raise Exception("Gemini AI model not available")
        
        prompt = f"""
        Parse the following resume text and extract ALL relevant information in JSON format. 
        Be thorough and comprehensive in your extraction. Extract even partial or implied information.

        RESUME TEXT:
        {resume_text}

        Please extract the following information and return as valid JSON:

        {{
            "full_name": "Full name of the person",
            "professional_title": "Current job title or desired position",
            "summary": "Professional summary or objective",
            
            "contact_info": {{
                "email": "Email address",
                "phone": "Phone number",
                "linkedin": "LinkedIn profile URL",
                "github": "GitHub profile URL",
                "website": "Personal website URL",
                "location": "Current location (city, state, country)"
            }},
            
            "experience": [
                {{
                    "title": "Job title",
                    "company": "Company name",
                    "location": "Job location",
                    "start_date": "Start date (MM/YYYY format if possible)",
                    "end_date": "End date or 'Present'",
                    "duration": "Duration of employment",
                    "description": "Overall job description",
                    "responsibilities": ["List of key responsibilities"],
                    "achievements": ["List of achievements and accomplishments"]
                }}
            ],
            
            "education": [
                {{
                    "degree": "Degree type (Bachelor's, Master's, etc.)",
                    "institution": "School/University name",
                    "graduation_year": "Graduation year",
                    "gpa": "GPA if mentioned",
                    "major": "Major field of study",
                    "minor": "Minor field of study if any"
                }}
            ],
            
            "technical_skills": [
                {{
                    "name": "Skill name",
                    "category": "Category (Programming, Databases, Tools, etc.)",
                    "level": "beginner/intermediate/advanced/expert",
                    "years_experience": "Estimated years of experience with this skill"
                }}
            ],
            
            "soft_skills": ["List of soft skills like leadership, communication, etc."],
            "languages": ["List of spoken languages"],
            
            "projects": [
                {{
                    "name": "Project name",
                    "description": "Project description",
                    "technologies": ["Technologies used"],
                    "url": "Project URL if available",
                    "duration": "Project duration"
                }}
            ],
            
            "certifications": [
                {{
                    "name": "Certification name",
                    "issuer": "Issuing organization",
                    "date": "Date obtained",
                    "expiry_date": "Expiry date if applicable",
                    "credential_id": "Credential ID if mentioned"
                }}
            ],
            
            "awards": ["List of awards and honors"],
            "publications": ["List of publications or papers"],
            
            "years_experience": "Total years of professional experience (number)",
            "career_level": "junior/mid/senior/executive",
            "industries": ["List of industries the person has worked in"]
        }}

        IMPORTANT:
        1. Return ONLY valid JSON, no explanations or additional text
        2. If information is not available, use null for strings/objects or empty arrays []
        3. Extract as much information as possible, even if it seems incomplete
        4. For dates, try to standardize to MM/YYYY format
        5. For skills, try to infer experience levels from context
        6. Be comprehensive - don't miss any details
        """
        
        try:
            response = self.model.generate_content(prompt)
            result_text = response.text.strip()
            
            # Clean up the response to ensure valid JSON
            if result_text.startswith('```json'):
                result_text = result_text[7:]
            if result_text.endswith('```'):
                result_text = result_text[:-3]
            
            result_text = result_text.strip()
            
            # Parse JSON
            parsed_data = json.loads(result_text)
            logger.info("Successfully parsed resume with Gemini AI")
            return parsed_data
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {e}")
            logger.error(f"Response text: {result_text[:500]}...")
            raise Exception(f"Failed to parse AI response as JSON: {e}")
        except Exception as e:
            logger.error(f"Gemini AI parsing error: {e}")
            raise Exception(f"AI parsing failed: {e}")
    
    def fallback_parse(self, resume_text: str) -> Dict[str, Any]:
        """Fallback parsing using regex patterns"""
        logger.info("Using fallback regex parsing")
        
        data = {
            "full_name": self.extract_name(resume_text),
            "contact_info": self.extract_contact_info(resume_text),
            "technical_skills": self.extract_skills(resume_text),
            "experience": self.extract_basic_experience(resume_text),
            "education": self.extract_basic_education(resume_text),
            "soft_skills": [],
            "languages": [],
            "projects": [],
            "certifications": [],
            "awards": [],
            "publications": [],
            "years_experience": None,
            "career_level": None,
            "industries": []
        }
        
        return data
    
    def extract_name(self, text: str) -> Optional[str]:
        """Extract name using regex patterns"""
        lines = text.split('\n')
        for line in lines[:5]:  # Check first 5 lines
            line = line.strip()
            if len(line) > 3 and len(line.split()) >= 2:
                # Simple heuristic: if it looks like a name
                words = line.split()
                if all(word.replace('-', '').replace("'", "").isalpha() for word in words):
                    return line
        return None
    
    def extract_contact_info(self, text: str) -> Dict[str, Optional[str]]:
        """Extract contact information using regex"""
        contact = {
            "email": None,
            "phone": None,
            "linkedin": None,
            "github": None,
            "website": None,
            "location": None
        }
        
        # Email
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        email_match = re.search(email_pattern, text)
        if email_match:
            contact["email"] = email_match.group()
        
        # Phone
        phone_pattern = r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
        phone_match = re.search(phone_pattern, text)
        if phone_match:
            contact["phone"] = phone_match.group()
        
        # LinkedIn
        linkedin_pattern = r'linkedin\.com/in/[\w-]+'
        linkedin_match = re.search(linkedin_pattern, text, re.IGNORECASE)
        if linkedin_match:
            contact["linkedin"] = f"https://{linkedin_match.group()}"
        
        # GitHub
        github_pattern = r'github\.com/[\w-]+'
        github_match = re.search(github_pattern, text, re.IGNORECASE)
        if github_match:
            contact["github"] = f"https://{github_match.group()}"
        
        return contact
    
    def extract_skills(self, text: str) -> List[Dict[str, Any]]:
        """Extract technical skills"""
        common_skills = [
            'Python', 'JavaScript', 'Java', 'C++', 'C#', 'React', 'Node.js',
            'HTML', 'CSS', 'SQL', 'MongoDB', 'PostgreSQL', 'MySQL',
            'AWS', 'Docker', 'Kubernetes', 'Git', 'Linux', 'Windows'
        ]
        
        found_skills = []
        text_lower = text.lower()
        
        for skill in common_skills:
            if skill.lower() in text_lower:
                found_skills.append({
                    "name": skill,
                    "category": "technical",
                    "level": None,
                    "years_experience": None
                })
        
        return found_skills
    
    def extract_basic_experience(self, text: str) -> List[Dict[str, Any]]:
        """Extract basic work experience"""
        # This is a simplified extraction
        return []
    
    def extract_basic_education(self, text: str) -> List[Dict[str, Any]]:
        """Extract basic education information"""
        # This is a simplified extraction
        return []
    
    def parse_resume(self, file_path: str, file_type: str) -> Dict[str, Any]:
        """Main parsing function"""
        try:
            # Extract text from file
            logger.info(f"Extracting text from {file_type} file")
            resume_text = self.extract_text(file_path, file_type)
            
            if not resume_text.strip():
                raise Exception("No text could be extracted from the resume")
            
            logger.info(f"Extracted {len(resume_text)} characters from resume")
            
            # Try AI parsing first
            if self.model:
                try:
                    logger.info("Attempting AI parsing with Gemini")
                    parsed_data = self.parse_with_gemini(resume_text)
                    
                    # Create ResumeData object to validate structure
                    resume_data = ResumeData(**parsed_data)
                    
                    return {
                        "success": True,
                        "data": asdict(resume_data),
                        "method": "gemini_ai",
                        "text_length": len(resume_text),
                        "timestamp": datetime.now().isoformat()
                    }
                except Exception as e:
                    logger.error(f"AI parsing failed: {e}")
                    logger.info("Falling back to regex parsing")
            
            # Fallback to regex parsing
            parsed_data = self.fallback_parse(resume_text)
            resume_data = ResumeData(**parsed_data)
            
            return {
                "success": True,
                "data": asdict(resume_data),
                "method": "regex_fallback",
                "text_length": len(resume_text),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Resume parsing failed: {e}")
            logger.error(traceback.format_exc())
            return {
                "success": False,
                "error": str(e),
                "method": "failed",
                "timestamp": datetime.now().isoformat()
            }

# Global parser instance
parser = ResumeParser()

# Utility functions
def allowed_file(filename: str) -> bool:
    """Check if file type is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS

def save_uploaded_file(file) -> str:
    """Save uploaded file and return path"""
    if not file or not file.filename:
        raise ValueError("No file provided")
    
    if not allowed_file(file.filename):
        raise ValueError(f"File type not supported. Allowed: {Config.ALLOWED_EXTENSIONS}")
    
    filename = secure_filename(file.filename)
    if not filename:
        raise ValueError("Invalid filename")
    
    filepath = os.path.join(Config.UPLOAD_FOLDER, filename)
    file.save(filepath)
    return filepath

# API Routes
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "2.0.0",
        "gemini_available": gemini_model is not None
    })

@app.route('/api/parse-resume', methods=['POST'])
def parse_resume_endpoint():
    """Parse uploaded resume file and optionally populate user profile"""
    try:
        # Check if file is in request
        if 'resume' not in request.files:
            return jsonify({
                "success": False,
                "error": "No resume file provided"
            }), 400
        
        file = request.files['resume']
        if not file or not file.filename:
            return jsonify({
                "success": False,
                "error": "No file selected"
            }), 400
        
        # Get optional parameters
        user_id = request.form.get('userId')
        populate_profile = request.form.get('populateProfile', 'false').lower() == 'true'
        
        logger.info(f"Processing resume upload: {file.filename}")
        if populate_profile and user_id:
            logger.info(f"Will populate profile for user: {user_id}")
        
        # Save uploaded file
        file_path = save_uploaded_file(file)
        file_type = file.filename.rsplit('.', 1)[1].lower()
        
        try:
            # Parse the resume
            result = parser.parse_resume(file_path, file_type)
            
            # Clean up uploaded file
            if os.path.exists(file_path):
                os.remove(file_path)
            
            if result["success"]:
                logger.info(f"Successfully parsed resume using {result['method']}")
                
                # If profile population is requested and user_id is provided
                if populate_profile and user_id:
                    try:
                        # Call AI matchmaker service to populate profile
                        import requests
                        
                        populate_data = {
                            'resumeData': result['data'],
                            'userId': user_id,
                            'existingProfile': {}  # Could be passed from frontend
                        }
                        
                        # Call the profile population service
                        response = requests.post(
                            'http://localhost:5001/api/profile/populate',
                            json=populate_data,
                            timeout=30
                        )
                        
                        if response.ok:
                            profile_result = response.json()
                            result['profile_populated'] = True
                            result['profile_data'] = profile_result.get('profile', {})
                            result['profile_completeness'] = profile_result.get('completeness', 0)
                            logger.info(f"Profile populated successfully. Completeness: {result['profile_completeness']}%")
                        else:
                            logger.warning(f"Profile population failed: {response.text}")
                            result['profile_populated'] = False
                            result['profile_error'] = f"Population service error: {response.status_code}"
                            
                    except Exception as profile_error:
                        logger.error(f"Profile population error: {profile_error}")
                        result['profile_populated'] = False
                        result['profile_error'] = str(profile_error)
                
                return jsonify(result)
            else:
                logger.error(f"Failed to parse resume: {result.get('error')}")
                return jsonify(result), 500
                
        except Exception as e:
            # Clean up file on error
            if os.path.exists(file_path):
                os.remove(file_path)
            raise
            
    except Exception as e:
        logger.error(f"Resume parsing endpoint error: {e}")
        logger.error(traceback.format_exc())
        return jsonify({
            "success": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/api/parse-text', methods=['POST'])
def parse_text_endpoint():
    """Parse resume from text input"""
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({
                "success": False,
                "error": "No text provided"
            }), 400
        
        resume_text = data['text'].strip()
        if not resume_text:
            return jsonify({
                "success": False,
                "error": "Empty text provided"
            }), 400
        
        logger.info(f"Processing text input: {len(resume_text)} characters")
        
        # Create temporary file for parsing
        temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False)
        temp_file.write(resume_text)
        temp_file.close()
        
        try:
            result = parser.parse_resume(temp_file.name, 'txt')
            
            # Clean up temp file
            os.unlink(temp_file.name)
            
            if result["success"]:
                logger.info(f"Successfully parsed text using {result['method']}")
                return jsonify(result)
            else:
                logger.error(f"Failed to parse text: {result.get('error')}")
                return jsonify(result), 500
                
        except Exception as e:
            # Clean up temp file on error
            if os.path.exists(temp_file.name):
                os.unlink(temp_file.name)
            raise
            
    except Exception as e:
        logger.error(f"Text parsing endpoint error: {e}")
        logger.error(traceback.format_exc())
        return jsonify({
            "success": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

@app.errorhandler(413)
def file_too_large(error):
    """Handle file too large error"""
    return jsonify({
        "success": False,
        "error": f"File too large. Maximum size is {Config.MAX_FILE_SIZE // (1024*1024)}MB"
    }), 413

@app.errorhandler(Exception)
def handle_exception(error):
    """Global error handler"""
    logger.error(f"Unhandled exception: {error}")
    logger.error(traceback.format_exc())
    return jsonify({
        "success": False,
        "error": "Internal server error",
        "timestamp": datetime.now().isoformat()
    }), 500

if __name__ == '__main__':
    # Create upload directory
    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
    
    # Log startup information
    logger.info("=" * 50)
    logger.info("COMPLETE RESUME PARSER STARTING")
    logger.info("=" * 50)
    logger.info(f"Port: {Config.PORT}")
    logger.info(f"Debug Mode: {Config.FLASK_DEBUG}")
    logger.info(f"Gemini AI Available: {gemini_model is not None}")
    logger.info(f"Upload Folder: {Config.UPLOAD_FOLDER}")
    logger.info(f"Max File Size: {Config.MAX_FILE_SIZE // (1024*1024)}MB")
    logger.info(f"Allowed Extensions: {Config.ALLOWED_EXTENSIONS}")
    logger.info("=" * 50)
    
    # Start the Flask application
    app.run(
        host='0.0.0.0',
        port=Config.PORT,
        debug=Config.FLASK_DEBUG
    )
