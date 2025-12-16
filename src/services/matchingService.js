import { db, auth } from '../config/firebase';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { geminiService } from './geminiService';
import { skillService } from './skillService';

class MatchingService {
  calculateCompatibilityScore(user1, user2) {
    const skills1 = user1.skills || [];
    const skills2 = user2.skills || [];

    if (!skills1.length || !skills2.length) {
      return { score: 50, breakdown: { complementary: 0, overlap: 0, diversity: 50 } };
    }

    const skill1Names = new Set(skills1.map(s => s.name.toLowerCase()));
    const skill2Names = new Set(skills2.map(s => s.name.toLowerCase()));

    const overlapping = [...skill1Names].filter(s => skill2Names.has(s));
    const complementaryFrom1 = [...skill1Names].filter(s => !skill2Names.has(s));
    const complementaryFrom2 = [...skill2Names].filter(s => !skill1Names.has(s));

    const overlapScore = Math.min(overlapping.length * 10, 30);
    const complementaryScore = Math.min((complementaryFrom1.length + complementaryFrom2.length) * 8, 50);
    
    const categories1 = new Set(skills1.map(s => s.category));
    const categories2 = new Set(skills2.map(s => s.category));
    const combinedCategories = new Set([...categories1, ...categories2]);
    const diversityScore = Math.min(combinedCategories.size * 5, 20);

    const totalScore = Math.min(overlapScore + complementaryScore + diversityScore, 100);

    return {
      score: Math.round(totalScore),
      breakdown: {
        overlap: overlapScore,
        complementary: complementaryScore,
        diversity: diversityScore
      },
      details: {
        overlappingSkills: overlapping,
        complementarySkills: [...complementaryFrom1, ...complementaryFrom2],
        combinedCategories: [...combinedCategories]
      }
    };
  }

  async findBestMatches(targetUserId, options = {}) {
    try {
      const { limit: maxResults = 10, minScore = 40, excludeIds = [] } = options;

      const targetUserRef = doc(db, 'users', targetUserId);
      const targetSnap = await getDoc(targetUserRef);
      
      if (!targetSnap.exists()) throw new Error('User not found');
      
      const targetUser = { id: targetUserId, ...targetSnap.data() };

      const usersSnapshot = await getDocs(collection(db, 'users'));
      const allUsers = usersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => 
          user.id !== targetUserId && 
          !excludeIds.includes(user.id) &&
          user.skills?.length > 0
        );

      const matches = allUsers.map(user => {
        const compatibility = this.calculateCompatibilityScore(targetUser, user);
        return {
          user: {
            id: user.id,
            displayName: user.displayName || user.username,
            email: user.email,
            profilePicture: user.profilePicture || user.photoURL,
            bio: user.bio,
            skills: user.skills,
            availability: user.availability
          },
          ...compatibility
        };
      });

      return matches
        .filter(m => m.score >= minScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults);
    } catch (error) {
      console.error('Error finding matches:', error);
      return [];
    }
  }

  async analyzeTeamSkillGaps(teamMembers, requiredSkills = []) {
    const allTeamSkills = teamMembers.flatMap(m => m.skills || []);
    const skillCoverage = {};

    requiredSkills.forEach(skill => {
      const matches = allTeamSkills.filter(s => 
        s.name.toLowerCase().includes(skill.toLowerCase())
      );
      
      if (matches.length === 0) {
        skillCoverage[skill] = { status: 'missing', coveredBy: [] };
      } else {
        const highestLevel = matches.reduce((max, s) => {
          const levels = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
          return Math.max(max, levels[s.level] || 1);
        }, 0);
        
        skillCoverage[skill] = {
          status: highestLevel >= 3 ? 'strong' : highestLevel >= 2 ? 'adequate' : 'weak',
          coveredBy: matches.map(m => ({ name: m.name, level: m.level })),
          strength: highestLevel
        };
      }
    });

    const missingSkills = Object.entries(skillCoverage)
      .filter(([, data]) => data.status === 'missing')
      .map(([skill]) => skill);

    const weakSkills = Object.entries(skillCoverage)
      .filter(([, data]) => data.status === 'weak')
      .map(([skill]) => skill);

    const coverage = requiredSkills.length > 0
      ? ((requiredSkills.length - missingSkills.length) / requiredSkills.length) * 100
      : 0;

    return {
      skillCoverage,
      missingSkills,
      weakSkills,
      coveragePercentage: Math.round(coverage),
      recommendations: this.generateRecommendations(missingSkills, weakSkills)
    };
  }

  generateRecommendations(missingSkills, weakSkills) {
    const recommendations = [];

    if (missingSkills.length > 0) {
      recommendations.push({
        type: 'critical',
        message: `Your team is missing: ${missingSkills.join(', ')}. Consider recruiting members with these skills.`
      });
    }

    if (weakSkills.length > 0) {
      recommendations.push({
        type: 'improvement',
        message: `Skills that need strengthening: ${weakSkills.join(', ')}. Look for team members with advanced expertise.`
      });
    }

    if (missingSkills.length === 0 && weakSkills.length === 0) {
      recommendations.push({
        type: 'success',
        message: 'Your team has good skill coverage for the required areas!'
      });
    }

    return recommendations;
  }

  async suggestOptimalTeam(projectRequirements, availableUserIds, teamSize = 4) {
    try {
      const users = [];
      for (const userId of availableUserIds) {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          users.push({ id: userId, ...userSnap.data() });
        }
      }

      const result = await geminiService.suggestTeamMembers(projectRequirements, users);
      
      if (!result.success) {
        return this.fallbackTeamSuggestion(users, projectRequirements, teamSize);
      }

      return result.data;
    } catch (error) {
      console.error('Error suggesting optimal team:', error);
      return this.fallbackTeamSuggestion([], projectRequirements, teamSize);
    }
  }

  fallbackTeamSuggestion(users, requirements, teamSize) {
    const requiredSkills = requirements.skills || [];
    
    const scoredUsers = users.map(user => {
      const userSkills = (user.skills || []).map(s => s.name.toLowerCase());
      const matchCount = requiredSkills.filter(rs => 
        userSkills.some(us => us.includes(rs.toLowerCase()))
      ).length;
      
      return { ...user, matchScore: matchCount };
    });

    const suggestedTeam = scoredUsers
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, teamSize)
      .map(user => ({
        userId: user.id,
        role: 'Team Member',
        reason: `Matches ${user.matchScore} required skills`
      }));

    return {
      suggestedTeam,
      teamStrengths: ['Based on skill matching'],
      potentialChallenges: ['AI analysis unavailable'],
      missingSkills: [],
      overallFitScore: suggestedTeam.length > 0 ? 60 : 0
    };
  }

  calculateTeamDiversity(teamMembers) {
    const allSkills = teamMembers.flatMap(m => m.skills || []);
    const categories = new Set(allSkills.map(s => s.category));
    const uniqueSkills = new Set(allSkills.map(s => s.name));

    return {
      categoryCount: categories.size,
      uniqueSkillCount: uniqueSkills.size,
      averageSkillsPerMember: teamMembers.length > 0 
        ? (allSkills.length / teamMembers.length).toFixed(1) 
        : 0,
      diversityScore: Math.min(categories.size * 20 + uniqueSkills.size * 2, 100)
    };
  }
}

export const matchingService = new MatchingService();
export default matchingService;
