// CrewConnect Data Service - Local Development Version
// This provides Data Connect-style operations using Firestore
// Use this for local development without requiring Blaze billing plan

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';

class CrewConnectService {
  // User Operations
  async createUserProfile(userData) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const userProfile = {
        firebaseUID: user.uid,
        username: userData.username || user.email.split('@')[0],
        email: user.email,
        displayName: userData.displayName || user.displayName,
        profilePictureUrl: userData.profilePictureUrl || user.photoURL,
        bio: userData.bio || '',
        createdAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
        isOnline: true,
      };

      await addDoc(collection(db, 'users'), userProfile);
      return userProfile;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  async getUserProfile(firebaseUID = null) {
    try {
      const uid = firebaseUID || auth.currentUser?.uid;
      if (!uid) throw new Error('User not authenticated');

      const q = query(collection(db, 'users'), where('firebaseUID', '==', uid));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        return { id: querySnapshot.docs[0].id, ...userData };
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      // Return null instead of throwing to prevent app crashes
      return null;
    }
  }

  async updateUserProfile(updates) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const q = query(collection(db, 'users'), where('firebaseUID', '==', user.uid));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDocRef = doc(db, 'users', querySnapshot.docs[0].id);
        await updateDoc(userDocRef, {
          ...updates,
          lastActiveAt: serverTimestamp(),
        });
        
