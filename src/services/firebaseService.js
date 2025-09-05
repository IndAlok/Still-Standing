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
import { db } from '../config/firebase';

// Groups Service
export class GroupsService {
  static async createGroup(groupData, userId) {
    try {
      const docRef = await addDoc(collection(db, 'groups'), {
        ...groupData,
        creatorId: userId,
        members: [{ userId, role: 'owner', joinedAt: serverTimestamp() }],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      return { id: docRef.id, ...groupData };
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  }

  static async getGroup(groupId) {
    try {
      const docRef = doc(db, 'groups', groupId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        throw new Error('Group not found');
      }
    } catch (error) {
      console.error('Error getting group:', error);
      throw error;
    }
  }

  static async getUserGroups(userId) {
    try {
      const q = query(
        collection(db, 'groups'),
        where('members', 'array-contains-any', [
          { userId, role: 'owner' },
          { userId, role: 'admin' },
          { userId, role: 'member' }
        ])
      );
      
      const querySnapshot = await getDocs(q);
      const groups = [];
      
      querySnapshot.forEach((doc) => {
        groups.push({ id: doc.id, ...doc.data() });
      });
      
      return groups;
    } catch (error) {
      console.error('Error getting user groups:', error);
      throw error;
    }
  }

  static async getPublicGroups(excludeGroupIds = []) {
    try {
      const q = query(
        collection(db, 'groups'),
        where('isPrivate', '==', false),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      
      const querySnapshot = await getDocs(q);
      const groups = [];
      
      querySnapshot.forEach((doc) => {
        if (!excludeGroupIds.includes(doc.id)) {
          groups.push({ id: doc.id, ...doc.data() });
        }
      });
      
      return groups;
    } catch (error) {
      console.error('Error getting public groups:', error);
      throw error;
    }
  }

  static async joinGroup(groupId, userId) {
    try {
      const groupRef = doc(db, 'groups', groupId);
      const memberData = { userId, role: 'member', joinedAt: serverTimestamp() };
      
      await updateDoc(groupRef, {
        members: arrayUnion(memberData),
        updatedAt: serverTimestamp(),
      });
      
      return true;
    } catch (error) {
      console.error('Error joining group:', error);
      throw error;
    }
  }

  static async leaveGroup(groupId, userId) {
    try {
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);
      
      if (groupDoc.exists()) {
        const groupData = groupDoc.data();
        const updatedMembers = groupData.members.filter(member => member.userId !== userId);
        
        await updateDoc(groupRef, {
          members: updatedMembers,
          updatedAt: serverTimestamp(),
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error leaving group:', error);
      throw error;
    }
  }

  static subscribeToGroup(groupId, callback) {
    const groupRef = doc(db, 'groups', groupId);
    return onSnapshot(groupRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() });
      }
    });
  }
}

// Messages Service
export class MessagesService {
  static async sendMessage(groupId, messageData, userId) {
    try {
      const docRef = await addDoc(collection(db, 'groups', groupId, 'messages'), {
        ...messageData,
        authorId: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      // Update group's last message
      const groupRef = doc(db, 'groups', groupId);
      await updateDoc(groupRef, {
        lastMessage: {
          content: messageData.content,
          authorId: userId,
          createdAt: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      });
      
      return { id: docRef.id, ...messageData };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  static async getMessages(groupId, limitCount = 50) {
    try {
      const q = query(
        collection(db, 'groups', groupId, 'messages'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const messages = [];
      
      querySnapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() });
      });
      
      return messages.reverse(); // Reverse to show oldest first
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  }

  static async updateMessage(groupId, messageId, updates) {
    try {
      const messageRef = doc(db, 'groups', groupId, 'messages', messageId);
      await updateDoc(messageRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      
      return true;
    } catch (error) {
      console.error('Error updating message:', error);
      throw error;
    }
  }

  static async deleteMessage(groupId, messageId) {
    try {
      const messageRef = doc(db, 'groups', groupId, 'messages', messageId);
      await deleteDoc(messageRef);
      
      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  static subscribeToMessages(groupId, callback) {
    const q = query(
      collection(db, 'groups', groupId, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const messages = [];
      querySnapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() });
      });
      callback(messages.reverse());
    });
  }
}

// Users Service
export class UsersService {
  static async createOrUpdateUser(userData) {
    try {
      const userRef = doc(db, 'users', userData.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // Create new user document
        await updateDoc(userRef, {
          ...userData,
          isOnline: true,
          lastSeen: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        // Update existing user
        await updateDoc(userRef, {
          isOnline: true,
          lastSeen: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      
      return userData;
    } catch (error) {
      console.error('Error creating/updating user:', error);
      throw error;
    }
  }

  static async getUserData(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() };
      } else {
        throw new Error('User not found');
      }
    } catch (error) {
      console.error('Error getting user data:', error);
      throw error;
    }
  }

  static async updateUserProfile(userId, updates) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      
      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  static async setUserOnlineStatus(userId, isOnline) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isOnline,
        lastSeen: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      return true;
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  static subscribeToUser(userId, callback) {
    const userRef = doc(db, 'users', userId);
    return onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() });
      }
    });
  }

  static async getGroupMembers(groupId) {
    try {
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);
      
      if (groupDoc.exists()) {
        const groupData = groupDoc.data();
        const memberIds = groupData.members.map(member => member.userId);
        
        // Get user data for all members
        const memberPromises = memberIds.map(async (userId) => {
          const userData = await this.getUserData(userId);
          const memberInfo = groupData.members.find(m => m.userId === userId);
          return { ...userData, role: memberInfo.role, joinedAt: memberInfo.joinedAt };
        });
        
        return Promise.all(memberPromises);
      } else {
        throw new Error('Group not found');
      }
    } catch (error) {
      console.error('Error getting group members:', error);
      throw error;
    }
  }
}

// Real-time Presence Service
export class PresenceService {
  static setupPresence(userId) {
    const userStatusRef = doc(db, 'users', userId);
    
    // Set online status
    const setOnline = () => {
      updateDoc(userStatusRef, {
        isOnline: true,
        lastSeen: serverTimestamp(),
      });
    };
    
    // Set offline status
    const setOffline = () => {
      updateDoc(userStatusRef, {
        isOnline: false,
        lastSeen: serverTimestamp(),
      });
    };
    
    // Set up event listeners
    window.addEventListener('beforeunload', setOffline);
    window.addEventListener('focus', setOnline);
    window.addEventListener('blur', setOffline);
    
    // Initial online status
    setOnline();
    
    // Return cleanup function
    return () => {
      window.removeEventListener('beforeunload', setOffline);
      window.removeEventListener('focus', setOnline);
      window.removeEventListener('blur', setOffline);
      setOffline();
    };
  }
}
