#!/usr/bin/env python3
"""
Enhanced AI Matchmaker with Resume Integration
Automatically populates user profiles from parsed resume data
"""

import os
import json
import logging
import traceback
from datetime import datetime
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, asdict
import re
from pathlib import Path

import pandas as pd
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
from sklearn.cluster import KMeans
from flask import Flask, request, jsonify
from flask_cors import CORS
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

class ProfilePopulator:
    """
    Enhanced profile populator that automatically fills user profile data
    from comprehensive resume parsing results
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def populate_profile_from_resume(self, resume_data: Dict[str, Any], existing_profile: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Populate user profile from comprehensive resume data
        Resume data overrides existing profile data in case of conflicts
        """
        try:
            self.logger.info("Populating profile from comprehensive resume data")
            
            # Start with existing profile or empty profile
            profile = existing_profile.copy() if existing_profile else {}
            
            # Basic Information - Resume data takes precedence
            if resume_data.get('full_name'):
                profile['displayName'] = resume_data['full_name']
                profile['username'] = self._generate_username(resume_data['full_name'])
            
            if resume_data.get('professional_title'):
                profile['professionalTitle'] = resume_data['professional_title']
                profile['title'] = resume_data['professional_title']  # Alternative field
            
            if resume_data.get('summary'):
                profile['bio'] = resume_data['summary']
                profile['professionalSummary'] = resume_data['summary']
            
            # Contact Information
            contact_info = resume_data.get('contact_info', {})
            if contact_info:
                if contact_info.get('email'):
                    profile['email'] = contact_info['email']
                
                if contact_info.get('phone'):
                    profile['phone'] = contact_info['phone']
                
                if contact_info.get('location'):
                    profile['location'] = contact_info['location']
                    profile['city'] = self._extract_city(contact_info['location'])
                    profile['country'] = self._extract_country(contact_info['location'])
                
                if contact_info.get('linkedin'):
                    profile['socialLinks'] = profile.get('socialLinks', {})
                    profile['socialLinks']['linkedin'] = contact_info['linkedin']
                
                if contact_info.get('github'):
                    profile['socialLinks'] = profile.get('socialLinks', {})
                    profile['socialLinks']['github'] = contact_info['github']
                
                if contact_info.get('website'):
                    profile['socialLinks'] = profile.get('socialLinks', {})
                    profile['socialLinks']['website'] = contact_info['website']
                    profile['portfolio'] = contact_info['website']
            
            # Experience Information
            experience = resume_data.get('experience', [])
            if experience:
                profile['workExperience'] = self._format_experience(experience)
                profile['currentRole'] = experience[0].get('title') if experience else None
                profile['currentCompany'] = experience[0].get('company') if experience else None
                
                # Calculate experience level
                years_exp = resume_data.get('years_experience', 0)
                profile['experienceLevel'] = self._determine_experience_level(years_exp)
                profile['yearsOfExperience'] = years_exp
            
            # Education Information
            education = resume_data.get('education', [])
            if education:
                profile['education'] = self._format_education(education)
                highest_edu = education[0] if education else {}
                profile['degree'] = highest_edu.get('degree')
                profile['university'] = highest_edu.get('institution')
                profile['graduationYear'] = highest_edu.get('graduation_year')
            
            # Technical Skills
            technical_skills = resume_data.get('technical_skills', [])
            if technical_skills:
                profile['skills'] = self._format_technical_skills(technical_skills)
                profile['topSkills'] = [skill['name'] for skill in technical_skills[:10]]
                profile['skillCategories'] = list(set([skill.get('category', 'Other') for skill in technical_skills if skill.get('category')]))
            
            # Soft Skills
            soft_skills = resume_data.get('soft_skills', [])
            if soft_skills:
                profile['softSkills'] = soft_skills
                profile['interpersonalSkills'] = soft_skills
            
            # Languages
            languages = resume_data.get('languages', [])
            if languages:
                profile['languages'] = languages
                profile['spokenLanguages'] = languages
            
            # Projects
            projects = resume_data.get('projects', [])
            if projects:
                profile['projects'] = self._format_projects(projects)
                profile['portfolioProjects'] = projects[:5]  # Top 5 projects
            
            # Certifications
            certifications = resume_data.get('certifications', [])
            if certifications:
                profile['certifications'] = self._format_certifications(certifications)
                profile['professionalCertifications'] = certifications
            
            # Awards and Recognition
            awards = resume_data.get('awards', [])
            if awards:
                profile['awards'] = awards
                profile['achievements'] = awards
            
            # Publications
            publications = resume_data.get('publications', [])
            if publications:
                profile['publications'] = publications
                profile['researchPapers'] = publications
            
            # Career Information
            career_level = resume_data.get('career_level')
            if career_level:
                profile['careerLevel'] = career_level
                profile['seniorityLevel'] = career_level
            
            # Industry Experience
            industries = resume_data.get('industries', [])
            if industries:
                profile['industries'] = industries
                profile['industryExperience'] = industries
                profile['primaryIndustry'] = industries[0] if industries else None
            
            # Availability and Preferences (defaults if not in existing profile)
            if not profile.get('availability'):
                profile['availability'] = 'Full-time'
            
            if not profile.get('remotePreference'):
                profile['remotePreference'] = 'Hybrid'
            
            # Profile Completeness
            completeness_score = self._calculate_profile_completeness(profile)
            profile['profileCompleteness'] = completeness_score
            profile['profileComplete'] = completeness_score >= 80
            
            # Metadata
            profile['lastResumeUpdate'] = datetime.now().isoformat()
            profile['resumeIntegrated'] = True
            profile['autoPopulated'] = True
            
            # Profile photo extraction (if resume contains image data)
            photo_data = resume_data.get('profile_photo')
            if photo_data:
                profile['hasProfilePhoto'] = True
                profile['profilePhotoSource'] = 'resume'
                # Note: Actual photo upload would be handled separately
            
            self.logger.info(f"Profile populated successfully. Completeness: {completeness_score}%")
            return profile
            
        except Exception as e:
            self.logger.error(f"Error populating profile from resume: {e}")
            self.logger.error(traceback.format_exc())
            return existing_profile or {}
    
    def _generate_username(self, full_name: str) -> str:
        """Generate username from full name"""
        if not full_name:
            return f"user_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Clean and format name
        clean_name = re.sub(r'[^a-zA-Z\s]', '', full_name.lower())
        parts = clean_name.split()
        
        if len(parts) >= 2:
            return f"{parts[0]}.{parts[-1]}"
        else:
            return parts[0] if parts else f"user_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    def _extract_city(self, location: str) -> Optional[str]:
        """Extract city from location string"""
        if not location:
            return None
        parts = [part.strip() for part in location.split(',')]
        return parts[0] if parts else None
    
    def _extract_country(self, location: str) -> Optional[str]:
        """Extract country from location string"""
        if not location:
            return None
        parts = [part.strip() for part in location.split(',')]
        return parts[-1] if len(parts) > 1 else None
    
    def _determine_experience_level(self, years: int) -> str:
        """Determine experience level from years of experience"""
        if years < 2:
            return 'Junior'
        elif years < 5:
            return 'Mid-level'
        elif years < 10:
            return 'Senior'
        else:
            return 'Executive'
    
    def _format_experience(self, experience: List[Dict]) -> List[Dict]:
        """Format experience data for profile"""
        formatted = []
        for exp in experience:
            formatted_exp = {
                'title': exp.get('title'),
                'company': exp.get('company'),
                'location': exp.get('location'),
                'startDate': exp.get('start_date'),
                'endDate': exp.get('end_date'),
                'duration': exp.get('duration'),
                'description': exp.get('description'),
                'responsibilities': exp.get('responsibilities', []),
                'achievements': exp.get('achievements', []),
                'current': exp.get('end_date', '').lower() in ['present', 'current', 'now']
            }
            formatted.append(formatted_exp)
        return formatted
    
    def _format_education(self, education: List[Dict]) -> List[Dict]:
        """Format education data for profile"""
        formatted = []
        for edu in education:
            formatted_edu = {
                'degree': edu.get('degree'),
                'institution': edu.get('institution'),
                'graduationYear': edu.get('graduation_year'),
                'gpa': edu.get('gpa'),
                'major': edu.get('major'),
                'minor': edu.get('minor'),
                'fieldOfStudy': edu.get('major')
            }
            formatted.append(formatted_edu)
        return formatted
    
    def _format_technical_skills(self, skills: List[Dict]) -> List[Dict]:
        """Format technical skills for profile"""
        formatted = []
        for skill in skills:
            formatted_skill = {
                'name': skill.get('name'),
                'category': skill.get('category', 'Other'),
                'level': skill.get('level'),
                'yearsExperience': skill.get('years_experience'),
                'proficiency': self._map_skill_level(skill.get('level'))
            }
            formatted.append(formatted_skill)
        return formatted
    
    def _map_skill_level(self, level: Optional[str]) -> str:
        """Map skill level to proficiency"""
        if not level:
            return 'Intermediate'
        
        level_lower = level.lower()
        if level_lower in ['beginner', 'basic', 'novice']:
            return 'Beginner'
        elif level_lower in ['intermediate', 'moderate']:
            return 'Intermediate'
        elif level_lower in ['advanced', 'proficient']:
            return 'Advanced'
        elif level_lower in ['expert', 'master']:
            return 'Expert'
        else:
            return 'Intermediate'
    
    def _format_projects(self, projects: List[Dict]) -> List[Dict]:
        """Format projects for profile"""
        formatted = []
        for project in projects:
            formatted_project = {
                'name': project.get('name'),
                'description': project.get('description'),
                'technologies': project.get('technologies', []),
                'url': project.get('url'),
                'duration': project.get('duration'),
                'status': 'Completed',  # Default status
                'role': 'Developer'  # Default role
            }
            formatted.append(formatted_project)
        return formatted
    
    def _format_certifications(self, certifications: List[Dict]) -> List[Dict]:
        """Format certifications for profile"""
        formatted = []
        for cert in certifications:
            formatted_cert = {
                'name': cert.get('name'),
                'issuer': cert.get('issuer'),
                'date': cert.get('date'),
                'expiryDate': cert.get('expiry_date'),
                'credentialId': cert.get('credential_id'),
                'verified': bool(cert.get('credential_id'))
            }
            formatted.append(formatted_cert)
        return formatted
    
    def _calculate_profile_completeness(self, profile: Dict) -> int:
        """Calculate profile completeness percentage"""
        required_fields = [
            'displayName', 'email', 'bio', 'location', 'skills',
            'workExperience', 'education', 'professionalTitle'
        ]
        
        optional_fields = [
            'phone', 'socialLinks', 'projects', 'certifications',
            'languages', 'portfolio', 'awards'
        ]
        
        score = 0
        
        # Required fields (70% weight)
        for field in required_fields:
            if profile.get(field):
                score += 70 / len(required_fields)
        
        # Optional fields (30% weight)
        for field in optional_fields:
            if profile.get(field):
                score += 30 / len(optional_fields)
        
        return min(int(score), 100)

