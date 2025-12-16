import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { auth, googleProvider, db } from '../config/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { crewConnectService } from '../services/crewConnectService';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create or get user profile using crewConnectService
  const handleUserProfile = async (user) => {
    if (!user) {
      setUserProfile(null);
      return;
    }
    
    try {
      // Try to get existing profile
      const existingProfile = await crewConnectService.getUserProfile(user.uid);
      
      if (existingProfile) {
        setUserProfile(existingProfile);
      } else {
        // Create new profile for first-time users
        const newProfile = await crewConnectService.createUserProfile({
          username: user.email.split('@')[0],
          displayName: user.displayName || user.email.split('@')[0],
          email: user.email,
          profilePicture: user.photoURL || null,
          bio: `Hello! I'm ${user.displayName || 'new'} on CrewConnect!`,
          createdAt: new Date(),
          lastSeen: new Date()
        });
        setUserProfile(newProfile);
      }
    } catch (error) {
      console.error('Error handling user profile:', error);
      setError('Failed to create user profile');
    }
  };
  
  // Sign up with email and password
  const signup = async (email, password, username) => {
    try {
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      await updateProfile(result.user, {
        displayName: username
      });
      
      // Create user profile using crewConnectService
      await handleUserProfile(result.user);
      
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Sign in with email and password
  const login = async (email, password) => {
    try {
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      await handleUserProfile(result.user);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Sign in with Google
  const loginWithGoogle = async () => {
    try {
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      await handleUserProfile(result.user);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Sign out
  const logout = async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Update user status to offline if profile exists
      if (userProfile) {
        try {
          await crewConnectService.updateUserProfile({
            isOnline: false,
          });
        } catch (error) {
          console.error('Error updating offline status:', error);
          // Don't throw error, continue with logout
        }
      }
      
      // Clear user profile first
      setUserProfile(null);
      setCurrentUser(null);
      
      // Sign out from Firebase
      await signOut(auth);
      
      return true;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  // Update user profile
  const updateUserProfile = async (updates) => {
    try {
      setError(null);
      
      if (!currentUser) throw new Error('No user logged in');
      
      // Update Firebase Auth profile
      if (updates.displayName || updates.photoURL) {
        await updateProfile(currentUser, {
          displayName: updates.displayName || currentUser.displayName,
          photoURL: updates.photoURL || currentUser.photoURL
        });
      }
      
      // Update Firestore document
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Refresh user profile
  const refreshUserProfile = async () => {
    if (!currentUser) return;
    
    try {
      const updatedProfile = await crewConnectService.getUserProfile(currentUser.uid);
      if (updatedProfile) {
        setUserProfile(updatedProfile);
      }
    } catch (error) {
      console.warn('Failed to refresh user profile:', error);
    }
  };

  // Update password
  const updateUserPassword = async (currentPassword, newPassword) => {
    try {
      setError(null);
      
      if (!currentUser || !currentUser.email) {
        throw new Error('No user logged in');
      }
      
      // Reauthenticate user
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );
      
      await reauthenticateWithCredential(currentUser, credential);
      
      // Update password
      await updatePassword(currentUser, newPassword);
      
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Get user data (updated to use crewConnectService)
  const getUserData = async (userId) => {
    try {
      if (userId) {
        // If specific userId is provided, try to get that user's profile
        return await crewConnectService.getUserProfile(userId);
      } else {
        // If no userId, return current user's profile
        return userProfile || await crewConnectService.getUserProfile();
      }
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Handle user profile using crewConnectService
        await handleUserProfile(user);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (userProfile) {
        await crewConnectService.updateUserProfile({
          isOnline: false,
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [userProfile]);

  const value = {
    currentUser,
    userProfile,
    login,
    signup,
    logout,
    resetPassword,
    loginWithGoogle,
    updateUserProfile: crewConnectService.updateUserProfile.bind(crewConnectService),
    refreshUserProfile,
    updateUserPassword,
    getUserData,
    error,
    setError,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