        return { id: querySnapshot.docs[0].id, ...updates };
      }
      throw new Error('User profile not found');
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Crew Operations
  async createCrew(name, description, isPublic = true) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      // Get user profile first
      const userProfile = await this.getUserProfile();
      if (!userProfile) throw new Error('User profile not found');

      const crewData = {
        name,
        description,
        isPublic,
        maxMembers: 100,
        createdBy: userProfile.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        avatarUrl: null,
      };

      const crewRef = await addDoc(collection(db, 'crews'), crewData);
      
      // Add creator as admin member
      await this.joinCrew(crewRef.id, 'admin');
      
      return { id: crewRef.id, ...crewData };
    } catch (error) {
      console.error('Error creating crew:', error);
      throw error;
    }
  }

  async getPublicCrews() {
    try {
      const q = query(
        collection(db, 'crews'),
        where('isPublic', '==', true),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const crews = [];
      for (const docSnap of querySnapshot.docs) {
        const crewData = { id: docSnap.id, ...docSnap.data() };
        
        // Get creator info
        if (crewData.createdBy) {
          const creatorDoc = await getDoc(doc(db, 'users', crewData.createdBy));
          if (creatorDoc.exists()) {
            crewData.createdByUser = creatorDoc.data();
          }
        }
        
        crews.push(crewData);
      }
      
      return crews;
    } catch (error) {
      console.error('Error getting public crews:', error);
      throw error;
    }
  }

  async getUserCrews() {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const userProfile = await this.getUserProfile();
      if (!userProfile) return [];

      // Get memberships
      const membershipQuery = query(
        collection(db, 'memberships'),
        where('userId', '==', userProfile.id),
        where('isActive', '==', true)
      );
      const membershipSnapshot = await getDocs(membershipQuery);
      
      const crews = [];
      for (const membershipDoc of membershipSnapshot.docs) {
        const membershipData = membershipDoc.data();
        const crewDoc = await getDoc(doc(db, 'crews', membershipData.crewId));
        
        if (crewDoc.exists()) {
          crews.push({
            id: crewDoc.id,
            ...crewDoc.data(),
            membership: {
              role: membershipData.role,
              joinedAt: membershipData.joinedAt,
              canInvite: membershipData.canInvite || false,
              canModerate: membershipData.canModerate || false,
            }
          });
        }
      }
      
      return crews;
    } catch (error) {
      console.error('Error getting user crews:', error);
      throw error;
    }
  }

  async joinCrew(crewId, role = 'member') {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const userProfile = await this.getUserProfile();
      if (!userProfile) throw new Error('User profile not found');

      // Check if already a member
      const existingMembership = query(
        collection(db, 'memberships'),
        where('userId', '==', userProfile.id),
        where('crewId', '==', crewId),
        where('isActive', '==', true)
      );
      const existingSnapshot = await getDocs(existingMembership);
      
      if (!existingSnapshot.empty) {
        throw new Error('Already a member of this crew');
      }

      const membershipData = {
        userId: userProfile.id,
        crewId,
        role,
        joinedAt: serverTimestamp(),
        isActive: true,
        canInvite: role === 'admin' || role === 'moderator',
        canModerate: role === 'admin' || role === 'moderator',
      };

      const membershipRef = await addDoc(collection(db, 'memberships'), membershipData);
      return { id: membershipRef.id, ...membershipData };
    } catch (error) {
      console.error('Error joining crew:', error);
      throw error;
    }
  }

  // Message Operations
  async sendMessage(crewId, content, messageType = 'text') {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const userProfile = await this.getUserProfile();
      if (!userProfile) throw new Error('User profile not found');

      const messageData = {
        crewId,
        senderId: userProfile.id,
        content,
        messageType,
        sentAt: serverTimestamp(),
        isDeleted: false,
        reactions: [],
        mentions: [],
      };

      const messageRef = await addDoc(collection(db, 'messages'), messageData);
      
      return {
        id: messageRef.id,
        ...messageData,
        sender: {
          id: userProfile.id,
          displayName: userProfile.displayName,
          username: userProfile.username,
          profilePictureUrl: userProfile.profilePictureUrl,
        }
      };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async getCrewMessages(crewId, messageLimit = 50) {
    try {
      const q = query(
        collection(db, 'messages'),
        where('crewId', '==', crewId),
        where('isDeleted', '==', false),
        orderBy('sentAt', 'desc'),
        limit(messageLimit)
      );
      const querySnapshot = await getDocs(q);
      
      const messages = [];
      for (const docSnap of querySnapshot.docs) {
        const messageData = { id: docSnap.id, ...docSnap.data() };
        
        // Get sender info
        if (messageData.senderId) {
          const senderDoc = await getDoc(doc(db, 'users', messageData.senderId));
          if (senderDoc.exists()) {
            messageData.sender = senderDoc.data();
          }
        }
        
        messages.push(messageData);
      }
      
      return messages.reverse(); // Return in chronological order
    } catch (error) {
      console.error('Error getting crew messages:', error);
      throw error;
    }
  }

  async getCrewMembers(crewId) {
    try {
      const membershipQuery = query(
        collection(db, 'memberships'),
        where('crewId', '==', crewId),
        where('isActive', '==', true)
      );
      const membershipSnapshot = await getDocs(membershipQuery);
      
      const members = [];
      for (const membershipDoc of membershipSnapshot.docs) {
        const membershipData = membershipDoc.data();
        const userDoc = await getDoc(doc(db, 'users', membershipData.userId));
        
        if (userDoc.exists()) {
          members.push({
            user: { id: userDoc.id, ...userDoc.data() },
            role: membershipData.role,
            joinedAt: membershipData.joinedAt,
            canInvite: membershipData.canInvite,
            canModerate: membershipData.canModerate,
          });
        }
      }
      
      return members;
    } catch (error) {
      console.error('Error getting crew members:', error);
      throw error;
    }
  }

  // Real-time listeners
  subscribeToCrewMessages(crewId, callback) {
    const q = query(
      collection(db, 'messages'),
      where('crewId', '==', crewId),
      where('isDeleted', '==', false),
      orderBy('sentAt', 'desc'),
      limit(50)
    );

    return onSnapshot(q, async (querySnapshot) => {
      const messages = [];
      for (const docSnap of querySnapshot.docs) {
        const messageData = { id: docSnap.id, ...docSnap.data() };
        
        // Get sender info
        if (messageData.senderId) {
          const senderDoc = await getDoc(doc(db, 'users', messageData.senderId));
          if (senderDoc.exists()) {
            messageData.sender = senderDoc.data();
          }
        }
        
        messages.push(messageData);
      }
      
      callback(messages.reverse());
    });
  }

  subscribeToPublicCrews(callback) {
    const q = query(
      collection(db, 'crews'),
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, async (querySnapshot) => {
      const crews = [];
      for (const docSnap of querySnapshot.docs) {
        const crewData = { id: docSnap.id, ...docSnap.data() };
        
        // Get creator info
        if (crewData.createdBy) {
          try {
            const creatorDoc = await getDoc(doc(db, 'users', crewData.createdBy));
            if (creatorDoc.exists()) {
              crewData.createdByUser = creatorDoc.data();
            }
          } catch (error) {
            console.error('Error fetching creator info:', error);
          }
        }
        
        // Get member count
        try {
          const membershipQuery = query(
            collection(db, 'memberships'),
            where('crewId', '==', docSnap.id),
            where('isActive', '==', true)
          );
          const membershipSnapshot = await getDocs(membershipQuery);
          crewData.memberCount = membershipSnapshot.docs.length;
        } catch (error) {
          console.error('Error counting members:', error);
          crewData.memberCount = 0;
        }
        
        crews.push(crewData);
      }
      
      callback(crews);
    });
  }

  // Get user statistics for dashboard
  async getUserStats() {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const userProfile = await this.getUserProfile();
      if (!userProfile) return null;

      // Get user's crews
      const crews = await this.getUserCrews();
      
      let totalMessages = 0;
      let recentActivity = 0;
      let onlineMembers = 0;

      // Calculate stats from each crew
      for (const crew of crews) {
        try {
          const messages = await this.getCrewMessages(crew.id, 10);
          const members = await this.getCrewMembers(crew.id);
          
          totalMessages += messages.length;
          onlineMembers += members.filter(member => member.user.isOnline).length;
          
          // Count recent messages (last hour)
          const recentMessages = messages.filter(msg => {
            const messageTime = msg.sentAt?.toDate ? msg.sentAt.toDate() : new Date(msg.sentAt);
            return new Date() - messageTime < 3600000; // 1 hour
          });
          recentActivity += recentMessages.length;
        } catch (error) {
          console.error(`Error calculating stats for crew ${crew.id}:`, error);
        }
      }

      return {
        totalGroups: crews.length,
        totalMessages,
        onlineMembers,
        recentActivity
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {
        totalGroups: 0,
        totalMessages: 0,
        onlineMembers: 0,
        recentActivity: 0
      };
    }
  }

  // Update user online status
  async updateUserOnlineStatus(isOnline = true) {
    try {
      const user = auth.currentUser;
      if (!user) return;

      await this.updateUserProfile({
        isOnline,
        lastActiveAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating online status:', error);
    }
  }

  // Leave a crew
  async leaveCrew(crewId) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const userProfile = await this.getUserProfile();
      if (!userProfile) throw new Error('User profile not found');

      // Find and deactivate membership
      const membershipQuery = query(
        collection(db, 'memberships'),
        where('userId', '==', userProfile.id),
        where('crewId', '==', crewId),
        where('isActive', '==', true)
      );
      const membershipSnapshot = await getDocs(membershipQuery);
      
      if (membershipSnapshot.empty) {
        throw new Error('Not a member of this crew');
      }

      const membershipDoc = membershipSnapshot.docs[0];
      await updateDoc(doc(db, 'memberships', membershipDoc.id), {
        isActive: false,
        leftAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error leaving crew:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const crewConnectService = new CrewConnectService();
export default crewConnectService;
