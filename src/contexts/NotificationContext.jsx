import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notificationService';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setIsLoading(true);

    // Subscribe to notifications
    const unsubscribeNotifications = notificationService.subscribeToNotifications(
      user.uid,
      (newNotifications) => {
        setNotifications(newNotifications);
        setIsLoading(false);
      }
    );

    // Subscribe to unread count
    const unsubscribeUnreadCount = notificationService.subscribeToUnreadCount(
      user.uid,
      (count) => {
        setUnreadCount(count);
      }
    );

    return () => {
      unsubscribeNotifications();
      unsubscribeUnreadCount();
    };
  }, [user?.uid]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      // Update local state immediately for better UX
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      await notificationService.markAllAsRead(user.uid);
      // Update local state immediately
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      
    }
  }, [user?.uid]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      // Update local state immediately
      setNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      );
    } catch (error) {
      
    }
  }, []);

  // Send notification helpers
  const sendGroupInvite = useCallback(async (inviteeId, groupId, groupName) => {
    if (!user?.uid) return;
    
    try {
      return await notificationService.sendGroupInvite(
        user.uid, 
        inviteeId, 
        groupId, 
        groupName
      );
    } catch (error) {
      
      throw error;
    }
  }, [user?.uid]);

  const sendSkillMatch = useCallback(async (matchedUserId, skillName) => {
    if (!user?.uid) return;
    
    try {
      return await notificationService.sendSkillMatchFound(
        user.uid, 
        matchedUserId, 
        skillName
      );
    } catch (error) {
      
      throw error;
    }
  }, [user?.uid]);

  const sendNewMessage = useCallback(async (groupId, message, excludeUserId = null) => {
    if (!user?.uid) return;
    
    try {
      return await notificationService.sendNewMessageNotification(
        groupId, 
        user.uid, 
        message, 
        excludeUserId
      );
    } catch (error) {
      
    }
  }, [user?.uid]);

  const sendMemberJoined = useCallback(async (groupId, newMemberId) => {
    try {
      return await notificationService.sendMemberJoined(groupId, newMemberId);
    } catch (error) {
      
    }
  }, []);

  // Get formatted time for notification display
  const getFormattedTime = useCallback((timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInMs = now - date;
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    if (diffInMs < 1000 * 60) { // Less than 1 minute
      return 'Just now';
    } else if (diffInMs < 1000 * 60 * 60) { // Less than 1 hour
      const minutes = Math.floor(diffInMs / (1000 * 60));
      return `${minutes}m ago`;
    } else if (diffInHours < 24) { // Less than 24 hours
      const hours = Math.floor(diffInHours);
      return `${hours}h ago`;
    } else if (diffInDays < 7) { // Less than 7 days
      const days = Math.floor(diffInDays);
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }, []);

  const value = {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    sendGroupInvite,
    sendSkillMatch,
    sendNewMessage,
    sendMemberJoined,
    getFormattedTime
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
