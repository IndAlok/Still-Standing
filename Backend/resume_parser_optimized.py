#!/usr/bin/env python3
"""
Optimized Resume Parser with Flask API
High-performance resume parsing with Gemini AI and fallback heuristics
"""

import os
import re
import json
import logging
import tempfile
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
from typing import List, Dict, Optional, Any

import pdfplumber
import docx
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import google.generativeai as genai
from pydantic import BaseModel, ValidationError

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Configure Gemini AI
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', 'YOUR_GEMINI_API_KEY')  # Set your API key
if GEMINI_API_KEY and GEMINI_API_KEY != 'YOUR_GEMINI_API_KEY':
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-1.5-flash")
else:
    model = None
    logger.warning("Gemini API key not configured. Using fallback parsing only.")

# Configuration
UPLOAD_FOLDER = tempfile.gettempdir()
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# Data Models
class ResumeData(BaseModel):
    name: Optional[str] = "Unknown"
    email: Optional[str] = None
    location: Optional[str] = None
    experience_level: Optional[str] = "Beginner"
    domains: List[str] = []
    skills: List[str] = []
    companies: List[str] = []
    years_of_experience: Optional[float] = 0.0

class ParseResponse(BaseModel):
    success: bool
    data: Optional[ResumeData] = None
    error: Optional[str] = None
    processing_time: Optional[float] = None

# Enhanced skill mapping for better domain classification
SKILL_DOMAIN_MAP = {
    'Web Development': [
        'html', 'css', 'javascript', 'react', 'angular', 'vue', 'node',
        'express', 'next', 'nuxt', 'svelte', 'typescript', 'webpack',
        'redux', 'mobx', 'sass', 'less', 'tailwind', 'bootstrap'
    ],
    'Mobile Development': [
        'flutter', 'dart', 'kotlin', 'swift', 'java', 'android', 'ios',
        'react native', 'xamarin', 'ionic', 'cordova', 'phonegap'
    ],
    'AI/ML': [
        'machine learning', 'ml', 'ai', 'artificial intelligence',
        'tensorflow', 'pytorch', 'scikit', 'sklearn', 'pandas', 'numpy',
        'keras', 'nlp', 'computer vision', 'deep learning', 'neural networks',
        'data science', 'data analysis', 'statistics', 'r programming',
        'jupyter', 'matplotlib', 'seaborn', 'opencv'
    ],
    'Cloud & DevOps': [
        'aws', 'amazon web services', 'gcp', 'google cloud', 'azure',
        'docker', 'kubernetes', 'k8s', 'jenkins', 'ci/cd', 'ansible',
        'terraform', 'vagrant', 'linux', 'ubuntu', 'centos', 'nginx'
    ],
    'Backend Development': [
        'python', 'java', 'c#', 'php', 'ruby', 'go', 'rust', 'scala',
        'django', 'flask', 'spring', 'laravel', 'rails', 'asp.net',
        'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
        'api', 'rest', 'graphql', 'microservices'
    ],
    'Data Engineering': [
        'spark', 'hadoop', 'kafka', 'airflow', 'etl', 'data pipeline',
        'big data', 'hive', 'pig', 'cassandra', 'snowflake', 'databricks'
    ]
}

def allowed_file(filename: str) -> bool:
    """Check if file has allowed extension"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from PDF file"""
    try:
        text = ""
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += " " + page_text
        return clean_text(text)
    except Exception as e:
        logger.error(f"Error extracting PDF text: {e}")
        return ""

def extract_text_from_docx(file_path: str) -> str:
    """Extract text from DOCX file"""
    try:
        doc = docx.Document(file_path)
        text = ""
        for paragraph in doc.paragraphs:
            text += " " + paragraph.text
        return clean_text(text)
    except Exception as e:
        logger.error(f"Error extracting DOCX text: {e}")
        return ""

def extract_text_from_doc(file_path: str) -> str:
    """Extract text from DOC file (basic implementation)"""
    try:
        # For DOC files, we'd need python-docx2txt or similar
        # For now, return empty string
        logger.warning("DOC file support limited. Please convert to DOCX or PDF.")
        return ""
    except Exception as e:
        logger.error(f"Error extracting DOC text: {e}")
        return ""

def clean_text(text: str) -> str:
    """Clean and normalize text"""
    if not text:
        return ""
    
    # Remove extra whitespace and normalize
    text = re.sub(r'\s+', ' ', text.strip())
    text = re.sub(r'[^\w\s@.\-+()#]', ' ', text)
    
    return text

def extract_email(text: str) -> Optional[str]:
    """Extract email address from text"""
    if not text:
        return None
    
    # Handle common email obfuscation
    text = text.replace('(dot)', '.').replace(' dot ', '.').replace('[dot]', '.')
    text = text.replace('(at)', '@').replace(' at ', '@').replace('[at]', '@')
    
    # Email regex pattern
    pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    matches = re.findall(pattern, text, re.IGNORECASE)
    
    if matches:
        return matches[0].lower()
    
    return None

