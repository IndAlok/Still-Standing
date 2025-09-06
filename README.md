# CrewConnect - Still Standing

A modern, real-time group chat application built with React and Firebase, featuring Google authentication, group management, and real-time messaging.

## 🚀 Features

### Authentication
- **Firebase Authentication** with Google Sign-In
- **Email/Password** authentication
- **Password Reset** functionality
- **Protected Routes** with automatic redirects

### User Management
- **User Profiles** with customizable bio, location, and avatar
- **Online Status** tracking
- **Profile Management** with real-time updates

### Group Management
- **Create Groups** with privacy settings (public/private)
- **Join Public Groups** or get invited to private ones
- **Group Categories** for better organization
- **Member Roles** (Owner, Admin, Member)

### Real-time Chat
- **Instant Messaging** with Firebase Firestore
- **Message History** with pagination
- **Typing Indicators** (when implemented)
- **Online Member Lists**

### Modern UI/UX
- **Responsive Design** with TailwindCSS
- **Dark Theme** with glassmorphism effects
- **Smooth Animations** with Framer Motion
- **Loading States** and error handling

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI Framework
- **Firebase 10** - Backend as a Service
- **React Router Dom** - Navigation
- **TailwindCSS** - Styling
- **Lucide React** - Icons
- **Framer Motion** - Animations

### Backend (Optional - Flask API)
- **Flask** - Python web framework
- **SQLAlchemy** - ORM
- **PostgreSQL** - Database
- **Redis** - Caching and real-time features
- **JWT** - Token-based authentication

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container setup

## 📋 Prerequisites

- Node.js 16+ and npm
- Firebase Project (for authentication and database)
- Docker & Docker Compose (for backend)
- Python 3.11+ (if running backend locally)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Himarghya/Still-Standing.git
cd Still-Standing
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication with Google provider
4. Create a Firestore database
5. Get your Firebase config and update `.env`

### 3. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your Firebase config
# REACT_APP_FIREBASE_API_KEY=your_api_key
# REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
# etc...
```

### 4. Install Dependencies

```bash
# Install frontend dependencies
npm install
```

### 5. Start Development

```bash
# Start React development server
npm start
```

The app will open at `http://localhost:3000`
<<<<<<< HEAD
=======
### AI-MATCHMAKER
```bash
cd Backend
python app.py
```
**curl request
curl -X POST http://127.0.0.1:5000/api/ai-matchmaker \
  -H "Content-Type: multipart/form-data" \
  -F "file=@C:/Users/HP/Desktop/SS/Still-Standing/Backend/dataset/participants.csv" \
  -F "participant_id=P_001" \
  -F "required_domains=[\"frontend\",\"backend\"]" \
  -F "required_skills=[\"Python\",\"React\"]" \
  -F "team_size=4"
>>>>>>> a5a4a980a54c67967adb708c716561c776c1d8eb

## 🐳 Docker Setup

### Option 1: Frontend + Backend with Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Option 2: Frontend Only (Recommended)

Since we're using Firebase as our primary backend, you can run just the frontend:

```bash
npm start
```

## 📁 Project Structure

```
Still-Standing/
├── public/                 # Static files
├── src/                    # React source code
│   ├── components/         # Reusable components
│   │   ├── LoadingSpinner.jsx
│   │   └── ProtectedRoute.jsx
│   ├── config/            # Configuration files
│   │   └── firebase.js    # Firebase configuration
│   ├── contexts/          # React contexts
│   │   └── AuthContext.jsx # Authentication context
│   ├── pages/             # Page components
│   │   ├── Chat/          # Chat page
│   │   ├── Dashboard/     # Dashboard page
│   │   ├── Groups/        # Groups page
│   │   ├── Login/         # Authentication pages
│   │   ├── Profile/       # Profile page
│   │   └── Settings/      # Settings page
│   ├── App.jsx            # Main app component
│   ├── index.js          # App entry point
│   └── index.css         # Global styles
├── Backend/               # Flask API (optional)
│   └── app.py            # Flask application
├── docker-compose.yml     # Docker services
├── Dockerfile            # Docker configuration
├── package.json          # Dependencies
├── tailwind.config.js    # TailwindCSS config
└── README.md            # This file
```

## 🔧 Configuration

### Firebase Configuration