class SmartMatchmakingEngineFAISS:
    """Enhanced matchmaking engine with profile integration"""
    
    def __init__(self, n_clusters=8, required_domains=None, required_skills=None):
        # Embedding model
        try:
            self.embedder = SentenceTransformer("all-mpnet-base-v2")
        except Exception as e:
            logger.warning(f"Failed to load sentence transformer: {e}")
            self.embedder = None

        # FAISS index
        self.dimension = 768
        self.index = faiss.IndexFlatL2(self.dimension)

        # Storage
        self.user_profiles = pd.DataFrame()
        self.embeddings = None

        # Clustering
        self.n_clusters = n_clusters
        self.clustering_model = KMeans(n_clusters=n_clusters, random_state=42)

        # Requirements
        self.required_domains = set(required_domains) if required_domains else set()
        self.required_skills = set(required_skills) if required_skills else set()
        
        # Profile populator
        self.profile_populator = ProfilePopulator()
    
    def create_profile_from_resume(self, resume_data: Dict[str, Any], user_id: str, existing_profile: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Create or update user profile from resume data
        """
        try:
            logger.info(f"Creating profile from resume for user: {user_id}")
            
            # Populate profile using the enhanced populator
            populated_profile = self.profile_populator.populate_profile_from_resume(
                resume_data, existing_profile
            )
            
            # Add user identification
            populated_profile['userId'] = user_id
            populated_profile['profileId'] = user_id
            
            # Generate profile embedding for matchmaking
            if self.embedder:
                profile_text = self._generate_profile_text(populated_profile)
                embedding = self.embedder.encode(profile_text)
                populated_profile['embedding'] = embedding.tolist()
            
            # Add to matchmaking database
            self._add_user_to_matchmaking(user_id, populated_profile)
            
            logger.info(f"Profile created successfully. Completeness: {populated_profile.get('profileCompleteness', 0)}%")
            return populated_profile
            
        except Exception as e:
            logger.error(f"Error creating profile from resume: {e}")
            logger.error(traceback.format_exc())
            raise
    
    def _generate_profile_text(self, profile: Dict[str, Any]) -> str:
        """Generate text representation of profile for embeddings"""
        text_parts = []
        
        # Basic info
        if profile.get('displayName'):
            text_parts.append(f"Name: {profile['displayName']}")
        
        if profile.get('professionalTitle'):
            text_parts.append(f"Title: {profile['professionalTitle']}")
        
        if profile.get('bio'):
            text_parts.append(f"Bio: {profile['bio']}")
        
        # Skills
        if profile.get('topSkills'):
            text_parts.append(f"Skills: {', '.join(profile['topSkills'])}")
        
        # Experience
        if profile.get('workExperience'):
            exp_text = []
            for exp in profile['workExperience'][:3]:  # Top 3 experiences
                if exp.get('title') and exp.get('company'):
                    exp_text.append(f"{exp['title']} at {exp['company']}")
            if exp_text:
                text_parts.append(f"Experience: {'; '.join(exp_text)}")
        
        # Industries
        if profile.get('industries'):
            text_parts.append(f"Industries: {', '.join(profile['industries'])}")
        
        return ' | '.join(text_parts)
    
    def _add_user_to_matchmaking(self, user_id: str, profile: Dict[str, Any]):
        """Add user profile to matchmaking system"""
        try:
            if not self.embedder:
                logger.warning("Embedder not available, skipping matchmaking addition")
                return
            
            # Create user data for matchmaking
            user_data = {
                'user_id': user_id,
                'name': profile.get('displayName', ''),
                'skills': profile.get('topSkills', []),
                'domains': profile.get('skillCategories', []),
                'experience_level': profile.get('experienceLevel', 'Mid-level'),
                'location': profile.get('location', ''),
                'bio': profile.get('bio', ''),
                'embedding': profile.get('embedding', [])
            }
            
            # Add to user profiles DataFrame
            new_df = pd.DataFrame([user_data])
            self.user_profiles = pd.concat([self.user_profiles, new_df], ignore_index=True)
            
            # Update FAISS index
            if user_data['embedding']:
                embedding = np.array(user_data['embedding'], dtype=np.float32).reshape(1, -1)
                self.index.add(embedding)
            
            logger.info(f"Added user {user_id} to matchmaking system")
            
        except Exception as e:
            logger.error(f"Error adding user to matchmaking: {e}")

# Global instances
profile_populator = ProfilePopulator()
matchmaking_engine = SmartMatchmakingEngineFAISS()

# API Routes
@app.route('/api/profile/populate', methods=['POST'])
def populate_profile_endpoint():
    """Populate user profile from resume data"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                "success": False,
                "error": "No data provided"
            }), 400
        
        resume_data = data.get('resumeData')
        existing_profile = data.get('existingProfile')
        user_id = data.get('userId')
        
        if not resume_data:
            return jsonify({
                "success": False,
                "error": "Resume data is required"
            }), 400
        
        if not user_id:
            return jsonify({
                "success": False,
                "error": "User ID is required"
            }), 400
        
        logger.info(f"Populating profile for user: {user_id}")
        
        # Create comprehensive profile
        populated_profile = matchmaking_engine.create_profile_from_resume(
            resume_data, user_id, existing_profile
        )
        
        return jsonify({
            "success": True,
            "profile": populated_profile,
            "completeness": populated_profile.get('profileCompleteness', 0),
            "fieldsPopulated": len([k for k, v in populated_profile.items() if v]),
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Profile population error: {e}")
        logger.error(traceback.format_exc())
        return jsonify({
            "success": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/api/profile/completeness', methods=['POST'])
def check_profile_completeness():
    """Check profile completeness score"""
    try:
        data = request.get_json()
        profile = data.get('profile', {})
        
        completeness = profile_populator._calculate_profile_completeness(profile)
        
        return jsonify({
            "success": True,
            "completeness": completeness,
            "complete": completeness >= 80,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Completeness check error: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/matchmaking/find-matches', methods=['POST'])
def find_matches_endpoint():
    """Find matches for a user based on profile"""
    try:
        data = request.get_json()
        user_id = data.get('userId')
        num_matches = data.get('numMatches', 5)
        
        if not user_id:
            return jsonify({
                "success": False,
                "error": "User ID is required"
            }), 400
        
        # Find matches using the enhanced engine
        matches = matchmaking_engine.find_matches(user_id, num_matches)
        
        return jsonify({
            "success": True,
            "matches": matches,
            "count": len(matches) if matches else 0,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Matchmaking error: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "ai_matchmaker",
        "version": "2.0.0",
        "embedder_available": matchmaking_engine.embedder is not None,
        "timestamp": datetime.now().isoformat()
    })

if __name__ == '__main__':
    # Log startup information
    logger.info("=" * 50)
    logger.info("AI MATCHMAKER & PROFILE POPULATOR STARTING")
    logger.info("=" * 50)
    logger.info(f"Embedder Available: {matchmaking_engine.embedder is not None}")
    logger.info(f"Profile Populator Ready: True")
    logger.info("=" * 50)
    
    # Start the Flask application
    app.run(
        host='0.0.0.0',
        port=5001,
        debug=False
    )