def extract_phone(text: str) -> Optional[str]:
    """Extract phone number from text"""
    if not text:
        return None
    
    # Phone number patterns
    patterns = [
        r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',  # US format
        r'\+\d{1,3}[-.\s]?\d{3,4}[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b',  # International
        r'\(\d{3}\)\s?\d{3}[-.]?\d{4}'  # (123) 456-7890
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, text)
        if matches:
            return matches[0]
    
    return None

def extract_years_of_experience(text: str) -> float:
    """Extract years of experience from text"""
    if not text:
        return 0.0
    
    patterns = [
        r'(\d+(?:\.\d+)?)\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)',
        r'(?:experience|exp)\s*(?:of\s*)?(\d+(?:\.\d+)?)\s*(?:years?|yrs?)',
        r'(\d+)\+?\s*(?:years?|yrs?)\s*(?:experience|exp)',
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, text.lower())
        if matches:
            try:
                return float(matches[0])
            except ValueError:
                continue
    
    return 0.0

def classify_experience_level(years: float) -> str:
    """Classify experience level based on years"""
    if years <= 2:
        return "Beginner"
    elif years <= 5:
        return "Intermediate"
    elif years <= 10:
        return "Advanced"
    else:
        return "Expert"

def extract_skills(text: str) -> List[str]:
    """Extract skills from resume text"""
    if not text:
        return []
    
    text_lower = text.lower()
    found_skills = set()
    
    # Check against all domain skills
    for domain, skills in SKILL_DOMAIN_MAP.items():
        for skill in skills:
            if skill.lower() in text_lower:
                found_skills.add(skill.title())
    
    # Additional skill patterns
    skill_patterns = [
        r'\b(?:proficient|skilled|experienced)\s+(?:in|with)\s+([^,\n]+)',
        r'\b(?:knowledge|understanding)\s+of\s+([^,\n]+)',
        r'\b(?:technologies|tools|frameworks):\s*([^,\n]+)',
    ]
    
    for pattern in skill_patterns:
        matches = re.findall(pattern, text_lower)
        for match in matches:
            # Clean and split the match
            skills = [s.strip().title() for s in match.split() if len(s.strip()) > 2]
            found_skills.update(skills)
    
    return sorted(list(found_skills))

def classify_domains(skills: List[str]) -> List[str]:
    """Classify domains based on skills"""
    if not skills:
        return ["General"]
    
    skills_text = " ".join(skills).lower()
    found_domains = []
    
    for domain, domain_skills in SKILL_DOMAIN_MAP.items():
        if any(skill.lower() in skills_text for skill in domain_skills):
            found_domains.append(domain)
    
    return found_domains if found_domains else ["General"]

def extract_companies(text: str) -> List[str]:
    """Extract company names from resume text"""
    if not text:
        return []
    
    # This is a simplified version - in production, you'd use NER or company databases
    company_patterns = [
        r'(?:worked\s+at|employed\s+by|company:\s*)([A-Z][a-zA-Z\s&.,]+?)(?:\s*[,\.\n]|$)',
        r'([A-Z][a-zA-Z\s&.,]+?)\s*(?:Inc|LLC|Corp|Ltd|Company|Technologies)',
    ]
    
    companies = set()
    for pattern in company_patterns:
        matches = re.findall(pattern, text)
        for match in matches:
            company = match.strip().title()
            if len(company) > 2 and len(company) < 50:
                companies.add(company)
    
    return sorted(list(companies))

def parse_with_gemini(text: str, fallback_data: Dict[str, Any]) -> ResumeData:
    """Parse resume using Gemini AI with fallback data"""
    if not model:
        logger.warning("Gemini not available, using fallback parsing")
        return ResumeData(**fallback_data)
    
    try:
        prompt = f"""
        You are an expert resume analyzer. Extract structured information from this resume text.
        Be accurate and only extract information that is clearly present.
        
        Resume Text:
        {text[:3000]}  # Limit text to avoid token limits
        
        Additional Context:
        - Name: {fallback_data.get('name', 'Unknown')}
        - Email: {fallback_data.get('email', '')}
        - Years of Experience: {fallback_data.get('years_of_experience', 0)}
        
        Extract and return ONLY a JSON object with these exact fields:
        {{
            "name": "Full name",
            "email": "Email address",
            "location": "Location/City",
            "experience_level": "One of: Beginner, Intermediate, Advanced, Expert",
            "domains": ["List of main technical domains"],
            "skills": ["List of technical skills mentioned"],
            "companies": ["List of companies worked at"],
            "years_of_experience": 0.0
        }}
        
        Ensure valid JSON format. If a field is not found, use null or empty array.
        """
        
        response = model.generate_content(prompt)
        
        # Clean and parse JSON response
        response_text = response.text.strip()
        
        # Remove markdown code blocks if present
        if response_text.startswith('```'):
            response_text = re.sub(r'^```(?:json)?\s*', '', response_text)
            response_text = re.sub(r'\s*```$', '', response_text)
        
        parsed_data = json.loads(response_text)
        
        # Validate and create ResumeData object
        resume_data = ResumeData(
            name=parsed_data.get('name') or fallback_data.get('name', 'Unknown'),
            email=parsed_data.get('email') or fallback_data.get('email'),
            location=parsed_data.get('location'),
            experience_level=parsed_data.get('experience_level') or fallback_data.get('experience_level', 'Beginner'),
            domains=parsed_data.get('domains', []) or fallback_data.get('domains', []),
            skills=parsed_data.get('skills', []) or fallback_data.get('skills', []),
            companies=parsed_data.get('companies', []) or fallback_data.get('companies', []),
            years_of_experience=float(parsed_data.get('years_of_experience', 0)) or fallback_data.get('years_of_experience', 0.0)
        )
        
        logger.info("Successfully parsed resume with Gemini AI")
        return resume_data
        
    except Exception as e:
        logger.error(f"Gemini parsing failed: {e}")
        # Return fallback data
        return ResumeData(**fallback_data)

