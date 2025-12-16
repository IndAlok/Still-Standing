import { 
  doc, 
  updateDoc, 
  collection, 
  addDoc,
  getDoc,
  storage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from '../config/firebase';
import { auth, db } from '../config/firebase';
import { cacheService } from './cacheService';

class ProfileService {
  constructor() {
    this.CACHE_PREFIX = 'profile';
    this.CACHE_TTL = 10 * 60 * 1000; // 10 minutes
  }

  // Upload and parse resume with backend integration
  async uploadAndParseResume(file, userId) {
    try {
      

      // Upload file to Firebase Storage
      const storageReference = storageRef(storage, `resumes/${userId}/${file.name}`);
      const snapshot = await uploadBytes(storageReference, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      

      // Create FormData to send to Python backend
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('userId', userId);

      // Call Python backend resume parser
      const response = await fetch('http://localhost:5000/api/parse-resume', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Resume parsing failed: ${response.statusText}`);
      }

      const parsedData = await response.json();
      

      // Update user profile with parsed resume data
      const resumeData = {
        fileName: file.name,
        downloadURL,
        uploadedAt: new Date().toISOString(),
        parsedData: {
          skills: parsedData.skills || [],
          experience_level: parsedData.experience_level || 'Beginner',
          domains: parsedData.domains || [],
          companies: parsedData.companies || [],
          location: parsedData.location,
          email: parsedData.email
        }
      };

      await this.updateUserProfile(userId, { resume: resumeData });

      // Invalidate profile cache
      cacheService.invalidatePrefix(`${this.CACHE_PREFIX}_${userId}`);

      return {
        success: true,
        resumeData,
        parsedData
      };

    } catch (error) {
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Remove resume from profile
  async removeResume(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      
      // Get current profile to find resume URL
      const currentProfile = await this.getUserProfile(userId);
      
      // Delete from storage if exists
      if (currentProfile?.resume?.downloadURL) {
        try {
          const storageReference = storageRef(storage, currentProfile.resume.downloadURL);
          await deleteObject(storageReference);
          
        } catch (storageError) {
          
        }
      }

      // Remove from user profile
      await updateDoc(userRef, {
        resume: null
      });

      // Invalidate cache
      cacheService.invalidatePrefix(`${this.CACHE_PREFIX}_${userId}`);

      return { success: true };
    } catch (error) {
      
      return { success: false, error: error.message };
    }
  }

  // Update user profile with caching
  async updateUserProfile(userId, profileData) {
    try {
      const userRef = doc(db, 'users', userId);
      
      // Add timestamp
      const updateData = {
        ...profileData,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(userRef, updateData);

      // Invalidate cache
      cacheService.invalidatePrefix(`${this.CACHE_PREFIX}_${userId}`);

      
      return { success: true };
    } catch (error) {
      
      return { success: false, error: error.message };
    }
  }

  // Get user profile with caching
  async getUserProfile(userId) {
    const cacheKey = `${this.CACHE_PREFIX}_${userId}`;
    
    // Try cache first
    const cachedProfile = cacheService.get(cacheKey);
    if (cachedProfile) {
      
      return cachedProfile;
    }

    try {
      const userRef = doc(db, 'users', userId);
      const docSnap = await getDoc(userRef);
      
      if (docSnap.exists()) {
        const profileData = docSnap.data();
        
        // Cache the result
        cacheService.set(cacheKey, profileData, this.CACHE_TTL);
        
        
        return profileData;
      }
      
      return null;
    } catch (error) {
      
      return null;
    }
  }

  // Update team preferences
  async updateTeamPreferences(userId, preferences) {
    try {
      const userRef = doc(db, 'users', userId);
      
      await updateDoc(userRef, {
        teamPreferences: preferences,
        updatedAt: new Date().toISOString()
      });

      // Invalidate cache
      cacheService.invalidatePrefix(`${this.CACHE_PREFIX}_${userId}`);

      return { success: true };
    } catch (error) {
      
      return { success: false, error: error.message };
    }
  }

  // Upload profile picture
  async uploadProfilePicture(userId, file) {
    try {
      

      const storageReference = storageRef(storage, `profile-pictures/${userId}/${file.name}`);
      const snapshot = await uploadBytes(storageReference, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Update user profile
      await this.updateUserProfile(userId, {
        profilePicture: downloadURL
      });

      
      return { success: true, downloadURL };
    } catch (error) {
      
      return { success: false, error: error.message };
    }
  }

  // Get user statistics and analytics
  async getUserStats(userId) {
    const cacheKey = `${this.CACHE_PREFIX}_stats_${userId}`;
    
    const cachedStats = cacheService.get(cacheKey);
    if (cachedStats) {
      return cachedStats;
    }

    try {
      // Get user's groups, messages, and activities
      // This would be implemented based on your needs
      const stats = {
        groupsJoined: 0,
        messagesSent: 0,
        projectsCompleted: 0,
        skillEndorsements: 0,
        lastActive: new Date().toISOString()
      };

      // Cache for shorter time since stats change frequently
      cacheService.set(cacheKey, stats, 5 * 60 * 1000); // 5 minutes

      return stats;
    } catch (error) {
      
      return null;
    }
  }

  // Search and recommend users
  async searchUsers(query, filters = {}) {
    try {
      // Implement user search with filters
      // This would integrate with your search backend
      
      
      // Placeholder implementation
      return {
        users: [],
        total: 0
      };
    } catch (error) {
      
      return { users: [], total: 0 };
    }
  }
}

// Export singleton instance
export const profileService = new ProfileService();
export default profileService;
