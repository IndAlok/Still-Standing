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
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../config/firebase';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create user document in Firestore
  const createUserDocument = async (user, additionalData = {}) => {
    if (!user) return;
    
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      const { displayName, email, photoURL } = user;
      const createdAt = serverTimestamp();
      
      try {
        await setDoc(userRef, {
          displayName: displayName || additionalData.username,
          email,
          photoURL: photoURL || null,
          createdAt,
          lastLoginAt: serverTimestamp(),
          isOnline: true,
          bio: '',
          location: '',
          joinedGroups: [],
          createdGroups: [],
          ...additionalData
        });
      } catch (error) {
        console.error('Error creating user document:', error);
        throw error;
      }
    } else {
      // Update last login time
      await updateDoc(userRef, {
        lastLoginAt: serverTimestamp(),
        isOnline: true
      });
    }
    
    return userRef;
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
      
      // Create user document in Firestore
      await createUserDocument(result.user, { username });
      
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
      await createUserDocument(result.user);
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
      await createUserDocument(result.user);
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
      
      // Update user status to offline
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          isOnline: false,
          lastSeen: serverTimestamp()
        });
      }
      
      return await signOut(auth);
    } catch (error) {
      setError(error.message);
      throw error;
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

  // Get user data from Firestore
  const getUserData = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId || currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return { id: userSnap.id, ...userSnap.data() };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Ensure user document exists and update online status
        await createUserDocument(user);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          isOnline: false,
          lastSeen: serverTimestamp()
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentUser]);

  const value = {
    currentUser,
    login,
    signup,
    logout,
    resetPassword,
    loginWithGoogle,
    updateUserProfile,
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