Update your `.env` file with Firebase credentials:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
REACT_APP_FIREBASE_PROJECT_ID=your_project_id_here
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
REACT_APP_FIREBASE_APP_ID=your_app_id_here
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id_here
```

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Groups are readable by members, writable by admins/owners
    match /groups/{groupId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        resource.data.members[request.auth.uid].role in ['owner', 'admin'];
    }
    
    // Messages are readable by group members
    match /groups/{groupId}/messages/{messageId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🎨 Available Scripts

### Development

```bash
npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests
npm run eject      # Eject from Create React App
```

### Docker

```bash
docker-compose up -d              # Start services
docker-compose down               # Stop services
docker-compose logs -f web        # View logs
docker-compose exec web bash      # Shell into container
```

## 🔐 Authentication Flow

1. **Sign Up**: Users register with email/password or Google
2. **Sign In**: Authentication via Firebase Auth
3. **Profile Creation**: User data stored in Firestore
4. **Protected Routes**: Automatic redirect to login if not authenticated
5. **Session Management**: Persistent login across browser sessions

## 💬 Chat Features

### Current Features
- Real-time messaging with Firestore
- Group-based conversations
- Message history and pagination
- Online status indicators
- User avatars and display names

### Planned Features
- File and image sharing
- Message reactions and replies
- Voice and video calls
- Message encryption
- Push notifications

## 🎯 Development Roadmap

### Phase 1: Core Features ✅
- [x] Authentication system
- [x] User profiles
- [x] Group management
- [x] Real-time chat
- [x] Responsive design

### Phase 2: Enhanced Features 🚧
- [ ] File sharing
- [ ] Voice/Video calls
- [ ] Push notifications
- [ ] Advanced search
- [ ] Message reactions

### Phase 3: Advanced Features 📋
- [ ] Message encryption
- [ ] Bot integration
- [ ] Analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Advanced moderation tools

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

**Firebase Connection Issues**
```bash
# Check your Firebase config in .env
# Ensure Firestore is enabled in Firebase Console
# Check browser console for detailed errors
```

**Build Failures**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Docker Issues**
```bash
# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Getting Help

