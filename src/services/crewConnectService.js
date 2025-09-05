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
  setDoc,
  Timestamp,
  writeBatch
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

      // Get user profile, create one if it doesn't exist
      let userProfile = await this.getUserProfile();
      
      if (!userProfile) {
        userProfile = await this.createUserProfile({
          username: user.email.split('@')[0],
          displayName: user.displayName || user.email.split('@')[0],
          bio: `Hello! I'm ${user.displayName || 'new'} on CrewConnect!`
        });
      }

      const crewData = {
        name,
        description,
        isPublic,
        maxMembers: 100,
        createdBy: user.uid, // Use Firebase Auth UID
        members: [user.uid], // Add creator to members array
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        avatarUrl: null,
        memberCount: 1
      };

      const crewRef = await addDoc(collection(db, 'crews'), crewData);
      
      // Create membership record for creator
      const membershipRef = doc(collection(db, 'memberships'));
      await setDoc(membershipRef, {
        id: membershipRef.id,
        userId: user.uid,
        crewId: crewRef.id,
        role: 'admin',
        isActive: true,
        joinedAt: serverTimestamp()
      });
      
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
          // Find user by their Firebase UID
          const creatorQuery = query(
            collection(db, 'users'),
            where('firebaseUID', '==', crewData.createdBy)
          );
          const creatorSnapshot = await getDocs(creatorQuery);
          if (!creatorSnapshot.empty) {
            crewData.createdByUser = creatorSnapshot.docs[0].data();
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
        where('userId', '==', user.uid), // Use Firebase Auth UID
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
        where('userId', '==', user.uid), // Use Firebase Auth UID
        where('crewId', '==', crewId),
        where('isActive', '==', true)
      );
      const existingSnapshot = await getDocs(existingMembership);
      
      if (!existingSnapshot.empty) {
        throw new Error('Already a member of this crew');
      }

      const membershipData = {
        userId: user.uid, // Use Firebase Auth UID instead of profile document ID
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
        senderId: user.uid, // Use Firebase Auth UID
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
          // Find user by their Firebase UID
          const senderQuery = query(
            collection(db, 'users'),
            where('firebaseUID', '==', messageData.senderId)
          );
          const senderSnapshot = await getDocs(senderQuery);
          if (!senderSnapshot.empty) {
            messageData.sender = senderSnapshot.docs[0].data();
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
          // Find user by their Firebase UID
          const senderQuery = query(
            collection(db, 'users'),
            where('firebaseUID', '==', messageData.senderId)
          );
          const senderSnapshot = await getDocs(senderQuery);
          if (!senderSnapshot.empty) {
            messageData.sender = senderSnapshot.docs[0].data();
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
            // Find user by their Firebase UID
            const creatorQuery = query(
              collection(db, 'users'),
              where('firebaseUID', '==', crewData.createdBy)
            );
            const creatorSnapshot = await getDocs(creatorQuery);
            if (!creatorSnapshot.empty) {
              crewData.createdByUser = creatorSnapshot.docs[0].data();
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
        where('userId', '==', user.uid), // Use Firebase Auth UID
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

  // Delete a crew (creator only)
  async deleteCrew(crewId) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      // Check if user is the creator
      const crewDoc = await getDoc(doc(db, 'crews', crewId));
      if (!crewDoc.exists()) {
        throw new Error('Crew not found');
      }

      const crewData = crewDoc.data();
      if (crewData.createdBy !== user.uid) {
        throw new Error('Only the creator can delete this crew');
      }

      // Delete all associated data using batch
      const batch = writeBatch(db);

      // Delete crew document
      batch.delete(doc(db, 'crews', crewId));

      // Delete all memberships for this crew
      const membershipQuery = query(
        collection(db, 'memberships'),
        where('crewId', '==', crewId)
      );
      const membershipSnapshot = await getDocs(membershipQuery);
      membershipSnapshot.docs.forEach(membershipDoc => {
        batch.delete(doc(db, 'memberships', membershipDoc.id));
      });

      // Delete all messages for this crew
      const messagesQuery = query(
        collection(db, 'messages'),
        where('crewId', '==', crewId)
      );
      const messagesSnapshot = await getDocs(messagesQuery);
      messagesSnapshot.docs.forEach(messageDoc => {
        batch.delete(doc(db, 'messages', messageDoc.id));
      });

      await batch.commit();
      return { success: true };
    } catch (error) {
      console.error('Error deleting crew:', error);
      throw error;
    }
  }

  // Add member to crew by email
  async addMemberToCrew(crewId, userEmail) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      // Check if current user is crew creator or admin
      const crewDoc = await getDoc(doc(db, 'crews', crewId));
      if (!crewDoc.exists()) {
        throw new Error('Crew not found');
      }

      const crewData = crewDoc.data();
      const members = crewData.members || [];
      if (crewData.createdBy !== user.uid && !members.includes(user.uid)) {
        throw new Error('Only crew members can add new members');
      }

      // Find user by email
      const userQuery = query(
        collection(db, 'users'),
        where('email', '==', userEmail)
      );
      const userSnapshot = await getDocs(userQuery);
      
      if (userSnapshot.empty) {
        throw new Error('User not found with this email');
      }

      const userData = userSnapshot.docs[0].data();
      const newMemberUid = userData.firebaseUID;

      // Check if user is already a member
      if (members.includes(newMemberUid)) {
        throw new Error('User is already a member of this crew');
      }

      // Add user to crew members
      await updateDoc(doc(db, 'crews', crewId), {
        members: [...members, newMemberUid],
        updatedAt: Timestamp.now()
      });

      // Create membership record
      const membershipRef = doc(collection(db, 'memberships'));
      await setDoc(membershipRef, {
        id: membershipRef.id,
        userId: newMemberUid,
        crewId: crewId,
        role: 'member',
        isActive: true,
        joinedAt: Timestamp.now()
      });

      return { success: true, memberName: userData.displayName || userData.username };
    } catch (error) {
      console.error('Error adding member to crew:', error);
      throw error;
    }
  }

  // Get crew members list
  async getCrewMembers(crewId) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      // Get crew data to verify access
      const crewDoc = await getDoc(doc(db, 'crews', crewId));
      if (!crewDoc.exists()) {
        throw new Error('Crew not found');
      }

      const crewData = crewDoc.data();
      const members = crewData.members || [];
      if (!members.includes(user.uid)) {
        throw new Error('Access denied: Not a member of this crew');
      }

      // Get all member details
      const membersData = [];
      for (const memberUid of members) {
        const memberQuery = query(
          collection(db, 'users'),
          where('firebaseUID', '==', memberUid)
        );
        const memberSnapshot = await getDocs(memberQuery);
        if (!memberSnapshot.empty) {
          const memberData = memberSnapshot.docs[0].data();
          membersData.push({
            uid: memberUid,
            username: memberData.username,
            displayName: memberData.displayName,
            email: memberData.email,
            isOnline: memberData.isOnline || false,
            profilePictureUrl: memberData.profilePictureUrl,
            lastActiveAt: memberData.lastActiveAt,
            isCreator: memberUid === crewData.createdBy
          });
        }
      }

      return membersData;
    } catch (error) {
      console.error('Error getting crew members:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const crewConnectService = new CrewConnectService();
export default crewConnectService;
