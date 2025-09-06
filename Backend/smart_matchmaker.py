"""
QUICK TEAMS - Lightweight Smart Matchmaking System
No heavy AI models, just smart algorithms for fast team formation.
"""

import os
import json
import logging
import time
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from collections import defaultdict, Counter

from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from werkzeug.security import generate_password_hash


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Database path
DB_PATH = os.path.join(os.path.dirname(__file__), 'instance', 'quickteams.db')

@dataclass
class UserProfile:
    """Lightweight user profile for team matching"""
    user_id: str
    name: str
    email: str
    skills: List[str]
    interests: List[str]
    experience_level: str  # beginner, intermediate, advanced
    availability: List[str]  # time slots like "weekday_morning", "weekend_afternoon"
    location: str
    preferred_team_size: int
    goals: List[str]  # what they want to achieve
    past_projects: List[str]
    ratings: Dict[str, float]  # skill ratings 1-5
    created_at: str
    last_active: str

@dataclass
class TeamRequest:
    """Team formation request"""
    request_id: str
    creator_id: str
    title: str
    description: str
    required_skills: List[str]
    preferred_skills: List[str]
    team_size: int
    duration: str  # "short", "medium", "long"
    urgency: str  # "low", "medium", "high"
    deadline: str
    created_at: str
    status: str  # "open", "forming", "complete"

@dataclass
class MatchResult:
    """Matching result with score"""
    user_id: str
    compatibility_score: float
    skill_match_score: float
    availability_match_score: float
    goal_alignment_score: float
    experience_compatibility: float
    reasons: List[str]

class DatabaseManager:
    """Simple database operations"""
    
    def __init__(self):
        self.ensure_database()
    
    def ensure_database(self):
        """Create tables if they don't exist"""
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
        
        with sqlite3.connect(DB_PATH) as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS user_profiles (
                    user_id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT NOT NULL,
                    skills TEXT,  -- JSON array
                    interests TEXT,  -- JSON array
                    experience_level TEXT,
                    availability TEXT,  -- JSON array
                    location TEXT,
                    preferred_team_size INTEGER,
                    goals TEXT,  -- JSON array
                    past_projects TEXT,  -- JSON array
                    ratings TEXT,  -- JSON object
                    created_at TEXT,
                    last_active TEXT
                );
                
                CREATE TABLE IF NOT EXISTS team_requests (
                    request_id TEXT PRIMARY KEY,
                    creator_id TEXT,
                    title TEXT NOT NULL,
                    description TEXT,
                    required_skills TEXT,  -- JSON array
                    preferred_skills TEXT,  -- JSON array
                    team_size INTEGER,
                    duration TEXT,
                    urgency TEXT,
                    deadline TEXT,
                    created_at TEXT,
                    status TEXT,
                    FOREIGN KEY (creator_id) REFERENCES user_profiles(user_id)
                );
                
                CREATE TABLE IF NOT EXISTS team_memberships (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    request_id TEXT,
                    user_id TEXT,
                    status TEXT,  -- "invited", "accepted", "rejected"
                    joined_at TEXT,
                    FOREIGN KEY (request_id) REFERENCES team_requests(request_id),
                    FOREIGN KEY (user_id) REFERENCES user_profiles(user_id)
                );
                
                CREATE INDEX IF NOT EXISTS idx_user_skills ON user_profiles(skills);
                CREATE INDEX IF NOT EXISTS idx_team_status ON team_requests(status);
                CREATE INDEX IF NOT EXISTS idx_user_location ON user_profiles(location);
            """)

    def save_user_profile(self, profile: UserProfile):
        """Save user profile to database"""
        with sqlite3.connect(DB_PATH) as conn:
            conn.execute("""
                INSERT OR REPLACE INTO user_profiles 
                (user_id, name, email, skills, interests, experience_level, 
                 availability, location, preferred_team_size, goals, 
                 past_projects, ratings, created_at, last_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                profile.user_id, profile.name, profile.email,
                json.dumps(profile.skills), json.dumps(profile.interests),
                profile.experience_level, json.dumps(profile.availability),
                profile.location, profile.preferred_team_size,
                json.dumps(profile.goals), json.dumps(profile.past_projects),
                json.dumps(profile.ratings), profile.created_at, profile.last_active
            ))

    def get_user_profile(self, user_id: str) -> Optional[UserProfile]:
        """Get user profile by ID"""
        with sqlite3.connect(DB_PATH) as conn:
            conn.row_factory = sqlite3.Row
            row = conn.execute("SELECT * FROM user_profiles WHERE user_id = ?", (user_id,)).fetchone()
            
            if row:
                return UserProfile(
                    user_id=row['user_id'],
                    name=row['name'],
                    email=row['email'],
                    skills=json.loads(row['skills'] or '[]'),
                    interests=json.loads(row['interests'] or '[]'),
                    experience_level=row['experience_level'],
                    availability=json.loads(row['availability'] or '[]'),
                    location=row['location'],
                    preferred_team_size=row['preferred_team_size'],
                    goals=json.loads(row['goals'] or '[]'),
                    past_projects=json.loads(row['past_projects'] or '[]'),
                    ratings=json.loads(row['ratings'] or '{}'),
                    created_at=row['created_at'],
                    last_active=row['last_active']
                )
        return None

    def get_all_active_users(self, hours_back: int = 72) -> List[UserProfile]:
        """Get all users active within specified hours"""
        cutoff = (datetime.now() - timedelta(hours=hours_back)).isoformat()
        
        with sqlite3.connect(DB_PATH) as conn:
            conn.row_factory = sqlite3.Row
            rows = conn.execute("""
                SELECT * FROM user_profiles 
                WHERE last_active > ? 
                ORDER BY last_active DESC
            """, (cutoff,)).fetchall()
            
            profiles = []
            for row in rows:
                profiles.append(UserProfile(
                    user_id=row['user_id'],
                    name=row['name'],
                    email=row['email'],
                    skills=json.loads(row['skills'] or '[]'),
                    interests=json.loads(row['interests'] or '[]'),
                    experience_level=row['experience_level'],
                    availability=json.loads(row['availability'] or '[]'),
                    location=row['location'],
                    preferred_team_size=row['preferred_team_size'],
                    goals=json.loads(row['goals'] or '[]'),
                    past_projects=json.loads(row['past_projects'] or '[]'),
                    ratings=json.loads(row['ratings'] or '{}'),
                    created_at=row['created_at'],
                    last_active=row['last_active']
                ))
            return profiles

