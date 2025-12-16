# CrewConnect

CrewConnect is an AI-powered team matchmaking and collaboration platform that uses Google's Gemini AI to intelligently match teammates, analyze skills, and build optimal project teams.

## Key Features

### AI-Powered Intelligence
- **CrewBot Assistant** - Context-aware AI chatbot available in every crew
- **Smart Matching** - ML-powered compatibility scoring between users
- **Resume Parser** - Automatically extract skills from uploaded resumes using Gemini AI
- **Conversation Summarization** - AI-generated summaries of team discussions
- **Skill Recommendations** - Personalized learning path suggestions

### Intelligent Team Building
- **Team Builder Wizard** - 3-step AI-guided team composition
- **Compatibility Scoring** - Match percentage based on complementary skills
- **Skill Gap Analysis** - Identify missing capabilities in your team
- **Optimal Team Suggestions** - AI recommends the best team composition

### Advanced Profile System
- **Skill Management** - Add, remove, and categorize skills with proficiency levels
- **Skill Endorsements** - Get endorsed by teammates for credibility
- **Portfolio Integration** - Link GitHub, LinkedIn, and personal websites
- **AI Resume Import** - Upload resume and auto-populate skills

### Real-Time Collaboration
- **Instant Messaging** - Real-time group chat with Firebase Firestore
- **Message Reactions** - React to messages
- **Threaded Replies** - Organized conversation threads
- **AI Summaries** - One-click conversation summaries

### Group Management
- **Public/Private Groups** - Create teams with visibility settings
- **Role-Based Access** - Owner, admin, and member permissions
- **Invitation System** - Invite by email with custom messages
- **Join Requests** - Approve/reject membership requests

## Tech Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | React 18, TailwindCSS, Framer Motion |
| **Backend** | Firebase (Firestore, Auth, Storage) |
| **AI/ML** | Google Gemini 1.5 Flash API |
| **Icons** | Lucide React |
| **Routing** | React Router DOM v6 |

## Quick Start

### Prerequisites
- Node.js 18+
- Firebase Project with Firestore, Auth, and Storage enabled
- Gemini API Key

### Installation

```bash
git clone https://github.com/Himarghya/Still-Standing.git
cd Still-Standing
npm install
```

### Configuration

Create a `.env` file in the root directory:

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Gemini AI
REACT_APP_GEMINI_API_KEY=your_gemini_api_key
```

### Run Development Server

```bash
npm start
```

Access at `http://localhost:3000`

## Project Structure

```
src/
├── components/
│   ├── AIChat/           # CrewBot AI assistant
│   ├── MatchCard/        # User compatibility cards
│   ├── SkillBadge/       # Skill display components
│   └── ...
├── contexts/
│   ├── AuthContext.jsx   # Authentication state
│   └── NotificationContext.jsx
├── pages/
│   ├── Chat/             # Real-time messaging
│   ├── Dashboard/        # User dashboard
│   ├── Discover/         # Find groups/users
│   ├── Groups/           # Group management
│   ├── Profile/          # User profile with skills
│   ├── TeamBuilder/      # AI team composition
│   └── ...
└── services/
    ├── geminiService.js  # Gemini AI integration
    ├── matchingService.js # Compatibility algorithms
    ├── skillService.js   # Skill management
    └── crewConnectService.js # Firebase operations
```

## AI Features Deep Dive

### CrewBot Assistant
The AI assistant uses Gemini 1.5 Flash with conversation history and context awareness:
- Understands team composition and member skills
- Provides personalized recommendations
- Answers platform-related questions
- Suggests collaboration strategies

### Smart Matching Algorithm
The compatibility scoring considers:
- **Complementary Skills** (50%) - Skills that complement each other
- **Skill Overlap** (30%) - Common ground for collaboration
- **Category Diversity** (20%) - Range of skill categories covered

### Resume Parsing
Uses Gemini to extract:
- Personal information (name, email, links)
- Technical and soft skills with proficiency levels
- Work experience and education
- Projects and certifications

## Security

- Firebase Authentication with Google Sign-In
- Firestore Security Rules for data protection
- Environment variables for sensitive keys
- XSS protection headers in Vercel deployment

## Deployment

### Vercel (Recommended)

```bash
npm i -g vercel
vercel
```

Add environment variables in Vercel Dashboard -> Settings -> Environment Variables.

The included `vercel.json` handles SPA routing and security headers.

## Database Schema

```
/users/{userId}
├── displayName, email, bio, location
├── skills: [{ name, level, category, endorsements[] }]
├── portfolio: { github, linkedin, website }
└── resumeData: { ... }

/groups/{groupId}
├── name, description, isPublic
├── createdBy, createdAt
└── memberCount

/messages/{messageId}
├── crewId, content, senderId
├── reactions: { emoji: [userIds] }
└── thread: [{ content, senderId }]
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.
