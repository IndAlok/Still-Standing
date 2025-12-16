import { db, auth } from '../config/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

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

  async parseResume(resumeText, fileType = 'text/plain') {
    try {
      const cleanedText = this.preprocessResumeText(resumeText);
      
      if (cleanedText.length < 30) {
        throw new Error('Resume text is too short to parse');
      }

      const prompt = `You are an expert resume/CV parser with perfect accuracy. Parse the following resume and extract ALL information.

CRITICAL: You MUST extract every piece of information present. Do not skip anything. This includes:
- Full name, contact info, location
- Education with institutions, degrees, scores/GPA, dates
- ALL technical skills, programming languages, tools, frameworks
- ALL soft skills and competencies
- Work experience and internships
- Projects with descriptions and technologies used
- Certifications with issuers and dates
- Awards, honors, achievements
- Volunteering experience
- Languages spoken with proficiency levels
- Professional summary if present

Return a valid JSON object with this structure:
{
  "personalInfo": {
    "name": "extracted full name",
    "email": "email if found or null",
    "phone": "phone if found or null",
    "location": "city, state/country",
    "linkedin": "linkedin url or null",
    "github": "github url or null",
    "portfolio": "portfolio url or null",
    "summary": "professional summary extracted or generated from context"
  },
  "skills": [
    {"name": "Python", "category": "technical", "level": "advanced"},
    {"name": "Java", "category": "technical", "level": "intermediate"},
    {"name": "Git", "category": "tool", "level": "advanced"},
    {"name": "Leadership", "category": "soft", "level": "intermediate"},
    {"name": "React", "category": "framework", "level": "beginner"}
  ],
  "education": [
    {
      "degree": "B.Tech in Electronics and Communications",
      "institution": "IIITDM Jabalpur",
      "location": "Jabalpur, India",
      "startYear": "2024",
      "endYear": "2028",
      "score": "GPA or percentage if mentioned",
      "highlights": ["relevant coursework or achievements"]
    }
  ],
  "experience": [
    {
      "title": "Position Title",
      "company": "Company/Organization",
      "location": "City",
      "startDate": "Month Year",
      "endDate": "Present or Month Year",
      "isCurrent": true,
      "description": "Brief description",
      "highlights": ["key achievements"],
      "technologies": ["technologies used"]
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "What the project does",
      "technologies": ["Python", "Firebase"],
      "highlights": ["key metrics or achievements"],
      "url": "url if available"
    }
  ],
  "certifications": [
    {"name": "Certificate Name", "issuer": "Issuing Organization", "date": "Date"}
  ],
  "awards": [
    {"name": "Award Name", "issuer": "Issuing Organization", "date": "Date", "description": "Brief description"}
  ],
  "volunteering": [
    {
      "role": "Role Title",
      "organization": "Organization Name",
      "location": "Location",
      "startDate": "Start Date",
      "endDate": "End Date or Present",
      "description": "What you did",
      "impact": "Impact/achievements"
    }
  ],
  "languages": [
    {"language": "English", "proficiency": "Fluent"},
    {"language": "Hindi", "proficiency": "Native"}
  ],
  "careerLevel": "student/entry/junior/mid/senior/lead",
  "domain": "Primary domain like Cybersecurity, Web Development, etc",
  "keyStrengths": ["strength1", "strength2", "strength3"]
}

IMPORTANT: 
- Set skill levels based on context: years of experience, depth of projects, certifications
- Extract ALL skills mentioned, including programming languages, tools, frameworks, methodologies
- Include soft skills from dedicated sections or inferred from experience
- For education scores, preserve the original format (percentage, GPA, grade)

RESUME TEXT:
${cleanedText}

Return ONLY the JSON object. No markdown code blocks, no explanations.`;

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192,
            topP: 0.9,
            topK: 40
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API error: ${response.status} - ${errorData.error?.message || 'Unknown'}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      let parsed = this.extractJsonFromText(text);
      
      if (!parsed) {
        throw new Error('Could not extract valid JSON from AI response');
      }

      parsed = this.validateAndEnrichParsedData(parsed);

      return { 
        success: true, 
        data: parsed,
        confidence: this.calculateParseConfidence(parsed)
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  preprocessResumeText(text) {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\t/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/[^\x20-\x7E\n]/g, '')
      .trim()
      .substring(0, 15000);
  }

  extractJsonFromText(text) {
    const jsonPatterns = [
      /```json\s*([\s\S]*?)```/,
      /```\s*([\s\S]*?)```/,
      /(\{[\s\S]*\})/
    ];

    for (const pattern of jsonPatterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          return JSON.parse(match[1].trim());
        } catch (e) {
          continue;
        }
      }
    }

    try {
      return JSON.parse(text.trim());
    } catch (e) {
      return null;
    }
  }

  validateAndEnrichParsedData(data) {
    const validated = {
      personalInfo: {
        name: data.personalInfo?.name || 'Unknown',
        email: data.personalInfo?.email || '',
        phone: data.personalInfo?.phone || '',
        location: data.personalInfo?.location || '',
        linkedin: data.personalInfo?.linkedin || null,
        github: data.personalInfo?.github || null,
        portfolio: data.personalInfo?.portfolio || null,
        summary: data.personalInfo?.summary || ''
      },
      skills: (data.skills || []).map(skill => ({
        name: skill.name || '',
        category: skill.category || 'technical',
        level: skill.level || 'intermediate',
        yearsOfExperience: skill.yearsOfExperience || 0
      })).filter(s => s.name),
      experience: (data.experience || []).map(exp => ({
        title: exp.title || '',
        company: exp.company || '',
        location: exp.location || '',
        startDate: exp.startDate || '',
        endDate: exp.endDate || '',
        isCurrent: exp.isCurrent || exp.endDate?.toLowerCase() === 'present',
        highlights: exp.highlights || [],
        technologies: exp.technologies || []
      })).filter(e => e.title || e.company),
      education: data.education || [],
      projects: data.projects || [],
      certifications: data.certifications || [],
      languages: data.languages || [],
      careerLevel: data.careerLevel || this.inferCareerLevel(data),
      totalYearsExperience: data.totalYearsExperience || this.calculateTotalExperience(data.experience),
      keyStrengths: data.keyStrengths || [],
      industries: data.industries || []
    };

    return validated;
  }

  inferCareerLevel(data) {
    const years = data.totalYearsExperience || 0;
    const hasLeadership = (data.experience || []).some(e => 
      /lead|senior|manager|director|head|principal/i.test(e.title)
    );

    if (years >= 10 || hasLeadership) return 'senior';
    if (years >= 5) return 'mid';
    if (years >= 2) return 'junior';
    return 'entry';
  }

  calculateTotalExperience(experience) {
    if (!experience || experience.length === 0) return 0;
    
    let totalMonths = 0;
    const now = new Date();

    experience.forEach(exp => {
      try {
        const startDate = new Date(exp.startDate);
        const endDate = exp.endDate?.toLowerCase() === 'present' 
          ? now 
          : new Date(exp.endDate);
        
        if (!isNaN(startDate) && !isNaN(endDate)) {
          const months = (endDate - startDate) / (1000 * 60 * 60 * 24 * 30);
          totalMonths += Math.max(0, months);
        }
      } catch (e) {}
    });

    return Math.round(totalMonths / 12);
  }

  calculateParseConfidence(data) {
    let score = 0;
    
    if (data.personalInfo?.name && data.personalInfo.name !== 'Unknown') score += 15;
    if (data.personalInfo?.email) score += 10;
    if (data.skills?.length >= 5) score += 20;
    if (data.skills?.length >= 10) score += 10;
    if (data.experience?.length >= 1) score += 20;
    if (data.experience?.length >= 3) score += 10;
    if (data.education?.length >= 1) score += 10;
    if (data.personalInfo?.linkedin || data.personalInfo?.github) score += 5;

    return Math.min(100, score);
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
      
      return { success: false, error: error.message };
    }
  }

  clearConversation(conversationId) {
    this.conversationHistory.delete(conversationId);
  }
}

export const geminiService = new GeminiService();
export default geminiService;