class SmartMatchmaker:
    """Lightweight, efficient matchmaking engine"""
    
    def __init__(self):
        self.db = DatabaseManager()
        
        # Predefined skill categories for better matching
        self.skill_categories = {
            'programming': ['python', 'javascript', 'java', 'c++', 'react', 'node.js', 'django', 'flutter'],
            'design': ['ui/ux', 'figma', 'photoshop', 'graphic design', 'web design', 'branding'],
            'data': ['machine learning', 'data analysis', 'sql', 'pandas', 'tensorflow', 'statistics'],
            'business': ['marketing', 'sales', 'strategy', 'finance', 'project management'],
            'creative': ['writing', 'photography', 'video editing', 'music', 'art'],
            'technical': ['devops', 'cloud', 'aws', 'docker', 'linux', 'cybersecurity']
        }
        
        # Experience level compatibility matrix
        self.experience_compatibility = {
            'beginner': {'beginner': 0.9, 'intermediate': 0.8, 'advanced': 0.6},
            'intermediate': {'beginner': 0.8, 'intermediate': 1.0, 'advanced': 0.9},
            'advanced': {'beginner': 0.6, 'intermediate': 0.9, 'advanced': 1.0}
        }

    def calculate_skill_similarity(self, skills1: List[str], skills2: List[str]) -> float:
        """Calculate skill similarity using Jaccard similarity and categories"""
        if not skills1 or not skills2:
            return 0.0
        
        # Normalize skills (lowercase)
        skills1_norm = {skill.lower().strip() for skill in skills1}
        skills2_norm = {skill.lower().strip() for skill in skills2}
        
        # Direct skill overlap (Jaccard similarity)
        intersection = len(skills1_norm & skills2_norm)
        union = len(skills1_norm | skills2_norm)
        direct_similarity = intersection / union if union > 0 else 0
        
        # Category-based similarity
        cat1 = self.get_skill_categories(skills1_norm)
        cat2 = self.get_skill_categories(skills2_norm)
        
        cat_intersection = len(cat1 & cat2)
        cat_union = len(cat1 | cat2)
        category_similarity = cat_intersection / cat_union if cat_union > 0 else 0
        
        # Weighted combination
        return (direct_similarity * 0.7) + (category_similarity * 0.3)

    def get_skill_categories(self, skills: set) -> set:
        """Get categories for a set of skills"""
        categories = set()
        for skill in skills:
            for category, cat_skills in self.skill_categories.items():
                if any(cat_skill.lower() in skill for cat_skill in cat_skills):
                    categories.add(category)
        return categories

    def calculate_availability_overlap(self, avail1: List[str], avail2: List[str]) -> float:
        """Calculate availability overlap"""
        if not avail1 or not avail2:
            return 0.5  # Neutral if no availability info
        
        avail1_set = {slot.lower() for slot in avail1}
        avail2_set = {slot.lower() for slot in avail2}
        
        intersection = len(avail1_set & avail2_set)
        union = len(avail1_set | avail2_set)
        
        return intersection / union if union > 0 else 0

    def calculate_goal_alignment(self, goals1: List[str], goals2: List[str]) -> float:
        """Calculate goal alignment using keyword matching"""
        if not goals1 or not goals2:
            return 0.5
        
        # Create keyword sets from goals
        keywords1 = set()
        keywords2 = set()
        
        for goal in goals1:
            keywords1.update(goal.lower().split())
        
        for goal in goals2:
            keywords2.update(goal.lower().split())
        
        # Remove common words
        common_words = {'and', 'or', 'the', 'to', 'of', 'in', 'for', 'with', 'on', 'at', 'by'}
        keywords1 -= common_words
        keywords2 -= common_words
        
        if not keywords1 or not keywords2:
            return 0.5
        
        intersection = len(keywords1 & keywords2)
        union = len(keywords1 | keywords2)
        
        return intersection / union if union > 0 else 0

    def find_matches(self, user_id: str, max_results: int = 10) -> List[MatchResult]:
        """Find the best matches for a user"""
        user_profile = self.db.get_user_profile(user_id)
        if not user_profile:
            return []
        
        # Get all other active users
        all_users = self.db.get_all_active_users()
        candidates = [u for u in all_users if u.user_id != user_id]
        
        matches = []
        
        for candidate in candidates:
            match_result = self.calculate_compatibility(user_profile, candidate)
            matches.append(match_result)
        
        # Sort by compatibility score and return top matches
        matches.sort(key=lambda x: x.compatibility_score, reverse=True)
        return matches[:max_results]

    def calculate_compatibility(self, user1: UserProfile, user2: UserProfile) -> MatchResult:
        """Calculate comprehensive compatibility between two users"""
        
        # 1. Skill similarity (30%)
        skill_score = self.calculate_skill_similarity(user1.skills, user2.skills)
        
        # 2. Availability overlap (25%)
        availability_score = self.calculate_availability_overlap(user1.availability, user2.availability)
        
        # 3. Goal alignment (25%)
        goal_score = self.calculate_goal_alignment(user1.goals, user2.goals)
        
        # 4. Experience compatibility (15%)
        exp_score = self.experience_compatibility.get(user1.experience_level, {}).get(user2.experience_level, 0.5)
        
        # 5. Location bonus (5%) - same location gets small boost
        location_bonus = 0.1 if user1.location.lower() == user2.location.lower() else 0
        
        # Calculate weighted overall score
        compatibility_score = (
            skill_score * 0.30 +
            availability_score * 0.25 +
            goal_score * 0.25 +
            exp_score * 0.15 +
            location_bonus * 0.05
        )
        
        # Generate reasons for the match
        reasons = []
        if skill_score > 0.6:
            reasons.append(f"Strong skill overlap ({skill_score:.1%})")
        if availability_score > 0.5:
            reasons.append(f"Compatible schedules ({availability_score:.1%})")
        if goal_score > 0.4:
            reasons.append(f"Aligned goals ({goal_score:.1%})")
        if exp_score > 0.8:
            reasons.append(f"Similar experience level")
        if location_bonus > 0:
            reasons.append(f"Same location: {user1.location}")
        
        return MatchResult(
            user_id=user2.user_id,
            compatibility_score=compatibility_score,
            skill_match_score=skill_score,
            availability_match_score=availability_score,
            goal_alignment_score=goal_score,
            experience_compatibility=exp_score,
            reasons=reasons
        )

