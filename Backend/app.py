from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import redis
import json
import uuid

load_dotenv()

app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///stillstanding.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)

# Initialize extensions
db = SQLAlchemy(app)
jwt = JWTManager(app)
CORS(app, origins=os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(','))

# Redis connection for real-time features
try:
    redis_client = redis.Redis.from_url(os.getenv('REDIS_URL', 'redis://localhost:6379'))
    redis_client.ping()
except:
    redis_client = None
    print("Redis not available - real-time features disabled")

# Database Models
class User(db.Model):
    id = db.Column(db.String(100), primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    username = db.Column(db.String(80), unique=True, nullable=False)
    display_name = db.Column(db.String(100), nullable=True)
    password_hash = db.Column(db.String(200), nullable=True)
    photo_url = db.Column(db.Text, nullable=True)
    bio = db.Column(db.Text, nullable=True)
    location = db.Column(db.String(100), nullable=True)
    is_online = db.Column(db.Boolean, default=False)
    last_seen = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    created_groups = db.relationship('Group', backref='creator', lazy=True, foreign_keys='Group.creator_id')
    messages = db.relationship('Message', backref='author', lazy=True)

class Group(db.Model):
    id = db.Column(db.String(100), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    is_private = db.Column(db.Boolean, default=False)
    category = db.Column(db.String(50), default='General')
    creator_id = db.Column(db.String(100), db.ForeignKey('user.id'), nullable=False)
    avatar_url = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    messages = db.relationship('Message', backref='group', lazy=True, cascade='all, delete-orphan')

class GroupMember(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.String(100), db.ForeignKey('group.id'), nullable=False)
    user_id = db.Column(db.String(100), db.ForeignKey('user.id'), nullable=False)
    role = db.Column(db.String(20), default='member')  # owner, admin, member
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='group_memberships')
    group = db.relationship('Group', backref='members')

class Message(db.Model):
    id = db.Column(db.String(100), primary_key=True, default=lambda: str(uuid.uuid4()))
    content = db.Column(db.Text, nullable=False)
    message_type = db.Column(db.String(20), default='text')  # text, image, file, system
    author_id = db.Column(db.String(100), db.ForeignKey('user.id'), nullable=False)
    group_id = db.Column(db.String(100), db.ForeignKey('group.id'), nullable=False)
    reply_to = db.Column(db.String(100), db.ForeignKey('message.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Self-referential relationship for replies
    replies = db.relationship('Message', backref=db.backref('parent', remote_side=[id]))

# Create tables
with app.app_context():
    db.create_all()

# Helper functions
def user_to_dict(user):
    return {
        'id': user.id,
        'email': user.email,
        'username': user.username,
        'displayName': user.display_name,
        'photoURL': user.photo_url,
        'bio': user.bio,
        'location': user.location,
        'isOnline': user.is_online,
        'lastSeen': user.last_seen.isoformat() if user.last_seen else None,
        'createdAt': user.created_at.isoformat() if user.created_at else None
    }

def group_to_dict(group):
    member_count = GroupMember.query.filter_by(group_id=group.id).count()
    return {
        'id': group.id,
        'name': group.name,
        'description': group.description,
        'isPrivate': group.is_private,
        'category': group.category,
        'creatorId': group.creator_id,
        'avatarUrl': group.avatar_url,
        'memberCount': member_count,
        'createdAt': group.created_at.isoformat() if group.created_at else None
    }

def message_to_dict(message):
    return {
        'id': message.id,
        'content': message.content,
        'type': message.message_type,
        'authorId': message.author_id,
        'groupId': message.group_id,
        'replyTo': message.reply_to,
        'createdAt': message.created_at.isoformat() if message.created_at else None,
        'author': {
            'id': message.author.id,
            'displayName': message.author.display_name,
            'photoURL': message.author.photo_url
        }
    }

# Authentication Routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        email = data.get('email')
        username = data.get('username')
        password = data.get('password')
        
        if not all([email, username, password]):
            return jsonify({'error': 'Missing required fields'}), 400
            
        # Check if user exists
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already registered'}), 409
            
        if User.query.filter_by(username=username).first():
            return jsonify({'error': 'Username already taken'}), 409
        
        # Create new user
        user = User(
            id=str(uuid.uuid4()),
            email=email,
            username=username,
            display_name=username,
            password_hash=generate_password_hash(password)
        )
        
        db.session.add(user)
        db.session.commit()
        
        # Create access token
        token = create_access_token(identity=user.id)
        
        return jsonify({
            'message': 'User registered successfully',
            'token': token,
            'user': user_to_dict(user)
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not all([email, password]):
            return jsonify({'error': 'Missing email or password'}), 400
        
        user = User.query.filter_by(email=email).first()
        
        if not user or not check_password_hash(user.password_hash, password):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Update user status
        user.is_online = True
        user.last_seen = datetime.utcnow()
        db.session.commit()
        
        # Create access token
        token = create_access_token(identity=user.id)
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': user_to_dict(user)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/logout', methods=['POST'])
@jwt_required()
def logout():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if user:
            user.is_online = False
            user.last_seen = datetime.utcnow()
            db.session.commit()
        
        return jsonify({'message': 'Logout successful'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# User Routes
@app.route('/api/user/profile', methods=['GET'])
@jwt_required()
def get_profile():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({'user': user_to_dict(user)}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/user/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        if 'displayName' in data:
            user.display_name = data['displayName']
        if 'bio' in data:
            user.bio = data['bio']
        if 'location' in data:
            user.location = data['location']
        if 'photoURL' in data:
            user.photo_url = data['photoURL']
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': user_to_dict(user)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Group Routes
@app.route('/api/groups', methods=['GET'])
@jwt_required()
def get_groups():
    try:
        user_id = get_jwt_identity()
        
        # Get user's groups
        user_groups = db.session.query(Group).join(GroupMember).filter(
            GroupMember.user_id == user_id
        ).all()
        
        # Get public groups (not joined)
        joined_group_ids = [g.id for g in user_groups]
        public_groups = Group.query.filter(
            Group.is_private == False,
            ~Group.id.in_(joined_group_ids)
        ).limit(20).all()
        
        return jsonify({
            'userGroups': [group_to_dict(group) for group in user_groups],
            'publicGroups': [group_to_dict(group) for group in public_groups]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/groups', methods=['POST'])
@jwt_required()
def create_group():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        name = data.get('name')
        description = data.get('description', '')
        is_private = data.get('isPrivate', False)
        category = data.get('category', 'General')
        
        if not name:
            return jsonify({'error': 'Group name is required'}), 400
        
        # Create group
        group = Group(
            name=name,
            description=description,
            is_private=is_private,
            category=category,
            creator_id=user_id
        )
        
        db.session.add(group)
        db.session.flush()  # Get the ID
        
        # Add creator as owner
        member = GroupMember(
            group_id=group.id,
            user_id=user_id,
            role='owner'
        )
        
        db.session.add(member)
        db.session.commit()
        
        return jsonify({
            'message': 'Group created successfully',
            'group': group_to_dict(group)
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/groups/<group_id>/join', methods=['POST'])
@jwt_required()
def join_group():
    try:
        user_id = get_jwt_identity()
        group = Group.query.get(group_id)
        
        if not group:
            return jsonify({'error': 'Group not found'}), 404
        
        # Check if already a member
        existing_member = GroupMember.query.filter_by(
            group_id=group_id,
            user_id=user_id
        ).first()
        
        if existing_member:
            return jsonify({'error': 'Already a member'}), 409
        
        # Add member
        member = GroupMember(
            group_id=group_id,
            user_id=user_id,
            role='member'
        )
        
        db.session.add(member)
        db.session.commit()
        
        return jsonify({'message': 'Joined group successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Message Routes
@app.route('/api/groups/<group_id>/messages', methods=['GET'])
@jwt_required()
def get_messages():
    try:
        user_id = get_jwt_identity()
        
        # Check if user is member
        member = GroupMember.query.filter_by(
            group_id=group_id,
            user_id=user_id
        ).first()
        
        if not member:
            return jsonify({'error': 'Access denied'}), 403
        
        # Get messages
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        
        messages = Message.query.filter_by(group_id=group_id).order_by(
            Message.created_at.desc()
        ).paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        return jsonify({
            'messages': [message_to_dict(msg) for msg in reversed(messages.items)],
            'hasNext': messages.has_next,
            'hasPrev': messages.has_prev,
            'page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/groups/<group_id>/messages', methods=['POST'])
@jwt_required()
def send_message():
    try:
        user_id = get_jwt_identity()
        
        # Check if user is member
        member = GroupMember.query.filter_by(
            group_id=group_id,
            user_id=user_id
        ).first()
        
        if not member:
            return jsonify({'error': 'Access denied'}), 403
        
        data = request.get_json()
        content = data.get('content', '').strip()
        message_type = data.get('type', 'text')
        reply_to = data.get('replyTo')
        
        if not content:
            return jsonify({'error': 'Message content is required'}), 400
        
        # Create message
        message = Message(
            content=content,
            message_type=message_type,
            author_id=user_id,
            group_id=group_id,
            reply_to=reply_to
        )
        
        db.session.add(message)
        db.session.commit()
        
        # Broadcast to Redis if available
        if redis_client:
            message_data = message_to_dict(message)
            redis_client.publish(f'group:{group_id}', json.dumps(message_data))
        
        return jsonify({
            'message': 'Message sent successfully',
            'data': message_to_dict(message)
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Health check
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0'
    }), 200

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({'error': 'Token has expired'}), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({'error': 'Invalid token'}), 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({'error': 'Authorization token is required'}), 401

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
