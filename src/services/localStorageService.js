// Temporary localStorage fallback service for when Firestore is unavailable
// This allows the app to function even without database access

class LocalStorageService {
  constructor() {
    this.initializeStorage();
  }

  initializeStorage() {
    if (!localStorage.getItem('crewconnect-data')) {
      localStorage.setItem('crewconnect-data', JSON.stringify({
        users: {},
        crews: {},
        messages: {},
        memberships: {}
      }));
    }
  }

  getData() {
    try {
      return JSON.parse(localStorage.getItem('crewconnect-data'));
    } catch {
      this.initializeStorage();
      return JSON.parse(localStorage.getItem('crewconnect-data'));
    }
  }

  saveData(data) {
    localStorage.setItem('crewconnect-data', JSON.stringify(data));
  }

  // User operations
  async createUserProfile(userData) {
    const data = this.getData();
    const userId = `user_${Date.now()}`;
    
    data.users[userId] = {
      id: userId,
      ...userData,
      createdAt: new Date(),
      lastActiveAt: new Date(),
      isOnline: true
    };
    
    this.saveData(data);
    return data.users[userId];
  }

  async getUserProfile(firebaseUID) {
    const data = this.getData();
    const user = Object.values(data.users).find(u => u.firebaseUID === firebaseUID);
    return user || null;
  }

  async updateUserProfile(firebaseUID, updates) {
    const data = this.getData();
    const userKey = Object.keys(data.users).find(key => 
      data.users[key].firebaseUID === firebaseUID
    );
    
    if (userKey) {
      data.users[userKey] = { ...data.users[userKey], ...updates };
      this.saveData(data);
      return data.users[userKey];
    }
    return null;
  }

  // Crew operations
  async createCrew(name, description, isPublic = true, createdBy) {
    const data = this.getData();
    const crewId = `crew_${Date.now()}`;
    
    data.crews[crewId] = {
      id: crewId,
      name,
      description,
      isPublic,
      createdBy,
      createdAt: new Date(),
      maxMembers: 100
    };
    
    this.saveData(data);
    return data.crews[crewId];
  }

  async getPublicCrews() {
    const data = this.getData();
    return Object.values(data.crews).filter(crew => crew.isPublic);
  }

  // Message operations
  async sendMessage(crewId, senderId, content, messageType = 'text') {
    const data = this.getData();
    const messageId = `message_${Date.now()}`;
    
    data.messages[messageId] = {
      id: messageId,
      crewId,
      senderId,
      content,
      messageType,
      sentAt: new Date(),
      isDeleted: false,
      reactions: [],
      mentions: []
    };
    
    this.saveData(data);
    return data.messages[messageId];
  }

  async getCrewMessages(crewId, limit = 50) {
    const data = this.getData();
    const messages = Object.values(data.messages)
      .filter(msg => msg.crewId === crewId && !msg.isDeleted)
      .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))
      .slice(0, limit)
      .reverse();
    
    return messages;
  }

  // Membership operations
  async joinCrew(userId, crewId, role = 'member') {
    const data = this.getData();
    const membershipId = `membership_${userId}_${crewId}`;
    
    data.memberships[membershipId] = {
      id: membershipId,
      userId,
      crewId,
      role,
      joinedAt: new Date(),
      isActive: true,
      canInvite: role === 'admin' || role === 'moderator',
      canModerate: role === 'admin' || role === 'moderator'
    };
    
    this.saveData(data);
    return data.memberships[membershipId];
  }

  async getUserCrews(userId) {
    const data = this.getData();
    const userMemberships = Object.values(data.memberships)
      .filter(m => m.userId === userId && m.isActive);
    
    return userMemberships.map(membership => ({
      ...data.crews[membership.crewId],
      membership: {
        role: membership.role,
        joinedAt: membership.joinedAt,
        canInvite: membership.canInvite,
        canModerate: membership.canModerate
      }
    })).filter(crew => crew.id); // Filter out undefined crews
  }
}

// Export singleton instance
export const localStorageService = new LocalStorageService();
export default localStorageService;