- Check the [Issues](https://github.com/Himarghya/Still-Standing/issues) page
- Create a new issue with detailed description
- Join our community discussions

## 🌟 Acknowledgments

- Firebase team for excellent BaaS platform
- React community for amazing ecosystem
- TailwindCSS for beautiful styling utilities
- All contributors and users of this project

---

**Built with ❤️ by the Still-Standing team** 🤝

**Smart Team Matchmaking Platform**

Too often, great ideas and exciting opportunities die before they start — not for lack of passion, but for lack of people. Still-Standing solves this by connecting individuals with the right teammates based on skills, availability, and shared goals.

## 🎯 Problem Statement

Finding the right collaborators in time can be a challenge, whether it's for:
- 5-player gaming matches
- Hackathon teams
- Study groups
- Project collaborations
- Community events

This leaves individuals feeling isolated, even in thriving communities, and events falling short of their potential.

## ✨ Key Features

### 🧠 Smart Matchmaking
- AI-powered algorithm that matches teammates based on complementary skills
- Goal-oriented pairing for optimal team composition
- Compatibility scoring system

### 🏆 Skill Showcase
- Comprehensive skill profiles and portfolios
- Achievement and project highlighting
- Peer endorsement system
- Real-time skill verification

### ⏰ Time-Based Matching
- Availability synchronization
- Time zone compatibility
- Event scheduling integration
- Deadline-aware matching

### 🌐 Community Integration
- Seamless connection with events, clubs, and organizations
- Gaming lobby integration
- Academic group formation
- Professional networking

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ or Python 3.8+
- Database (MongoDB/PostgreSQL)
- Redis for caching

### Installation

```bash
# Clone the repository
git clone https://github.com/Himarghya/Still-Standing.git
cd Still-Standing

# Install dependencies
npm install
# or
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npm run migrate
# or
python manage.py migrate

# Start the development server
npm run dev
# or
python manage.py runserver
```

### Configuration

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL=your_database_url
REDIS_URL=your_redis_url

# Authentication
JWT_SECRET=your_jwt_secret
OAUTH_GITHUB_CLIENT_ID=your_github_client_id
OAUTH_GITHUB_CLIENT_SECRET=your_github_client_secret

# External APIs
DISCORD_BOT_TOKEN=your_discord_token
SLACK_BOT_TOKEN=your_slack_token

# Matching Algorithm
ML_MODEL_ENDPOINT=your_ml_endpoint
RECOMMENDATION_THRESHOLD=0.7
```

## 🏗️ Architecture

### Backend Components
- **User Management**: Authentication, profiles, preferences
- **Matching Engine**: ML-based teammate recommendation system
- **Event Integration**: Calendar sync, availability tracking
- **Communication**: Real-time messaging, notifications
- **Analytics**: Performance tracking, success metrics

### Frontend Components
- **Dashboard**: Personal overview, recommendations
- **Profile Builder**: Skill showcase, portfolio management
- **Team Formation**: Browse, match, and connect
- **Event Calendar**: Schedule management, availability
- **Communication Hub**: Chat, video calls, collaboration tools

### Database Schema
- Users (profiles, skills, availability)
- Teams (compositions, projects, goals)
- Events (hackathons, matches, meetups)
- Matches (recommendations, compatibility scores)
- Skills (taxonomy, endorsements, verification)

## 📊 Matching Algorithm

The core matching algorithm considers:

1. **Skill Complementarity** (40%)
   - Technical skill gaps
   - Experience level balance
   - Domain expertise overlap

2. **Availability Alignment** (25%)
   - Time zone compatibility
   - Schedule synchronization
   - Commitment level matching

3. **Goal Compatibility** (20%)
   - Project objectives
   - Competition/collaboration preferences
   - Long-term vs short-term goals

4. **Social Compatibility** (15%)
   - Communication style
   - Work preferences
   - Past collaboration success

## 🎮 Use Cases

### Gaming Teams
- Competitive esports team formation
- Casual gaming groups
- Tournament squad assembly
- Cross-platform gaming communities

### Academic Collaboration
- Study group formation
- Research project teams
- Peer tutoring matches
- Academic competition teams

### Professional Development
- Hackathon team assembly
- Side project collaboration
- Skill exchange partnerships
- Mentorship matching

### Community Events
- Volunteer coordination
- Social group formation
- Interest-based meetups
- Local activity organization

## 🔧 API Documentation

### Authentication Endpoints
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
DELETE /api/auth/logout
```

### User Management
```
GET /api/users/profile
PUT /api/users/profile
POST /api/users/skills
GET /api/users/recommendations
```

### Matching System
```
POST /api/matches/find
GET /api/matches/suggestions
POST /api/matches/accept
DELETE /api/matches/decline
```

### Team Operations
```
POST /api/teams/create
GET /api/teams/:id
PUT /api/teams/:id/join
DELETE /api/teams/:id/leave
```

## 🧪 Testing

```bash
# Run unit tests
npm test
# or
python -m pytest

# Run integration tests
npm run test:integration
# or
python -m pytest tests/integration/

# Run end-to-end tests
npm run test:e2e
# or
python -m pytest tests/e2e/
```

## 📈 Metrics & Analytics

Key performance indicators:
- **Match Success Rate**: Percentage of successful team formations
- **User Retention**: Active user engagement over time
- **Event Completion**: Projects/events successfully completed
- **Satisfaction Score**: User feedback and ratings
- **Time to Match**: Average time to find suitable teammates

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow the established code style
- Write comprehensive tests
- Update documentation as needed
- Ensure backward compatibility

## 🎨 UI/UX Design

### Design Principles
- **Simplicity**: Intuitive interface, minimal friction
- **Trust**: Transparent matching process, verified profiles
- **Engagement**: Gamification elements, achievement systems
- **Accessibility**: WCAG 2.1 AA compliance, inclusive design

### Color Scheme
- Primary: #2563EB (Blue)
- Secondary: #10B981 (Green)
- Accent: #F59E0B (Amber)
- Neutral: #6B7280 (Gray)

## 🔒 Security & Privacy

- End-to-end encryption for sensitive communications
- GDPR compliance for data protection
- OAuth 2.0 authentication
- Regular security audits and penetration testing
- User data anonymization options

## 📱 Mobile Support

- Progressive Web App (PWA) compatibility
- Native mobile apps (iOS/Android) planned
- Responsive design for all screen sizes
- Offline functionality for core features

## 🌍 Internationalization

- Multi-language support
- Localized time zones and date formats
- Cultural compatibility considerations
- Regional event integration

## 📞 Support & Community

- **Documentation**: [docs.stillstanding.dev](https://docs.stillstanding.dev)
- **Community Forum**: [community.stillstanding.dev](https://community.stillstanding.dev)
- **Discord Server**: [discord.gg/stillstanding](https://discord.gg/stillstanding)
- **Email Support**: support@stillstanding.dev

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Machine Learning models powered by TensorFlow/PyTorch
- Real-time features built with Socket.io/WebSockets
- UI components from Material-UI/Tailwind CSS
- Community feedback and beta testing contributors

## 🗺️ Roadmap

### Phase 1 (Current)
- [x] Core matching algorithm
- [x] Basic user profiles
- [x] Team formation features
- [ ] Mobile responsiveness

### Phase 2 (Q2 2024)
- [ ] Advanced skill verification
- [ ] Video calling integration
- [ ] Event calendar sync
- [ ] Analytics dashboard

### Phase 3 (Q3 2024)
- [ ] AI-powered recommendations
- [ ] Native mobile apps
- [ ] Enterprise features
- [ ] API for third-party integrations

### Phase 4 (Q4 2024)
- [ ] Machine learning optimization
- [ ] Global expansion
- [ ] Advanced matchmaking algorithms
- [ ] Community marketplace

---

**Made with ❤️ by the Still-Standing Team**

*Turning individual ambition into collective achievement*
