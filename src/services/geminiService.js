import { db, auth } from '../config/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

class GeminiService {
  constructor() {
    this.conversationHistory = new Map();
  }

  async chat(message, context = {}) {
    try {
      const systemPrompt = this.buildSystemPrompt(context);
      const conversationId = context.crewId || 'general';
      const history = this.conversationHistory.get(conversationId) || [];
      
      const messages = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        ...history,
        { role: 'user', parts: [{ text: message }] }
      ];

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: messages,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, but I could not generate a response.';

      history.push(
        { role: 'user', parts: [{ text: message }] },
        { role: 'model', parts: [{ text: aiResponse }] }
      );
      
      if (history.length > 20) history.splice(0, 2);
      this.conversationHistory.set(conversationId, history);

      return { success: true, response: aiResponse };
    } catch (error) {
      console.error('Gemini chat error:', error);
      return { success: false, error: error.message };
    }
  }

  buildSystemPrompt(context) {
    let prompt = `You are CrewBot, an intelligent AI assistant for CrewConnect - a team collaboration and matchmaking platform. 
You help users find teammates, build effective teams, and collaborate on projects.

Your capabilities:
- Help users find team members with specific skills
- Provide advice on team composition and dynamics
- Answer questions about using the platform
- Summarize conversations and meetings
- Suggest collaboration strategies

Be friendly, professional, and concise. Focus on actionable advice.`;

    if (context.crewName) {
      prompt += `\n\nYou are currently assisting in the crew: "${context.crewName}"`;
    }
    if (context.userSkills?.length) {
      prompt += `\nThe user has these skills: ${context.userSkills.join(', ')}`;
    }
    if (context.teamMembers?.length) {
      prompt += `\nTeam members: ${context.teamMembers.map(m => `${m.name} (${m.skills?.join(', ') || 'no skills listed'})`).join('; ')}`;
    }

    return prompt;
  }

  async parseResume(resumeText) {
    try {
      const prompt = `Analyze this resume and extract structured information. Return a JSON object with these exact fields:
{
  "personalInfo": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedin": "string or null",
    "github": "string or null",
    "portfolio": "string or null"
  },
  "summary": "brief professional summary in 2-3 sentences",
  "skills": [
    { "name": "skill name", "category": "technical/soft/language/tool", "level": "beginner/intermediate/advanced/expert" }
  ],
  "experience": [
    {
      "title": "job title",
      "company": "company name",
      "duration": "start - end",
      "highlights": ["achievement 1", "achievement 2"]
    }
  ],
  "education": [
    {
      "degree": "degree name",
      "institution": "school name",
      "year": "graduation year"
    }
  ],
  "projects": [
    {
      "name": "project name",
      "description": "brief description",
      "technologies": ["tech1", "tech2"]
    }
  ],
  "certifications": ["cert1", "cert2"],
  "languages": ["language1", "language2"]
}

Resume text:
${resumeText}

Return ONLY the JSON object, no other text.`;

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048,
          }
        })
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Could not parse resume response');
      
      const parsed = JSON.parse(jsonMatch[0]);
      return { success: true, data: parsed };
    } catch (error) {
      console.error('Resume parsing error:', error);
      return { success: false, error: error.message };
    }
  }

  async analyzeTeamCompatibility(user1Skills, user2Skills) {
    try {
      const prompt = `Analyze the compatibility between two team members based on their skills.

User 1 skills: ${JSON.stringify(user1Skills)}
User 2 skills: ${JSON.stringify(user2Skills)}

Return a JSON object:
{
  "compatibilityScore": 0-100,
  "complementarySkills": ["skills user2 has that complement user1"],
  "overlappingSkills": ["shared skills"],
  "skillGaps": ["areas neither covers well"],
  "collaborationPotential": "high/medium/low",
  "recommendation": "brief recommendation for working together"
}

Return ONLY the JSON object.`;

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 1024 }
        })
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Could not parse compatibility response');
      
      return { success: true, data: JSON.parse(jsonMatch[0]) };
    } catch (error) {
      console.error('Compatibility analysis error:', error);
      return { success: false, error: error.message };
    }
  }

  async suggestTeamMembers(projectRequirements, availableUsers) {
    try {
      const prompt = `You are a team composition expert. Based on project requirements, suggest the best team from available users.

Project Requirements:
${JSON.stringify(projectRequirements, null, 2)}

Available Users:
${JSON.stringify(availableUsers.map(u => ({
  id: u.id,
  name: u.displayName,
  skills: u.skills,
  availability: u.availability
})), null, 2)}

Return a JSON object:
{
  "suggestedTeam": [
    { "userId": "id", "role": "suggested role", "reason": "why this person fits" }
  ],
  "teamStrengths": ["strength1", "strength2"],
  "potentialChallenges": ["challenge1"],
  "missingSkills": ["skill not covered"],
  "overallFitScore": 0-100
}

Return ONLY the JSON object.`;

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 2048 }
        })
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Could not parse team suggestion response');
      
      return { success: true, data: JSON.parse(jsonMatch[0]) };
    } catch (error) {
      console.error('Team suggestion error:', error);
      return { success: false, error: error.message };
    }
  }

  async summarizeConversation(messages) {
    try {
      const messageText = messages.map(m => `${m.senderName}: ${m.content}`).join('\n');
      
      const prompt = `Summarize this team conversation concisely. Highlight key decisions, action items, and important points.

Conversation:
${messageText}

Return a JSON object:
{
  "summary": "2-3 sentence summary",
  "keyPoints": ["point1", "point2"],
  "actionItems": ["action1", "action2"],
  "decisions": ["decision1"],
  "sentiment": "positive/neutral/negative"
}

Return ONLY the JSON object.`;

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1024 }
        })
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Could not parse summary response');
      
      return { success: true, data: JSON.parse(jsonMatch[0]) };
    } catch (error) {
      console.error('Summarization error:', error);
      return { success: false, error: error.message };
    }
  }

  async generateSkillRecommendations(userSkills, targetRole) {
    try {
      const prompt = `Based on a user's current skills and target role, suggest skills to learn.

Current Skills: ${JSON.stringify(userSkills)}
Target Role: ${targetRole}

Return a JSON object:
{
  "recommendedSkills": [
    { "name": "skill", "priority": "high/medium/low", "reason": "why learn this" }
  ],
  "learningPath": ["step1", "step2", "step3"],
  "estimatedTimeline": "timeframe to reach target role",
  "currentReadiness": 0-100
}

Return ONLY the JSON object.`;

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 1024 }
        })
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Could not parse recommendations');
      
      return { success: true, data: JSON.parse(jsonMatch[0]) };
    } catch (error) {
      console.error('Skill recommendation error:', error);
      return { success: false, error: error.message };
    }
  }

  clearConversation(conversationId) {
    this.conversationHistory.delete(conversationId);
  }
}

export const geminiService = new GeminiService();
export default geminiService;
