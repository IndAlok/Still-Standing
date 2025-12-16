import { db, auth } from '../config/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  increment,
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';

const SKILL_CATEGORIES = {
  technical: ['JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'Java', 'C++', 'Go', 'Rust', 'SQL', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes', 'GraphQL', 'REST API', 'Machine Learning', 'Data Science', 'DevOps', 'CI/CD', 'Git', 'Linux', 'Firebase', 'Next.js', 'Vue.js', 'Angular', 'Flutter', 'React Native', 'Swift', 'Kotlin'],
  design: ['UI Design', 'UX Design', 'Figma', 'Adobe XD', 'Sketch', 'Photoshop', 'Illustrator', 'Prototyping', 'User Research', 'Design Systems', 'Motion Design', 'Brand Design'],
  soft: ['Leadership', 'Communication', 'Problem Solving', 'Teamwork', 'Time Management', 'Critical Thinking', 'Creativity', 'Adaptability', 'Conflict Resolution', 'Mentoring'],
  business: ['Product Management', 'Project Management', 'Agile', 'Scrum', 'Marketing', 'Sales', 'Business Analysis', 'Strategy', 'Finance', 'Operations'],
  languages: ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Hindi', 'Arabic', 'Portuguese', 'Russian']
};

const SKILL_LEVELS = {
  beginner: { value: 1, label: 'Beginner', description: 'Learning the basics' },
  intermediate: { value: 2, label: 'Intermediate', description: '1-2 years experience' },
  advanced: { value: 3, label: 'Advanced', description: '3-5 years experience' },
  expert: { value: 4, label: 'Expert', description: '5+ years, can mentor others' }
};

class SkillService {
  getSkillCategories() {
    return SKILL_CATEGORIES;
  }

  getSkillLevels() {
    return SKILL_LEVELS;
  }

  getAllSkills() {
    return Object.entries(SKILL_CATEGORIES).flatMap(([category, skills]) => 
      skills.map(skill => ({ name: skill, category }))
    );
  }

  async getUserSkills(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) return [];
      
