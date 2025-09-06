import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// For development, try to use emulator if available
if (process.env.NODE_ENV === 'development') {
  // Check if we're already connected to avoid re-connection errors
  if (!globalThis._firebaseEmulatorConnected) {
    try {
      console.log('🔧 Attempting to connect to Firebase emulators...');
      
      // Only connect if emulator is running (non-blocking check)
      fetch('http://localhost:9199/storage/v1/b/default/o')
        .then(() => {
          connectStorageEmulator(storage, 'localhost', 9199);
          console.log('✅ Connected to Storage emulator');
        })
        .catch(() => {
          console.log('📡 Storage emulator not available, using production');
        });
        
      globalThis._firebaseEmulatorConnected = true;
    } catch (error) {
      console.warn('⚠️ Emulator connection failed:', error.message);
    }
  }
}

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;
