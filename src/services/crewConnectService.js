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
  limitToLast,
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
import cacheService from './cacheService';

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
        joinedAt: serverTimestamp(),
        canInvite: true,
        canModerate: true
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

      const cacheKey = `user_crews_${user.uid}`;
      const cached = cacheService.get(cacheKey);
      if (cached) {
        console.log('🎯 Using cached user crews');
        return cached;
      }

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
      const seenCrewIds = new Set(); // Prevent duplicates
      
      for (const membershipDoc of membershipSnapshot.docs) {
        const membershipData = membershipDoc.data();
        const crewId = membershipData.crewId;
        
        // Skip if we've already processed this crew
        if (seenCrewIds.has(crewId)) {
          console.warn(`Duplicate membership found for crew ${crewId}, cleaning up...`);
          // Clean up duplicate membership (async, doesn't block UI)
          this.cleanupDuplicateMembership(crewId, user.uid).catch(console.error);
          continue;
        }
        
        seenCrewIds.add(crewId);
        const crewDoc = await getDoc(doc(db, 'crews', crewId));
        
        if (crewDoc.exists()) {
          const crewData = crewDoc.data();
          
          // Run consistency check for crews where user is creator
          if (crewData.createdBy === user.uid) {
            // Ensure creator has proper membership (async, doesn't block UI)
            this.ensureCreatorMembership(crewId).catch(console.error);
          }
          
          crews.push({
            id: crewDoc.id,
            ...crewData,
            membership: {
              role: membershipData.role,
              joinedAt: membershipData.joinedAt,
              canInvite: membershipData.canInvite || false,
              canModerate: membershipData.canModerate || false,
            }
          });

          // Auto-sync member count to fix any inconsistencies
          this.syncCrewMemberCount(crewId).catch(console.error);
        }
      }
      
      // Cache for 2 minutes
      cacheService.set(cacheKey, crews, 120000);
      console.log('🎯 Cached user crews');
      
      return crews;
    } catch (error) {
      console.error('Error getting user crews:', error);
      throw error;
    }
  }

  // Clean up duplicate memberships
  async cleanupDuplicateMembership(crewId, userId) {
    try {
      console.log('🧹 Cleaning up duplicate memberships for crew:', crewId, 'user:', userId);
      
      const membershipQuery = query(
        collection(db, 'memberships'),
        where('crewId', '==', crewId),
        where('userId', '==', userId),
        where('isActive', '==', true)
      );
      
      const snapshot = await getDocs(membershipQuery);
      
      if (snapshot.size <= 1) {
        console.log('🧹 No duplicates found');
        return;
      }
      
      console.log('🧹 Found', snapshot.size, 'duplicate memberships, keeping the first one');
      
      // Keep the first (oldest) membership, delete the rest
      const docs = snapshot.docs;
      for (let i = 1; i < docs.length; i++) {
        await deleteDoc(docs[i].ref);
        console.log('🧹 Deleted duplicate membership:', docs[i].id);
      }
      
    } catch (error) {
      console.error('Error cleaning up duplicate memberships:', error);
    }
  }

  async joinCrew(crewId, role = 'member') {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const userProfile = await this.getUserProfile();
      if (!userProfile) throw new Error('User profile not found');

      // Get crew info first
      const crewDoc = await getDoc(doc(db, 'crews', crewId));
      if (!crewDoc.exists()) {
        throw new Error('Crew not found');
      }
      
      const crewData = crewDoc.data();
      
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

      // For private groups, only allow joining through invitation
      if (!crewData.isPublic) {
        throw new Error('This is a private group. You need an invitation to join.');
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
      
      // Also update the crew's members array
      const crewDocRef = await getDoc(doc(db, 'crews', crewId));
      if (crewDocRef.exists()) {
        const updatedCrewData = crewDocRef.data();
        const currentMembers = updatedCrewData.members || [];
        if (!currentMembers.includes(user.uid)) {
          await updateDoc(doc(db, 'crews', crewId), {
            members: [...currentMembers, user.uid],
            memberCount: (updatedCrewData.memberCount || 0) + 1,
            updatedAt: serverTimestamp()
          });
        }
      }
      
      // Clear crew caches since membership changed
      cacheService.invalidate(`user_crews_${user.uid}`);
      console.log('🎯 Cleared crew cache for user', user.uid);
      
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
      
      // Invalidate message caches for this crew
      cacheService.invalidate(`crew_messages_${crewId}`);
      console.log('🎯 Invalidated message cache for crew', crewId);
      
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
      const cacheKey = `crew_messages_${crewId}_${messageLimit}`;
      const cached = cacheService.get(cacheKey);
      if (cached) {
        console.log('🎯 Using cached crew messages for', crewId);
        return cached;
      }

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
      
      const result = messages.reverse(); // Return in chronological order
      
      // Cache for 30 seconds (messages update frequently)
      cacheService.set(cacheKey, result, 30000);
      console.log('🎯 Cached crew messages for', crewId);
      
      return result;
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

      // Refresh auth token to ensure it's not expired
      try {
        await user.getIdToken(true); // Force refresh
        console.log('🗑️ DEBUG: Auth token refreshed successfully');
      } catch (tokenError) {
        console.error('🗑️ ERROR: Failed to refresh auth token:', tokenError);
        throw new Error('Authentication token expired. Please sign out and sign in again.');
      }

      console.log('🗑️ DEBUG: Attempting to delete crew', crewId, 'by user', user.uid);

      // Check if user is the creator
      const crewDoc = await getDoc(doc(db, 'crews', crewId));
      if (!crewDoc.exists()) {
        throw new Error('Crew not found');
      }

      const crewData = crewDoc.data();
      console.log('🗑️ DEBUG: Crew data:', { 
        id: crewId, 
        createdBy: crewData.createdBy, 
        currentUser: user.uid,
        matches: crewData.createdBy === user.uid 
      });

      // Get user profile to cross-check
      const userProfile = await this.getUserProfile();
      console.log('🗑️ DEBUG: User profile:', {
        firebaseUID: userProfile?.firebaseUID,
        currentAuthUID: user.uid,
        matches: userProfile?.firebaseUID === user.uid
      });

      // Additional UID debugging
      console.log('🗑️ DEBUG: UID comparison details:');
      console.log('🗑️ DEBUG: crewData.createdBy type:', typeof crewData.createdBy);
      console.log('🗑️ DEBUG: crewData.createdBy value:', crewData.createdBy);
      console.log('🗑️ DEBUG: crewData.createdBy length:', crewData.createdBy?.length);
      console.log('🗑️ DEBUG: user.uid type:', typeof user.uid);
      console.log('🗑️ DEBUG: user.uid value:', user.uid);
      console.log('🗑️ DEBUG: user.uid length:', user.uid?.length);
      console.log('🗑️ DEBUG: String comparison:', String(crewData.createdBy) === String(user.uid));
      console.log('🗑️ DEBUG: Trimmed comparison:', String(crewData.createdBy).trim() === String(user.uid).trim());

      // Use more robust UID comparison
      const isCreator = String(crewData.createdBy).trim() === String(user.uid).trim();
      
      if (!isCreator) {
        console.log('🗑️ DEBUG: Creator check failed, checking admin role...');
        
        // Also check membership role as backup
        const membershipCheckQuery = query(
          collection(db, 'memberships'),
          where('userId', '==', user.uid),
          where('crewId', '==', crewId),
          where('isActive', '==', true)
        );
        const membershipCheckSnapshot = await getDocs(membershipCheckQuery);
        
        if (!membershipCheckSnapshot.empty) {
          const membershipData = membershipCheckSnapshot.docs[0].data();
          console.log('🗑️ DEBUG: User membership role:', membershipData.role);
          
          // Allow deletion if user is admin
          if (membershipData.role === 'admin') {
            console.log('🗑️ DEBUG: User is admin, allowing deletion');
          } else {
            throw new Error(`Insufficient permissions: You are a ${membershipData.role}, but only admins or creators can delete groups. CreatedBy: ${crewData.createdBy}, Your UID: ${user.uid}`);
          }
        } else {
          console.log('🗑️ DEBUG: No active membership found');
          throw new Error(`Access denied: No active membership found. You might not be a member of this group. CreatedBy: ${crewData.createdBy}, Your UID: ${user.uid}`);
        }
      } else {
        console.log('🗑️ DEBUG: Creator check passed');
      }

      console.log('🗑️ DEBUG: Permission checks passed, proceeding with deletion');

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
      
      console.log('🗑️ DEBUG: Crew deletion batch committed successfully');
      
      // Clear all relevant caches
      cacheService.invalidate(`user_crews_${user.uid}`);
      cacheService.invalidate(`crew_messages_${crewId}`);
      console.log('🎯 Cleared caches after crew deletion');
      
      return { success: true };
    } catch (error) {
      console.error('🗑️ ERROR: Failed to delete crew:', error);
      console.error('🗑️ ERROR: Error code:', error.code);
      console.error('🗑️ ERROR: Error message:', error.message);
      
      // Check for specific Firebase permission errors
      if (error.code === 'permission-denied') {
        throw new Error('Permission denied: You may not have the required permissions to delete this group. Please ensure you are the group creator or admin.');
      } else if (error.code === 'unauthenticated') {
        throw new Error('Authentication required: Please sign in again and try deleting the group.');
      } else if (error.code === 'not-found') {
        throw new Error('Group not found: This group may have already been deleted.');
      }
      
      throw error;
    }
  }

  // Join Request and Invitation System

  // Send join request to a crew
  async sendJoinRequest(crewId, message = '') {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const userProfile = await this.getUserProfile();
      if (!userProfile) throw new Error('User profile not found');

      // Check if user is already a member
      const existingMembership = query(
        collection(db, 'memberships'),
        where('userId', '==', user.uid),
        where('crewId', '==', crewId),
        where('isActive', '==', true)
      );
      const existingSnapshot = await getDocs(existingMembership);
      
      if (!existingSnapshot.empty) {
        throw new Error('Already a member of this crew');
      }

      // Check if there's already a pending request
      const pendingRequest = query(
        collection(db, 'joinRequests'),
        where('userId', '==', user.uid),
        where('crewId', '==', crewId),
        where('status', '==', 'pending')
      );
      const pendingSnapshot = await getDocs(pendingRequest);
      
      if (!pendingSnapshot.empty) {
        throw new Error('Join request already pending');
      }

      const requestData = {
        userId: user.uid,
        crewId,
        userEmail: userProfile.email,
        userName: userProfile.displayName || userProfile.username,
        userAvatar: userProfile.avatarUrl || null,
        message,
        status: 'pending',
        createdAt: serverTimestamp()
      };

      const requestRef = await addDoc(collection(db, 'joinRequests'), requestData);
      return { id: requestRef.id, ...requestData };
    } catch (error) {
      console.error('Error sending join request:', error);
      throw error;
    }
  }

  // Get pending join requests for a crew (for crew owners/admins)
  async getJoinRequests(crewId, status = 'pending') {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      // Verify user is crew owner/admin
      const crewDoc = await getDoc(doc(db, 'crews', crewId));
      if (!crewDoc.exists()) {
        throw new Error('Crew not found');
      }

      const crewData = crewDoc.data();
      
      // Check if user has permission to view join requests
      let hasPermission = false;
      
      // Crew creators always have permission
      if (crewData.createdBy === user.uid) {
        hasPermission = true;
      } else {
        // Check membership permissions for non-creators
        const membershipQuery = query(
          collection(db, 'memberships'),
          where('userId', '==', user.uid),
          where('crewId', '==', crewId),
          where('isActive', '==', true)
        );
        const membershipSnapshot = await getDocs(membershipQuery);
        
        if (!membershipSnapshot.empty) {
          const membership = membershipSnapshot.docs[0].data();
          // Allow admins or moderators to view join requests
          if (membership.role === 'admin' || membership.role === 'moderator') {
            hasPermission = true;
          }
        }
      }
      
      if (!hasPermission) {
        throw new Error('Only crew owners and admins can view join requests');
      }

      const requestsQuery = query(
        collection(db, 'joinRequests'),
        where('crewId', '==', crewId)
      );

      const snapshot = await getDocs(requestsQuery);
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter(req => req.status === status); // Filter in memory

      return requests;
    } catch (error) {
      console.error('Error getting join requests:', error);
      throw error;
    }
  }

  // Handle join request (approve/reject)
  async handleJoinRequest(requestId, action, crewId = null) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      // Get the request
      const requestDoc = await getDoc(doc(db, 'joinRequests', requestId));
      if (!requestDoc.exists()) {
        throw new Error('Join request not found');
      }

      const requestData = requestDoc.data();
      const crewIdToUse = crewId || requestData.crewId;

      // Ensure creator has proper membership (fixes legacy crews)
      await this.ensureCreatorMembership(crewIdToUse);

      // Verify user is crew owner/admin
      const crewDoc = await getDoc(doc(db, 'crews', crewIdToUse));
      if (!crewDoc.exists()) {
        throw new Error('Crew not found');
      }

      const crewData = crewDoc.data();
      
      // Check if user has permission to handle join requests
      let hasPermission = false;
      
      // Crew creators always have permission
      if (crewData.createdBy === user.uid) {
        hasPermission = true;
      } else {
        // Check membership permissions for non-creators
        const membershipQuery = query(
          collection(db, 'memberships'),
          where('userId', '==', user.uid),
          where('crewId', '==', crewIdToUse),
          where('isActive', '==', true)
        );
        const membershipSnapshot = await getDocs(membershipQuery);
        
        if (!membershipSnapshot.empty) {
          const membership = membershipSnapshot.docs[0].data();
          // Allow admins or moderators to handle join requests
          if (membership.role === 'admin' || membership.role === 'moderator') {
            hasPermission = true;
          }
        }
      }
      
      if (!hasPermission) {
        throw new Error('Only crew owners and admins can handle join requests');
      }

      // Update request status
      await updateDoc(doc(db, 'joinRequests', requestId), {
        status: action,
        handledBy: user.uid,
        handledAt: serverTimestamp()
      });

      // If approved, add user to crew
      if (action === 'approved') {
        const membershipData = {
          userId: requestData.userId,
          crewId: crewIdToUse,
          role: 'member',
          joinedAt: serverTimestamp(),
          isActive: true,
          canInvite: false,
          canModerate: false,
        };

        await addDoc(collection(db, 'memberships'), membershipData);

        // Update crew member count if needed
        const currentMembers = crewData.members || [];
        if (!currentMembers.includes(requestData.userId)) {
          await updateDoc(doc(db, 'crews', crewIdToUse), {
            members: [...currentMembers, requestData.userId],
            memberCount: (crewData.memberCount || 0) + 1,
            updatedAt: serverTimestamp()
          });
        }
      }

      return { success: true, action };
    } catch (error) {
      console.error('Error handling join request:', error);
      throw error;
    }
  }

  // Send invitation to join crew by email
  async sendInvitation(crewId, userEmail, role = 'member', message = '') {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      // Ensure creator has proper membership (fixes legacy crews)
      await this.ensureCreatorMembership(crewId);

      // Verify user can invite
      const crewDoc = await getDoc(doc(db, 'crews', crewId));
      if (!crewDoc.exists()) {
        throw new Error('Crew not found');
      }

      const crewData = crewDoc.data();
      
      // Check if user has permission to send invitations
      let hasPermission = false;
      
      // Crew creators always have permission
      if (crewData.createdBy === user.uid) {
        hasPermission = true;
      } else {
        // Check membership permissions for non-creators
        const membershipQuery = query(
          collection(db, 'memberships'),
          where('userId', '==', user.uid),
          where('crewId', '==', crewId),
          where('isActive', '==', true)
        );
        const membershipSnapshot = await getDocs(membershipQuery);
        
        if (!membershipSnapshot.empty) {
          const membership = membershipSnapshot.docs[0].data();
          // Allow admins, moderators, or anyone with explicit canInvite permission
          if (membership.role === 'admin' || membership.role === 'moderator' || membership.canInvite === true) {
            hasPermission = true;
          }
        }
      }
      
      if (!hasPermission) {
        throw new Error('You do not have permission to invite members to this crew');
      }

      // Check if user exists
      const userQuery = query(
        collection(db, 'users'),
        where('email', '==', userEmail)
      );
      const userSnapshot = await getDocs(userQuery);
      
      if (userSnapshot.empty) {
        throw new Error('User not found with this email. Please ensure they have registered on the platform.');
      }

      const userData = userSnapshot.docs[0].data();
      const invitedUserId = userData.firebaseUID;

      // Check if user is already a member
      const existingMembership = query(
        collection(db, 'memberships'),
        where('userId', '==', invitedUserId),
        where('crewId', '==', crewId),
        where('isActive', '==', true)
      );
      const existingSnapshot = await getDocs(existingMembership);
      
      if (!existingSnapshot.empty) {
        throw new Error('User is already a member of this crew');
      }

      // Check if there's already a pending invitation
      const pendingInvitation = query(
        collection(db, 'invitations'),
        where('invitedUserId', '==', invitedUserId),
        where('crewId', '==', crewId),
        where('status', '==', 'pending')
      );
      const pendingSnapshot = await getDocs(pendingInvitation);
      
      if (!pendingSnapshot.empty) {
        throw new Error('Invitation already pending for this user');
      }

      const senderProfile = await this.getUserProfile();
      const invitationData = {
        crewId,
        crewName: crewData.name,
        invitedUserId,
        invitedUserEmail: userEmail,
        invitedUserName: userData.displayName || userData.username,
        inviterId: user.uid,
        inviterName: senderProfile?.displayName || senderProfile?.username || 'Unknown',
        role,
        message,
        status: 'pending',
        createdAt: serverTimestamp()
      };

      console.log('📩 DEBUG: Creating invitation with data:', invitationData);
      const invitationRef = await addDoc(collection(db, 'invitations'), invitationData);
      console.log('📩 DEBUG: Invitation created successfully with ID:', invitationRef.id);
      
      return { id: invitationRef.id, ...invitationData };
    } catch (error) {
      console.error('Error sending invitation:', error);
      throw error;
    }
  }

  // Get invitations for current user
  async getUserInvitations(status = 'pending') {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      console.log('🔍 DEBUG: Fetching invitations for user:', user.uid, 'with status:', status);

      const cacheKey = `user_invitations_${user.uid}_${status}`;
      const cached = cacheService.get(cacheKey);
      if (cached) {
        console.log('🎯 Using cached user invitations');
        return cached;
      }

      // Single where clause to avoid composite index
      const invitationsQuery = query(
        collection(db, 'invitations'),
        where('invitedUserId', '==', user.uid)
      );

      const snapshot = await getDocs(invitationsQuery);
      console.log('🔍 DEBUG: Query returned', snapshot.size, 'documents');

      const invitations = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('🔍 DEBUG: Invitation document:', { id: doc.id, status: data.status, invitedUserId: data.invitedUserId });
        return {
          id: doc.id,
          ...data
        };
      }).filter(inv => inv.status === status); // Filter in memory instead of query

      console.log('🔍 DEBUG: Returning', invitations.length, 'filtered invitations');
      
      // Cache for 1 minute (invitations change frequently)
      cacheService.set(cacheKey, invitations, 60000);
      console.log('🎯 Cached user invitations');
      
      return invitations;

    } catch (error) {
      console.error('Error getting user invitations:', error);
      throw error;
    }
  }

  // Handle invitation (accept/decline)
  async handleInvitation(invitationId, action) {
    try {
      console.log('🎯 DEBUG: Handling invitation', invitationId, 'with action', action);
      
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      // Get the invitation
      const invitationDoc = await getDoc(doc(db, 'invitations', invitationId));
      if (!invitationDoc.exists()) {
        throw new Error('Invitation not found');
      }

      const invitationData = invitationDoc.data();
      console.log('🎯 DEBUG: Invitation data:', invitationData);

      // Check if already handled
      if (invitationData.status !== 'pending') {
        console.log('🎯 DEBUG: Invitation already handled with status:', invitationData.status);
        throw new Error(`Invitation was already ${invitationData.status}`);
      }

      // Verify this invitation is for the current user
      if (invitationData.invitedUserId !== user.uid) {
        throw new Error('This invitation is not for you');
      }

      // Update invitation status
      console.log('🎯 DEBUG: Updating invitation status to', action);
      await updateDoc(doc(db, 'invitations', invitationId), {
        status: action,
        handledAt: serverTimestamp()
      });

      // Clear invitation caches
      cacheService.invalidate(`user_invitations_${user.uid}`);
      console.log('🎯 Cleared invitation cache for user', user.uid);

      // If accepted, add user to crew
      if (action === 'accepted') {
        // Check if user is already a member
        const existingMembershipQuery = query(
          collection(db, 'memberships'),
          where('userId', '==', user.uid),
          where('crewId', '==', invitationData.crewId),
          where('isActive', '==', true)
        );
        const existingMembershipSnapshot = await getDocs(existingMembershipQuery);
        
        if (!existingMembershipSnapshot.empty) {
          console.log('🎯 DEBUG: User is already a member, skipping membership creation');
          return { success: true, action, message: 'Already a member of this group' };
        }

        const membershipData = {
          userId: user.uid,
          crewId: invitationData.crewId,
          role: invitationData.role || 'member',
          joinedAt: serverTimestamp(),
          isActive: true,
          canInvite: ['admin', 'moderator'].includes(invitationData.role),
          canModerate: ['admin', 'moderator'].includes(invitationData.role),
        };

        await addDoc(collection(db, 'memberships'), membershipData);

        // Update crew members list
        const crewDoc = await getDoc(doc(db, 'crews', invitationData.crewId));
        if (crewDoc.exists()) {
          const crewData = crewDoc.data();
          const currentMembers = crewData.members || [];
          if (!currentMembers.includes(user.uid)) {
            await updateDoc(doc(db, 'crews', invitationData.crewId), {
              members: [...currentMembers, user.uid],
              memberCount: (crewData.memberCount || 0) + 1,
              updatedAt: serverTimestamp()
            });
          }
        }
        
        // Clear crew caches since membership changed
        cacheService.invalidate(`user_crews_${user.uid}`);
        console.log('🎯 Cleared crew cache for user', user.uid);
      }

      return { success: true, action };
    } catch (error) {
      console.error('Error handling invitation:', error);
      throw error;
    }
  }

  // Modified joinCrew method - now sends a request instead of direct join
  async requestToJoinCrew(crewId, message = '') {
    // For public crews, this might still allow direct join
    // For private crews, this sends a request
    try {
      const crewDoc = await getDoc(doc(db, 'crews', crewId));
      if (!crewDoc.exists()) {
        throw new Error('Crew not found');
      }

      const crewData = crewDoc.data();
      
      // If crew is public and allows auto-join, join directly
      if (crewData.isPublic && crewData.autoJoin !== false) {
        return await this.joinCrew(crewId);
      } else {
        // Send join request
        return await this.sendJoinRequest(crewId, message);
      }
    } catch (error) {
      console.error('Error requesting to join crew:', error);
      throw error;
    }
  }

  // Updated addMemberToCrew - now sends invitation instead of direct add
  async addMemberToCrew(crewId, userEmail, role = 'member', message = '') {
    // This now sends an invitation instead of directly adding
    return await this.sendInvitation(crewId, userEmail, role, message);
  }

  // Remove member from crew (only by crew owner)
  async removeMember(crewId, memberUid) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      // Get crew data to verify ownership
      const crewDoc = await getDoc(doc(db, 'crews', crewId));
      if (!crewDoc.exists()) {
        throw new Error('Crew not found');
      }

      const crewData = crewDoc.data();
      
      // Check if user is the creator or admin
      if (crewData.createdBy !== user.uid) {
        // Check if user has admin privileges
        const membershipQuery = query(
          collection(db, 'memberships'),
          where('userId', '==', user.uid),
          where('crewId', '==', crewId),
          where('isActive', '==', true)
        );
        const membershipSnapshot = await getDocs(membershipQuery);
        
        if (!membershipSnapshot.empty) {
          const membershipData = membershipSnapshot.docs[0].data();
          if (membershipData.role !== 'admin') {
            throw new Error('Access denied: Only crew owners or admins can remove members');
          }
        } else {
          throw new Error('Access denied: Only crew owners or admins can remove members');
        }
      }

      // Cannot remove the creator themselves
      if (memberUid === crewData.createdBy) {
        throw new Error('Cannot remove the crew creator');
      }

      // Get current members list
      const members = crewData.members || [];
      if (!members.includes(memberUid)) {
        throw new Error('User is not a member of this crew');
      }

      // Remove from crew members list and update member count
      const updatedMembers = members.filter(uid => uid !== memberUid);
      await updateDoc(doc(db, 'crews', crewId), {
        members: updatedMembers,
        memberCount: updatedMembers.length, // Update member count
        updatedAt: Timestamp.now()
      });

      console.log('🗑️ DEBUG: Updated crew members:', {
        crewId,
        oldMemberCount: members.length,
        newMemberCount: updatedMembers.length,
        removedMember: memberUid
      });

      // Deactivate membership record
      const membershipQuery = query(
        collection(db, 'memberships'),
        where('userId', '==', memberUid),
        where('crewId', '==', crewId),
        where('isActive', '==', true)
      );
      const membershipSnapshot = await getDocs(membershipQuery);
      
      for (const membershipDoc of membershipSnapshot.docs) {
        await updateDoc(membershipDoc.ref, {
          isActive: false,
          leftAt: Timestamp.now()
        });
      }

      // Clear relevant caches
      cacheService.invalidate(`user_crews_${memberUid}`); // Clear removed member's cache
      cacheService.invalidate(`user_crews_${user.uid}`); // Clear current user's cache
      console.log('🎯 Cleared caches after member removal');

      return { success: true };
    } catch (error) {
      console.error('Error removing member from crew:', error);
      throw error;
    }
  }

  // Utility function to sync member count (temporary for fixing data inconsistencies)
  async syncCrewMemberCount(crewId) {
    try {
      console.log('🔧 DEBUG: Syncing member count for crew', crewId);
      
      const crewDoc = await getDoc(doc(db, 'crews', crewId));
      if (!crewDoc.exists()) {
        console.warn('🔧 DEBUG: Crew not found:', crewId);
        return;
      }

      const crewData = crewDoc.data();
      const currentMembers = crewData.members || [];
      const actualMemberCount = currentMembers.length;
      const storedMemberCount = crewData.memberCount || 0;

      console.log('🔧 DEBUG: Member count comparison:', {
        crewId,
        actualCount: actualMemberCount,
        storedCount: storedMemberCount,
        members: currentMembers
      });

      if (actualMemberCount !== storedMemberCount) {
        console.log('🔧 DEBUG: Fixing member count mismatch');
        await updateDoc(doc(db, 'crews', crewId), {
          memberCount: actualMemberCount,
          updatedAt: serverTimestamp()
        });
        console.log('🔧 DEBUG: Member count updated from', storedMemberCount, 'to', actualMemberCount);
      }

      return { actualCount: actualMemberCount, wasFixed: actualMemberCount !== storedMemberCount };
    } catch (error) {
      console.error('🔧 ERROR: Failed to sync member count:', error);
      return null;
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

  // Utility method to ensure crew creator has proper membership
  async ensureCreatorMembership(crewId) {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const crewDoc = await getDoc(doc(db, 'crews', crewId));
      if (!crewDoc.exists()) return;

      const crewData = crewDoc.data();
      
      // Only fix membership for actual creators
      if (crewData.createdBy !== user.uid) return;

      // Check if creator already has a membership record
      const membershipQuery = query(
        collection(db, 'memberships'),
        where('userId', '==', user.uid),
        where('crewId', '==', crewId),
        where('isActive', '==', true)
      );
      const membershipSnapshot = await getDocs(membershipQuery);

      // If no membership exists, create one
      if (membershipSnapshot.empty) {
        const membershipData = {
          userId: user.uid,
          crewId: crewId,
          role: 'admin',
          joinedAt: serverTimestamp(),
          isActive: true,
          canInvite: true,
          canModerate: true
        };

        await addDoc(collection(db, 'memberships'), membershipData);
        
        // Also ensure they're in the crew members array
        const currentMembers = crewData.members || [];
        if (!currentMembers.includes(user.uid)) {
          await updateDoc(doc(db, 'crews', crewId), {
            members: [...currentMembers, user.uid],
            memberCount: Math.max((crewData.memberCount || 0), currentMembers.length + 1),
            updatedAt: serverTimestamp()
          });
        }
        
        console.log('Created missing membership record for crew creator');
      } else {
        // Check if existing membership has proper permissions
        const membership = membershipSnapshot.docs[0].data();
        if (!membership.canInvite || membership.role !== 'admin') {
          await updateDoc(membershipSnapshot.docs[0].ref, {
            role: 'admin',
            canInvite: true,
            canModerate: true,
            updatedAt: serverTimestamp()
          });
          console.log('Updated creator membership permissions');
        }
      }
    } catch (error) {
      console.error('Error ensuring creator membership:', error);
    }
  }

  // Utility method to fix membership inconsistencies
  async validateAndFixMembershipConsistency(crewId) {
    try {
      const crewDoc = await getDoc(doc(db, 'crews', crewId));
      if (!crewDoc.exists()) return;

      const crewData = crewDoc.data();
      const crewMembers = new Set(crewData.members || []);

      // Get all active memberships for this crew
      const membershipQuery = query(
        collection(db, 'memberships'),
        where('crewId', '==', crewId),
        where('isActive', '==', true)
      );
      const membershipSnapshot = await getDocs(membershipQuery);
      
      const membershipUserIds = new Set();
      membershipSnapshot.docs.forEach(doc => {
        membershipUserIds.add(doc.data().userId);
      });

      // Find discrepancies
      const missingFromMembers = [...membershipUserIds].filter(id => !crewMembers.has(id));
      const missingFromMemberships = [...crewMembers].filter(id => !membershipUserIds.has(id));

      let needsUpdate = false;
      let updatedMembers = [...crewMembers];

      // Add missing members to crew members array
      if (missingFromMembers.length > 0) {
        updatedMembers = [...new Set([...updatedMembers, ...missingFromMembers])];
        needsUpdate = true;
        console.log('Fixed missing members in crew array:', missingFromMembers);
      }

      // Remove orphaned entries from crew members array (optional - might want to keep for audit)
      // For now, we'll just log them
      if (missingFromMemberships.length > 0) {
        console.log('Found users in crew members array without membership:', missingFromMemberships);
      }

      // Update crew document if needed
      if (needsUpdate) {
        await updateDoc(doc(db, 'crews', crewId), {
          members: updatedMembers,
          memberCount: updatedMembers.length,
          updatedAt: serverTimestamp()
        });
      }

    } catch (error) {
      console.error('Error validating membership consistency:', error);
    }
  }
}

// Export singleton instance
export const crewConnectService = new CrewConnectService();
export default crewConnectService;