# Global matchmaker instance
matchmaker = SmartMatchmaker()

# API Routes
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'QUICK TEAMS Smart Matchmaker',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/profile', methods=['POST'])
def create_or_update_profile():
    """Create or update user profile"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['user_id', 'name', 'email', 'skills']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Create profile object
        profile = UserProfile(
            user_id=data['user_id'],
            name=data['name'],
            email=data['email'],
            skills=data.get('skills', []),
            interests=data.get('interests', []),
            experience_level=data.get('experience_level', 'intermediate'),
            availability=data.get('availability', []),
            location=data.get('location', ''),
            preferred_team_size=data.get('preferred_team_size', 4),
            goals=data.get('goals', []),
            past_projects=data.get('past_projects', []),
            ratings=data.get('ratings', {}),
            created_at=data.get('created_at', datetime.now().isoformat()),
            last_active=datetime.now().isoformat()
        )
        
        matchmaker.db.save_user_profile(profile)
        
        return jsonify({
            'success': True,
            'message': 'Profile saved successfully',
            'profile': asdict(profile)
        })
        
    except Exception as e:
        logger.error(f"Error creating profile: {str(e)}")
        return jsonify({'error': 'Failed to create profile'}), 500

@app.route('/profile/<user_id>', methods=['GET'])
def get_profile(user_id):
    """Get user profile"""
    try:
        profile = matchmaker.db.get_user_profile(user_id)
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404
        
        return jsonify({
            'success': True,
            'profile': asdict(profile)
        })
        
    except Exception as e:
        logger.error(f"Error getting profile: {str(e)}")
        return jsonify({'error': 'Failed to get profile'}), 500

@app.route('/matches/<user_id>', methods=['GET'])
def find_matches(user_id):
    """Find matches for a user"""
    try:
        max_results = request.args.get('limit', 10, type=int)
        matches = matchmaker.find_matches(user_id, max_results)
        
        # Convert to dict format
        matches_data = []
        for match in matches:
            match_dict = asdict(match)
            # Get full profile info for the match
            profile = matchmaker.db.get_user_profile(match.user_id)
            if profile:
                match_dict['profile'] = {
                    'name': profile.name,
                    'skills': profile.skills,
                    'experience_level': profile.experience_level,
                    'location': profile.location,
                    'goals': profile.goals[:3]  # Show first 3 goals
                }
            matches_data.append(match_dict)
        
        return jsonify({
            'success': True,
            'user_id': user_id,
            'matches': matches_data,
            'match_count': len(matches_data)
        })
        
    except Exception as e:
        logger.error(f"Error finding matches: {str(e)}")
        return jsonify({'error': 'Failed to find matches'}), 500

@app.route('/quick-team', methods=['POST'])
def quick_team_formation():
    """Quick team formation for immediate needs"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        skills_needed = data.get('skills_needed', [])
        team_size = data.get('team_size', 4)
        urgency = data.get('urgency', 'medium')
        
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400
        
        # Find matches based on skills needed
        matches = matchmaker.find_matches(user_id, max_results=team_size * 2)
        
        # Filter matches based on needed skills if specified
        if skills_needed:
            filtered_matches = []
            for match in matches:
                profile = matchmaker.db.get_user_profile(match.user_id)
                if profile and any(skill.lower() in [s.lower() for s in profile.skills] for skill in skills_needed):
                    filtered_matches.append(match)
            matches = filtered_matches[:team_size-1]  # -1 for the requesting user
        else:
            matches = matches[:team_size-1]
        
        # Create team suggestion
        team_suggestion = {
            'team_id': f"quick_team_{int(time.time())}",
            'creator': user_id,
            'suggested_members': [asdict(match) for match in matches],
            'total_size': len(matches) + 1,  # +1 for creator
            'skills_covered': [],
            'average_compatibility': 0
        }
        
        # Calculate team stats
        if matches:
            total_score = sum(match.compatibility_score for match in matches)
            team_suggestion['average_compatibility'] = total_score / len(matches)
            
            # Collect all skills from team members
            all_skills = set()
            creator_profile = matchmaker.db.get_user_profile(user_id)
            if creator_profile:
                all_skills.update(creator_profile.skills)
            
            for match in matches:
                profile = matchmaker.db.get_user_profile(match.user_id)
                if profile:
                    all_skills.update(profile.skills)
            
            team_suggestion['skills_covered'] = list(all_skills)
        
        return jsonify({
            'success': True,
            'team_suggestion': team_suggestion,
            'message': f'Found {len(matches)} potential teammates'
        })
        
    except Exception as e:
        logger.error(f"Error in quick team formation: {str(e)}")
        return jsonify({'error': 'Failed to form quick team'}), 500

@app.route('/stats', methods=['GET'])
def get_stats():
    """Get platform statistics"""
    try:
        active_users = matchmaker.db.get_all_active_users(hours_back=24)
        all_users = matchmaker.db.get_all_active_users(hours_back=168)  # Week
        
        # Skill distribution
        skill_counts = Counter()
        for user in all_users:
            skill_counts.update([skill.lower() for skill in user.skills])
        
        return jsonify({
            'success': True,
            'stats': {
                'active_users_24h': len(active_users),
                'total_active_users': len(all_users),
                'top_skills': skill_counts.most_common(10),
                'experience_distribution': {
                    level: len([u for u in all_users if u.experience_level == level])
                    for level in ['beginner', 'intermediate', 'advanced']
                }
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting stats: {str(e)}")
        return jsonify({'error': 'Failed to get stats'}), 500

if __name__ == '__main__':
    logger.info("🚀 Starting QUICK TEAMS Smart Matchmaker...")
    logger.info("💡 Lightweight, fast, and efficient - no heavy AI models!")
    app.run(host='0.0.0.0', port=5001, debug=True)
