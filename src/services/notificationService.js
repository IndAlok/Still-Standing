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
  serverTimestamp,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';

class NotificationService {
  
  // Notification types
  static TYPES = {
    GROUP_INVITE: 'group_invite',
    GROUP_JOIN_REQUEST: 'group_join_request', 
    GROUP_MEMBER_JOINED: 'group_member_joined',
    GROUP_MEMBER_LEFT: 'group_member_left',
    SKILL_MATCH_FOUND: 'skill_match_found',
    NEW_MESSAGE: 'new_message',
    PROFILE_VIEW: 'profile_view',
    FRIEND_REQUEST: 'friend_request',
    SYSTEM_UPDATE: 'system_update',
    ACHIEVEMENT_UNLOCK: 'achievement_unlock'
  };

  // Create a new notification
  async createNotification(data) {
    try {
      const notification = {
        ...data,
        createdAt: serverTimestamp(),
        isRead: false,
        isDeleted: false,
        id: null // Will be set by Firestore
      };

      const docRef = await addDoc(collection(db, 'notifications'), notification);
      
      // Update the notification with its ID
      await updateDoc(docRef, { id: docRef.id });
      
      return { id: docRef.id, ...notification };
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Send group invitation notification
  async sendGroupInvite(inviterId, inviteeId, groupId, groupName) {
    try {
      // Get inviter details
      const inviterQuery = query(
        collection(db, 'users'),
        where('firebaseUID', '==', inviterId)
      );
      const inviterSnapshot = await getDocs(inviterQuery);
      const inviterData = inviterSnapshot.docs[0]?.data();

      return await this.createNotification({
        type: NotificationService.TYPES.GROUP_INVITE,
        recipientId: inviteeId,
        senderId: inviterId,
        title: 'Group Invitation',
        message: `${inviterData?.displayName || 'Someone'} invited you to join "${groupName}"`,
        data: {
          groupId: groupId,
          groupName: groupName,
          inviterName: inviterData?.displayName || 'Unknown',
          inviterAvatar: inviterData?.profilePictureUrl
        },
        actionUrl: `/groups/${groupId}`,
        priority: 'high'
      });
    } catch (error) {
      console.error('Error sending group invite notification:', error);
      throw error;
    }
  }

  // Send skill match notification
  async sendSkillMatchFound(userId, matchedUserId, skillName) {
    try {
      // Get matched user details
      const userQuery = query(
        collection(db, 'users'),
        where('firebaseUID', '==', matchedUserId)
      );
      const userSnapshot = await getDocs(userQuery);
      const userData = userSnapshot.docs[0]?.data();

      return await this.createNotification({
        type: NotificationService.TYPES.SKILL_MATCH_FOUND,
        recipientId: userId,
        senderId: 'system',
        title: 'Skill Match Found!',
        message: `${userData?.displayName || 'Someone'} shares your interest in ${skillName}`,
        data: {
          matchedUserId: matchedUserId,
          matchedUserName: userData?.displayName || 'Unknown',
          matchedUserAvatar: userData?.profilePictureUrl,
          skillName: skillName
        },
        actionUrl: `/profile/${matchedUserId}`,
        priority: 'medium'
      });
    } catch (error) {
      console.error('Error sending skill match notification:', error);
      throw error;
    }
  }

  // Send new message notification (for groups user is not currently viewing)
  async sendNewMessageNotification(groupId, senderId, message, excludeUserId = null) {
    try {
      // Get group members
      const groupDoc = await getDoc(doc(db, 'crews', groupId));
      if (!groupDoc.exists()) return;

      const groupData = groupDoc.data();
      const members = groupData.members || [];

      // Get sender details
      const senderQuery = query(
        collection(db, 'users'),
        where('firebaseUID', '==', senderId)
      );
      const senderSnapshot = await getDocs(senderQuery);
      const senderData = senderSnapshot.docs[0]?.data();

      // Send notification to all members except sender and excluded user
      const promises = members
        .filter(memberId => memberId !== senderId && memberId !== excludeUserId)
        .map(memberId => this.createNotification({
          type: NotificationService.TYPES.NEW_MESSAGE,
          recipientId: memberId,
          senderId: senderId,
          title: `New message in ${groupData.name}`,
          message: `${senderData?.displayName || 'Someone'}: ${message.length > 50 ? message.substring(0, 50) + '...' : message}`,
          data: {
            groupId: groupId,
            groupName: groupData.name,
            senderName: senderData?.displayName || 'Unknown',
            senderAvatar: senderData?.profilePictureUrl,
            messagePreview: message
          },
          actionUrl: `/chat/${groupId}`,
          priority: 'low'
        }));

      await Promise.all(promises);
    } catch (error) {
      console.error('Error sending new message notifications:', error);
    }
  }

  // Send member joined notification
  async sendMemberJoined(groupId, newMemberId) {
    try {
      const groupDoc = await getDoc(doc(db, 'crews', groupId));
      if (!groupDoc.exists()) return;

      const groupData = groupDoc.data();
      const members = groupData.members || [];

      // Get new member details
      const memberQuery = query(
        collection(db, 'users'),
        where('firebaseUID', '==', newMemberId)
      );
      const memberSnapshot = await getDocs(memberQuery);
      const memberData = memberSnapshot.docs[0]?.data();

      // Notify all existing members except the new member
      const promises = members
        .filter(memberId => memberId !== newMemberId)
        .map(memberId => this.createNotification({
          type: NotificationService.TYPES.GROUP_MEMBER_JOINED,
          recipientId: memberId,
          senderId: newMemberId,
          title: 'New Member Joined',
          message: `${memberData?.displayName || 'Someone'} joined "${groupData.name}"`,
          data: {
            groupId: groupId,
            groupName: groupData.name,
            memberName: memberData?.displayName || 'Unknown',
            memberAvatar: memberData?.profilePictureUrl
          },
          actionUrl: `/chat/${groupId}`,
          priority: 'low'
        }));

      await Promise.all(promises);
    } catch (error) {
      console.error('Error sending member joined notifications:', error);
    }
  }

  // Get user notifications
  async getUserNotifications(userId, limit = 20, unreadOnly = false) {
    try {
      let q = query(
        collection(db, 'notifications'),
        where('recipientId', '==', userId),
        where('isDeleted', '==', false),
        orderBy('createdAt', 'desc'),
        limit(limit)
      );

      if (unreadOnly) {
        q = query(
          collection(db, 'notifications'),
          where('recipientId', '==', userId),
          where('isDeleted', '==', false),
          where('isRead', '==', false),
          orderBy('createdAt', 'desc'),
          limit(limit)
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  // Get unread notification count
  async getUnreadCount(userId) {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('recipientId', '==', userId),
        where('isRead', '==', false),
        where('isDeleted', '==', false)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        isRead: true,
        readAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId) {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('recipientId', '==', userId),
        where('isRead', '==', false)
      );
      
      const snapshot = await getDocs(q);
      const promises = snapshot.docs.map(doc => 
        updateDoc(doc.ref, {
          isRead: true,
          readAt: serverTimestamp()
        })
      );
      
      await Promise.all(promises);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(notificationId) {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        isDeleted: true,
        deletedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Subscribe to real-time notifications
  subscribeToNotifications(userId, callback) {
    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', userId),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(notifications);
    });
  }

  // Subscribe to unread count
  subscribeToUnreadCount(userId, callback) {
    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', userId),
      where('isRead', '==', false),
      where('isDeleted', '==', false)
    );

    return onSnapshot(q, (snapshot) => {
      callback(snapshot.size);
    });
  }
}

export const notificationService = new NotificationService();
export default notificationService;