      return userSnap.data().skills || [];
    } catch (error) {
      console.error('Error getting user skills:', error);
      return [];
    }
  }

  async addSkill(skillData) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) throw new Error('User not found');

      const currentSkills = userSnap.data().skills || [];
      const existingSkillIndex = currentSkills.findIndex(s => s.name.toLowerCase() === skillData.name.toLowerCase());

      const newSkill = {
        id: Date.now().toString(),
        name: skillData.name,
        category: skillData.category || this.detectCategory(skillData.name),
        level: skillData.level || 'intermediate',
        endorsements: [],
        endorsementCount: 0,
        verified: false,
        addedAt: new Date().toISOString()
      };

      if (existingSkillIndex >= 0) {
        currentSkills[existingSkillIndex] = { ...currentSkills[existingSkillIndex], ...newSkill, id: currentSkills[existingSkillIndex].id };
      } else {
        currentSkills.push(newSkill);
      }

      await updateDoc(userRef, { skills: currentSkills, updatedAt: serverTimestamp() });

      return { success: true, skill: newSkill };
    } catch (error) {
      console.error('Error adding skill:', error);
      return { success: false, error: error.message };
    }
  }

  async removeSkill(skillId) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) throw new Error('User not found');

      const currentSkills = userSnap.data().skills || [];
      const updatedSkills = currentSkills.filter(s => s.id !== skillId);

      await updateDoc(userRef, { skills: updatedSkills, updatedAt: serverTimestamp() });

      return { success: true };
    } catch (error) {
      console.error('Error removing skill:', error);
      return { success: false, error: error.message };
    }
  }

  async updateSkillLevel(skillId, newLevel) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) throw new Error('User not found');

      const currentSkills = userSnap.data().skills || [];
      const skillIndex = currentSkills.findIndex(s => s.id === skillId);
      
      if (skillIndex < 0) throw new Error('Skill not found');

      currentSkills[skillIndex].level = newLevel;

      await updateDoc(userRef, { skills: currentSkills, updatedAt: serverTimestamp() });

      return { success: true };
    } catch (error) {
      console.error('Error updating skill level:', error);
      return { success: false, error: error.message };
    }
  }

  async endorseSkill(targetUserId, skillId, message = '') {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      if (user.uid === targetUserId) throw new Error('Cannot endorse your own skills');

      const targetUserRef = doc(db, 'users', targetUserId);
      const targetSnap = await getDoc(targetUserRef);
      
      if (!targetSnap.exists()) throw new Error('User not found');

      const skills = targetSnap.data().skills || [];
      const skillIndex = skills.findIndex(s => s.id === skillId);
      
      if (skillIndex < 0) throw new Error('Skill not found');

      const existingEndorsement = skills[skillIndex].endorsements?.find(e => e.userId === user.uid);
      if (existingEndorsement) throw new Error('Already endorsed this skill');

      const endorsement = {
        userId: user.uid,
        userName: user.displayName || user.email,
        userPhoto: user.photoURL,
        message,
        createdAt: new Date().toISOString()
      };

      skills[skillIndex].endorsements = [...(skills[skillIndex].endorsements || []), endorsement];
      skills[skillIndex].endorsementCount = skills[skillIndex].endorsements.length;

      await updateDoc(targetUserRef, { skills, updatedAt: serverTimestamp() });

      await addDoc(collection(db, 'endorsements'), {
        fromUserId: user.uid,
        toUserId: targetUserId,
        skillId,
        skillName: skills[skillIndex].name,
        message,
        createdAt: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error endorsing skill:', error);
      return { success: false, error: error.message };
    }
  }

  async getEndorsementsReceived(userId) {
    try {
      const endorsementsQuery = query(
        collection(db, 'endorsements'),
        where('toUserId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const snapshot = await getDocs(endorsementsQuery);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting endorsements:', error);
      return [];
    }
  }

  async searchUsersBySkills(skillNames, minLevel = 'beginner') {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      
      const levelValue = SKILL_LEVELS[minLevel]?.value || 1;
      
      const matchingUsers = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => {
          const userSkills = user.skills || [];
          return skillNames.some(searchSkill => 
            userSkills.some(userSkill => 
              userSkill.name.toLowerCase().includes(searchSkill.toLowerCase()) &&
              (SKILL_LEVELS[userSkill.level]?.value || 1) >= levelValue
            )
          );
        })
        .map(user => ({
          ...user,
          matchingSkills: (user.skills || []).filter(skill => 
            skillNames.some(searchSkill => 
              skill.name.toLowerCase().includes(searchSkill.toLowerCase())
            )
          )
        }));

      return matchingUsers;
    } catch (error) {
      console.error('Error searching users by skills:', error);
      return [];
    }
  }

  detectCategory(skillName) {
    const lowerSkill = skillName.toLowerCase();
    for (const [category, skills] of Object.entries(SKILL_CATEGORIES)) {
      if (skills.some(s => s.toLowerCase() === lowerSkill)) {
        return category;
      }
    }
    return 'technical';
  }

  calculateSkillStats(skills) {
    if (!skills?.length) return { total: 0, byCategory: {}, byLevel: {}, topSkills: [] };

    const byCategory = {};
    const byLevel = {};

    skills.forEach(skill => {
      byCategory[skill.category] = (byCategory[skill.category] || 0) + 1;
      byLevel[skill.level] = (byLevel[skill.level] || 0) + 1;
    });

    const topSkills = [...skills]
      .sort((a, b) => (b.endorsementCount || 0) - (a.endorsementCount || 0))
      .slice(0, 5);

    return {
      total: skills.length,
      byCategory,
      byLevel,
      topSkills,
      endorsementCount: skills.reduce((sum, s) => sum + (s.endorsementCount || 0), 0)
    };
  }
}

export const skillService = new SkillService();
export default skillService;
