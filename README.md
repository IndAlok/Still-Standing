# 🚀 CrewConnect

<div align="center">

[![React](https://img.shields.io/badge/React-18.0-61dafb?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-V10-ffca28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Gemini AI](https://img.shields.io/badge/Google%20Gemini-1.5%20Flash-4285f4?style=for-the-badge&logo=google)](https://deepmind.google/technologies/gemini/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.0-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
[![Hackathon](https://img.shields.io/badge/🏆_Rank_1-CanYouHackIt_2025-gold?style=for-the-badge)](https://github.com/IndAlok/Still-Standing)

**The AI-Powered Collaborative Ecosystem for High-Performance Teams**

> **🏆 Winner of CanYouHackIt 2025 Hackathon - Ranked #1**

[View Demo](#) · [Report Bug](https://github.com/IndAlok/Still-Standing/issues) · [Request Feature](https://github.com/IndAlok/Still-Standing/issues)

</div>

---

## Overview

**CrewConnect** redefines how teams form and collaborate. Unlike traditional group chats, it leverages **Generative AI (Google Gemini 1.5 Flash)** to intelligently build teams, parse resumes, analyze skill gaps, and facilitate high-performance collaboration.

Designed as a **production-grade application**, it solves the "cold start" problem in project collaboration: *How do you find the right people with the right skills at the right time?*

> **"It's not just a chat app; it's an intelligent team orchestration platform."**

## Key Advanced Features

### Intelligent Team Orchestration
*   **AI-Powered Team Builder**: A sophisticated 3-step wizard that intakes project requirements and uses Gemini to recommend the optimal combination of available users.
*   **Semantic Skill Matching**: Goes beyond keyword matching. The system analyzes the *nuance* of skills (e.g., "React" implies "JavaScript" proficiency) to calculate a weighted **Compatibility Score**.
*   **Gap Analysis Engine**: Automatically identifies missing critical skills in a proposed team and suggests candidates who fill those specific voids.

### Smart Profile & Resume System
*   **Advanced AI Resume Parser**: Upload PDF, DOCX, or TXT files. The Gemini-powered parser extracts personal info, experience, projects, certifications, and categorizes 10+ skill types with proficiency levels.
*   **Confidence Scoring**: Each parsed resume gets a confidence score (0-100%) indicating extraction accuracy.
*   **Skill Endorsement Protocol**: A trust-based system where teammates verify each other's expertise, adding a layer of social credibility.
*   **Dynamic Portfolio Aggregation**: Centralizes GitHub, LinkedIn, and personal portfolio links.

### "CrewBot" - The Context-Aware Assistant
Every team gets a dedicated AI assistant that:
*   Maintains conversation context across sessions.
*   Summarizes long chat threads into actionable bullet points.
*   Provides technical architectural advice based on the team's skillset.
*   Offers quick actions for common queries.

### Persistent User Settings
*   **Notification Preferences**: Email, push, sound, desktop notifications - all persisted to Firestore.
*   **Appearance Customization**: Dark/Light/Auto theme with instant application.
*   **Privacy Controls**: Profile visibility, activity status, friend request permissions.
*   **Language & Region**: Timezone, date format, and interface language settings.

## Technical Architecture

### Tech Stack

| Domain | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend** | React 18, Create React App | High-performance SPA rendering with concurrent features. |
| **Styling** | TailwindCSS + Framer Motion | Utility-first CSS for maintainability; hardware-accelerated animations. |
| **Backend / DB** | Firebase (Firestore, Auth, Storage) | Serverless scalability; native real-time websocket capabilities. |
| **AI Model** | Google Gemini 1.5 Flash | Low latency, high throughput token generation for real-time interactions. |
| **State Mgmt** | React Context API | Global state for Auth and Notifications without Redux boilerplate. |

### Service Architecture

```
src/services/
├── geminiService.js      # AI: Chat, resume parsing, compatibility analysis
├── matchingService.js    # Compatibility scoring, team optimization
├── skillService.js       # Skill taxonomy, endorsements, search
├── settingsService.js    # User settings persistence
├── storageService.js     # Profile pictures, resume uploads
└── crewConnectService.js # Core Firestore operations
```

### Database Schema

```javascript
users/{userId} {
  displayName, email, bio, location,
  skills: [{ name, level, category, endorsements }],
  portfolio: { github, linkedin, website },
  resumeData: { ... }
}

userSettings/{userId} {
  notifications: { email, push, sound, ... },
  appearance: { theme, fontSize },
  privacy: { profileVisibility, activityStatus },
  language: { timezone, dateFormat }
}

groups/{groupId} {
  name, description, isPublic,
  createdBy, members[], memberCount
}
```

## Quick Start

### Prerequisites
*   Node.js v18+
*   Firebase Project (Blaze Plan not required for basic features)
*   Google Gemini API Key

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/IndAlok/Still-Standing.git
    cd Still-Standing
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Environment Configuration**
    Create a `.env` file in the root directory:
    ```env
    REACT_APP_FIREBASE_API_KEY=your_key
    REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    REACT_APP_FIREBASE_PROJECT_ID=your_id
    REACT_APP_FIREBASE_STORAGE_BUCKET=your_bucket
    REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    REACT_APP_FIREBASE_APP_ID=your_app_id
    REACT_APP_GEMINI_API_KEY=your_gemini_key
    ```

4.  **Start Development Server**
    ```bash
    npm start
    ```

## Security & Performance

*   **Route Protection**: Protected routes ensure authenticated access only.
*   **Input Sanitization**: All user inputs and AI outputs are validated.
*   **Settings Persistence**: All user preferences saved to Firestore with proper security rules.
*   **Theme Consistency**: Dark mode by default with proper contrast ratios throughout the app.

## Roadmap

*   [ ] **Mobile Native**: React Native port for iOS/Android.
*   [ ] **Video Integration**: WebRTC integration for in-app team standups.
*   [ ] **GitHub Integration**: Auto-sync contributions to skill scores.

---

<div align="center">

**Developed with ❤️ by IndAlok**

</div>