def parse_resume_text(text: str, filename: str = "") -> ResumeData:
    """Parse resume text and extract structured information"""
    start_time = datetime.now()
    
    # Extract basic information with heuristics
    email = extract_email(text)
    years_exp = extract_years_of_experience(text)
    experience_level = classify_experience_level(years_exp)
    skills = extract_skills(text)
    domains = classify_domains(skills)
    companies = extract_companies(text)
    
    # Prepare fallback data
    fallback_data = {
        'name': filename.replace('.pdf', '').replace('.docx', '').replace('.doc', '').replace('_', ' ').title() if filename else 'Unknown',
        'email': email,
        'location': None,
        'experience_level': experience_level,
        'domains': domains,
        'skills': skills,
        'companies': companies,
        'years_of_experience': years_exp
    }
    
    # Try Gemini AI first, fallback to heuristics
    try:
        result = parse_with_gemini(text, fallback_data)
        processing_time = (datetime.now() - start_time).total_seconds()
        logger.info(f"Resume parsed successfully in {processing_time:.2f}s")
        return result
    except Exception as e:
        logger.error(f"Parsing failed: {e}")
        processing_time = (datetime.now() - start_time).total_seconds()
        logger.info(f"Fallback parsing completed in {processing_time:.2f}s")
        return ResumeData(**fallback_data)

# API Routes
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'gemini_available': model is not None
    })

@app.route('/api/parse-resume', methods=['POST'])
def parse_resume_endpoint():
    """Main resume parsing endpoint"""
    start_time = datetime.now()
    
    try:
        # Check if file is present
        if 'resume' not in request.files:
            return jsonify(ParseResponse(
                success=False,
                error="No resume file provided"
            ).dict()), 400
        
        file = request.files['resume']
        if file.filename == '':
            return jsonify(ParseResponse(
                success=False,
                error="No file selected"
            ).dict()), 400
        
        # Validate file
        if not allowed_file(file.filename):
            return jsonify(ParseResponse(
                success=False,
                error=f"File type not supported. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
            ).dict()), 400
        
        # Save file temporarily
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        try:
            # Extract text based on file type
            file_extension = filename.rsplit('.', 1)[1].lower()
            
            if file_extension == 'pdf':
                text = extract_text_from_pdf(file_path)
            elif file_extension == 'docx':
                text = extract_text_from_docx(file_path)
            elif file_extension == 'doc':
                text = extract_text_from_doc(file_path)
            else:
                raise ValueError("Unsupported file type")
            
            if not text.strip():
                return jsonify(ParseResponse(
                    success=False,
                    error="Could not extract text from file. Please ensure the file is not corrupted."
                ).dict()), 400
            
            # Parse the resume
            resume_data = parse_resume_text(text, filename)
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return jsonify(ParseResponse(
                success=True,
                data=resume_data,
                processing_time=processing_time
            ).dict())
            
        finally:
            # Clean up temporary file
            try:
                os.remove(file_path)
            except Exception as e:
                logger.warning(f"Could not remove temporary file: {e}")
        
    except Exception as e:
        logger.error(f"Resume parsing error: {e}")
        processing_time = (datetime.now() - start_time).total_seconds()
        
        return jsonify(ParseResponse(
            success=False,
            error=str(e),
            processing_time=processing_time
        ).dict()), 500

@app.route('/api/parse-text', methods=['POST'])
def parse_text_endpoint():
    """Parse resume from raw text"""
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify(ParseResponse(
                success=False,
                error="No text provided"
            ).dict()), 400
        
        text = data['text']
        if not text.strip():
            return jsonify(ParseResponse(
                success=False,
                error="Empty text provided"
            ).dict()), 400
        
        # Parse the resume
        resume_data = parse_resume_text(text)
        
        return jsonify(ParseResponse(
            success=True,
            data=resume_data
        ).dict())
        
    except Exception as e:
        logger.error(f"Text parsing error: {e}")
        return jsonify(ParseResponse(
            success=False,
            error=str(e)
        ).dict()), 500

if __name__ == '__main__':
    # Create upload directory if it doesn't exist
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    
    # Run the Flask app
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    logger.info(f"Starting resume parser server on port {port}")
    logger.info(f"Gemini AI available: {model is not None}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
