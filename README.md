# 🚀 CrewConnect

<div align="center">

[![React](https://img.shields.io/badge/React-18.0-61dafb?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-V10-ffca28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Gemini AI](https://img.shields.io/badge/Google%20Gemini-1.5%20Flash-4285f4?style=for-the-badge&logo=google)](https://deepmind.google/technologies/gemini/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.0-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

**The AI-Powered Collaborative Ecosystem for High-Performance Teams**

[View Demo](#) · [Report Bug](https://github.com/IndAlok/Still-Standing/issues) · [Request Feature](https://github.com/IndAlok/Still-Standing/issues)

</div>

---

## Overview

**CrewConnect** redefines how teams form and collaborate. Unlike traditional group chats, it leverages **Generative AI (Google Gemini)** to intelligently build teams, analyze skill gaps, and facilitate high-performance collaboration.

Designed as a **production-grade application**, it solves the "cold start" problem in project collaboration: *How do you finding the right people with the right skills at the right time?*

> **"It's not just a chat app; it's an intelligent team orchestration platform."**

## Key Advanced Features

### Intelligent Team Orchestration
*   **AI-Powered Team Builder**: A sophisticated wizard that intakes project requirements and uses Gemini to recommend the optimal combination of available users.
*   **Semantic Skill Matching**: Goes beyond keyword matching. The system analyzes the *nuance* of skills (e.g., "React" implies "JavaScript" proficiency) to calculate a weighted **Compatibility Score**.
*   **Gap Analysis Engine**: Automatically identifies missing critical skills in a proposed team and suggests candidates who fill those specific voids.

### Smart Profile & Resume System
*   **One-Click Resume Parsing**: Upload a PDF/Docx, and the system extracts personal info, experience, and categorizes skills into Technical, Soft, and Business domains using NLP.
*   **Skill Endorsement Protocol**: A trust-based system where teammates verify each other's expertise, adding a layer of social credibility.
*   **Dynamic Portfolio Aggregation**: Centralizes GitHub, LinkedIn, and personal portfolio links.

### "CrewBot" - The Context-Aware Assistant
Every team gets a dedicated AI assistant that:
*   Maintains conversation context.
*   Summarizes long chat threads into actionable bullet points.
*   Provides technical architectural advice based on the team's skillset.

## Technical Architecture

### Tech Stack

| Domain | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite | High-performance SPA rendering with concurrent features. |
| **Styling** | TailwindCSS + Framer Motion | Utility-first CSS for maintainability; hardware-accelerated animations. |
| **Backend / DB** | Firebase (Firestore, Auth, Storage) | Serverless scalability; native real-time websocket capabilities. |
| **AI Model** | Google Gemini 1.5 Flash | Low latency, high throughput token generation for real-time interactions. |
| **State Mgmt** | React Context API | Global state for Auth and Notifications without Redux boilerplate. |

### Database Schema (Simplified)

The application uses a NoSQL document-oriented structure optimized for read-heavy operations:

```javascript
// User Document Structure
users/{userId} {
  displayName: String,
  skills: [{ name, level, category, verified }], // Structured for AI analysis
  matches: [{ userId, score, timestamp }],       // Pre-computed edge caching
  availability: { status, hours }
}

// AI Context Storage
ai_conversations/{crewId} {
  context_window: String, // Rolling window of team context
  messages: Array         // History for the LLM
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

2.  **Install Production Dependencies**
    ```bash
    npm install
    ```

3.  **Environment Configuration**
    Create a `.env` file in the root directory:
    ```env
    REACT_APP_FIREBASE_API_KEY=your_key
    REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    REACT_APP_FIREBASE_PROJECT_ID=your_id
    REACT_APP_GEMINI_API_KEY=your_gemini_key
    ```

4.  **Ignite Development Server**
    ```bash
    npm start
    ```

## Security & Performance

*   **Route Protection**: Higher-Order Components (HOCs) ensure authorized access.
*   **Sanitization**: All user inputs and AI outputs are sanitized to prevent XSS.
*   **Code Splitting**: Dynamic imports used for heavy components (e.g., Team Builder) to optimize LCP (Largest Contentful Paint).

## Roadmap

*   [ ] **Mobile Native**: React Native port for iOS/Android.
*   [ ] **Video Integration**: WebRTC integration for in-app team standups.
*   [ ] **GitHub Integration**: Auto-sync contributions to skill scores.

---

<div align="center">

**Developed with ❤️ by IndAlok**

</div>
