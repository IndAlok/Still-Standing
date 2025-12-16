// Firebase Storage Service for Profile Pictures and Resume Management
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject, 
  listAll,
  getMetadata,
  updateMetadata
} from 'firebase/storage';
import { storage, auth } from '../config/firebase';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import cacheService from './cacheService';

class StorageService {
  constructor() {
    this.PROFILE_PICTURES_PATH = 'profile-pictures';
    this.RESUMES_PATH = 'resumes';
    this.TEMP_PATH = 'temp';
  }

  /**
   * Get current user ID
   */
  getCurrentUserId() {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    return user.uid;
  }

  /**
   * Generate file path for profile picture
   */
  getProfilePicturePath(userId, fileExtension = 'jpg') {
    return `${this.PROFILE_PICTURES_PATH}/${userId}/profile.${fileExtension}`;
  }

  /**
   * Generate file path for resume
   */
  getResumePath(userId, fileName, timestamp = Date.now()) {
    const extension = fileName.split('.').pop();
    return `${this.RESUMES_PATH}/${userId}/${timestamp}-${fileName}`;
  }

  /**
   * Upload profile picture with image optimization
   */
  async uploadProfilePicture(file, userId = null) {
    console.log('🚀 Starting profile picture upload...');
    try {
      const currentUserId = userId || this.getCurrentUserId();
      const user = auth.currentUser;
      console.log('📝 Upload for user ID:', currentUserId);
      console.log('🔐 Auth user ID:', user?.uid);
      console.log('🎯 User IDs match:', currentUserId === user?.uid);
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      // Validate file size (max 5MB)
      const MAX_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        throw new Error('Image size must be less than 5MB');
      }

      // Get file extension
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
      
      if (!validExtensions.includes(fileExtension)) {
        throw new Error('Supported formats: JPG, PNG, WebP, GIF');
      }

      console.log('🔄 Converting file to data URL...');
      // Convert file to Data URL as fallback for CORS issues
      const dataURL = await this.fileToDataURL(file);
      console.log('✅ File converted to data URL, length:', dataURL.length);
      
      // Store in Firestore as a fallback until CORS is resolved
      const profilePictureData = {
        dataURL: dataURL,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadedAt: new Date(),
        uploadMethod: 'dataURL', // Temporary until CORS is fixed
        originalName: file.name
      };

      console.log('💾 Saving to Firestore...');
      // Update user profile in Firestore with data URL
      await this.updateUserProfilePicture(currentUserId, dataURL, profilePictureData);

      console.log('Profile picture uploaded as data URL (CORS workaround) - v2');

      // Clear cache
      cacheService.delete(`profile-${currentUserId}`);

      return {
        success: true,
        url: dataURL,
        path: null, // No Firebase Storage path since we're using data URL
        metadata: {
          size: file.size,
          type: file.type,
          uploadedAt: new Date(),
          method: 'dataURL'
        }
      };

    } catch (error) {
      console.error('❌ Profile picture upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  // Helper method to convert file to data URL
  async fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Upload resume with AI parsing integration
   */
  async uploadResume(file, userId = null) {
    try {
      const currentUserId = userId || this.getCurrentUserId();
      
      if (!currentUserId) {
        throw new Error('User not authenticated');
      }

      // Validate user authentication
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user found');
      }

      console.log('🔐 User authenticated:', {
        uid: user.uid,
        email: user.email,
        currentUserId,
        authState: !!user
      });
      
      // Validate file type
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];

      if (!validTypes.includes(file.type)) {
        throw new Error('Supported formats: PDF, DOC, DOCX, TXT');
      }

      // Validate file size (max 10MB)
      const MAX_SIZE = 10 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        throw new Error('Resume size must be less than 10MB');
      }

      const timestamp = Date.now();
      
      // Parse resume using comprehensive AI backend with profile population
      let parsedData = null;
      let parseError = null;
      let parseMethod = 'none';
      let profilePopulated = false;
      let profileData = null;
      let profileCompleteness = 0;

      try {
        console.log('📄 Parsing resume with comprehensive AI backend and profile population...');
        const parseResult = await this.parseResumeWithAI(file, currentUserId, true);
        
        parsedData = parseResult.data;
        parseMethod = parseResult.method || 'comprehensive_ai';
        profilePopulated = parseResult.profile_populated || false;
        profileData = parseResult.profile_data || null;
        profileCompleteness = parseResult.profile_completeness || 0;
        
        // Extract key insights from parsed data
        const insights = this.extractResumeInsights(parsedData);
        console.log('🎯 Resume insights:', insights);
        
        if (profilePopulated) {
          console.log('🎉 Profile automatically populated from resume!');
          console.log('📈 Profile completeness:', profileCompleteness + '%');
        }
        
      } catch (aiError) {
        console.error('❌ AI parsing failed:', aiError);
        parseError = aiError.message;
        parseMethod = 'failed';
      }

      // Create comprehensive resume document for separate collection
      const resumeDocId = `resume_${timestamp}`;
      const resumeData = {
        id: resumeDocId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadedAt: new Date(),
        uploadedBy: currentUserId,
        isActive: true,
        
        // Parsing information
        parsedData: parsedData || null,
        parseError: parseError || null,
        parseStatus: parsedData ? 'success' : (parseError ? 'failed' : 'pending'),
        parseMethod: parseMethod,
        
        // Profile population information
        profilePopulated: profilePopulated,
        profileData: profileData,
        profileCompleteness: profileCompleteness,
        
        // Extracted insights for quick access
        insights: parsedData ? this.extractResumeInsights(parsedData) : null,
        
        // Metadata
        visibility: 'team',
        uploadMethod: 'comprehensive-ai-collection-with-profile',
        version: '2.1',
        metadata: {
          timestamp,
          originalName: file.name,
          comprehensiveParser: true,
          profileIntegration: true,
          geminiAiUsed: parseMethod === 'comprehensive_ai',
          autoPopulatedProfile: profilePopulated
        }
      };

      // Store resume document in separate 'resumes' collection
      console.log('💾 Saving resume to Firestore collection:', {
        collection: 'resumes',
        documentId: resumeDocId,
        userId: currentUserId,
        dataSize: JSON.stringify(resumeData).length
      });
      
      try {
        await setDoc(doc(db, 'resumes', resumeDocId), resumeData);
        console.log('✅ Resume document saved to collection');
      } catch (firestoreError) {
        console.error('❌ Firestore setDoc error:', firestoreError);
        throw new Error(`Firestore permission denied: ${firestoreError.message}`);
      }

      // Update user document with just a reference to the resume
      const userDocRef = doc(db, 'users', currentUserId);
      console.log('📝 Updating user document with resume reference...');
      
      try {
        await updateDoc(userDocRef, {
          activeResumeId: resumeDocId,
          lastResumeUpdate: new Date()
        });
        console.log('✅ User document updated with resume reference');
      } catch (userUpdateError) {
        console.error('❌ User document update error:', userUpdateError);
        // Don't throw here as the resume is already saved
      }

      // Clear cache
      cacheService.delete(`profile-${currentUserId}`);
      cacheService.delete(`resumes-${currentUserId}`);

      console.log('✅ Resume uploaded successfully to separate collection');

      return {
        success: true,
        resumeData,
        downloadURL: null, // No download URL for resume collection method
        parsedData,
        parseError
      };

    } catch (error) {
      console.error('Resume upload error:', error);
      throw new Error(`Resume upload failed: ${error.message}`);
    }
  }

  /**
   * Parse resume using Gemini AI (client-side, no backend required)
   */
  async parseResumeWithAI(file, userId, populateProfile = true) {
    console.log('📄 Parsing resume with Gemini AI...');
    
    const { geminiService } = await import('./geminiService');
    
    let textContent = '';
    
    if (file.type === 'text/plain') {
      textContent = await file.text();
    } else if (file.type === 'application/pdf') {
      textContent = await this.extractTextFromPdf(file);
    } else if (file.type.includes('word') || file.type.includes('document')) {
      textContent = await this.extractTextFromDoc(file);
    } else {
      textContent = await file.text();
    }

    if (!textContent || textContent.length < 50) {
      throw new Error('Could not extract text from resume. Please try a .txt or .pdf file.');
    }

    console.log('📝 Extracted text length:', textContent.length);

    const parseResult = await geminiService.parseResume(textContent, file.type);
    
    if (!parseResult.success) {
      throw new Error(parseResult.error || 'Resume parsing failed');
    }

    console.log('✅ Resume parsed successfully');
    console.log('📊 Parsed data preview:', {
      name: parseResult.data?.personalInfo?.name,
      skills_count: parseResult.data?.skills?.length || 0,
      experience_count: parseResult.data?.experience?.length || 0,
      confidence: parseResult.confidence
    });

    const normalizedData = {
      full_name: parseResult.data.personalInfo?.name,
      professional_title: parseResult.data.experience?.[0]?.title || '',
      contact_info: {
        email: parseResult.data.personalInfo?.email,
        phone: parseResult.data.personalInfo?.phone,
        linkedin: parseResult.data.personalInfo?.linkedin,
        github: parseResult.data.personalInfo?.github,
        website: parseResult.data.personalInfo?.portfolio
      },
      technical_skills: parseResult.data.skills || [],
      soft_skills: parseResult.data.skills?.filter(s => s.category === 'soft') || [],
      experience: parseResult.data.experience || [],
      education: parseResult.data.education || [],
      projects: parseResult.data.projects || [],
      certifications: parseResult.data.certifications || [],
      languages: parseResult.data.languages || [],
      years_experience: parseResult.data.totalYearsExperience,
      career_level: parseResult.data.careerLevel,
      industries: parseResult.data.industries || []
    };

    return {
      success: true,
      data: normalizedData,
      method: 'gemini_client',
      profile_populated: false,
      profile_completeness: parseResult.confidence || 0
    };
  }

  async extractTextFromPdf(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const text = await this.pdfToText(arrayBuffer);
      return text;
    } catch (error) {
      console.warn('PDF extraction failed, trying raw text:', error);
      return await file.text();
    }
  }

  async pdfToText(arrayBuffer) {
    const bytes = new Uint8Array(arrayBuffer);
    let text = '';
    let inText = false;
    let textBuffer = '';

    for (let i = 0; i < bytes.length; i++) {
      const char = String.fromCharCode(bytes[i]);
      
      if (char === '(' && !inText) {
        inText = true;
        textBuffer = '';
      } else if (char === ')' && inText) {
        inText = false;
        text += textBuffer + ' ';
      } else if (inText) {
        if (bytes[i] >= 32 && bytes[i] <= 126) {
          textBuffer += char;
        }
      }
    }

    if (text.length < 100) {
      let rawText = '';
      for (let i = 0; i < bytes.length; i++) {
        if (bytes[i] >= 32 && bytes[i] <= 126) {
          rawText += String.fromCharCode(bytes[i]);
        } else if (bytes[i] === 10 || bytes[i] === 13) {
          rawText += '\n';
        }
      }
      text = rawText;
    }

    return text.replace(/\s+/g, ' ').trim();
  }

  async extractTextFromDoc(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let text = '';
      
      for (let i = 0; i < bytes.length; i++) {
        if (bytes[i] >= 32 && bytes[i] <= 126) {
          text += String.fromCharCode(bytes[i]);
        } else if (bytes[i] === 10 || bytes[i] === 13) {
          text += '\n';
        }
      }
      
      return text.replace(/\s+/g, ' ').trim();
    } catch (error) {
      console.warn('DOC extraction failed:', error);
      return await file.text();
    }
  }


  /**
   * Extract key insights from comprehensive parsed resume data
   */
  extractResumeInsights(parsedData) {
    if (!parsedData) return null;

    const insights = {
      // Basic information
      fullName: parsedData.full_name || 'Unknown',
      professionalTitle: parsedData.professional_title || 'Not specified',
      
      // Experience summary
      totalExperience: parsedData.years_experience || 0,
      careerLevel: parsedData.career_level || 'Unknown',
      currentRole: parsedData.experience?.[0]?.title || 'Not specified',
      
      // Skills analysis
      technicalSkillsCount: parsedData.technical_skills?.length || 0,
      topSkills: parsedData.technical_skills?.slice(0, 5)?.map(skill => skill.name) || [],
      skillCategories: [...new Set(parsedData.technical_skills?.map(skill => skill.category).filter(Boolean))] || [],
      
      // Education
      highestEducation: parsedData.education?.[0]?.degree || 'Not specified',
      educationCount: parsedData.education?.length || 0,
      
      // Additional achievements
      projectCount: parsedData.projects?.length || 0,
      certificationCount: parsedData.certifications?.length || 0,
      awardCount: parsedData.awards?.length || 0,
      
      // Industries and languages
      industries: parsedData.industries || [],
      languages: parsedData.languages || [],
      
      // Contact availability
      hasLinkedIn: !!parsedData.contact_info?.linkedin,
      hasGitHub: !!parsedData.contact_info?.github,
      hasPortfolio: !!parsedData.contact_info?.website,
      
      // Completeness score (0-100)
      completenessScore: this.calculateCompletenessScore(parsedData)
    };

    return insights;
  }

  /**
   * Calculate resume completeness score based on available information
   */
  calculateCompletenessScore(data) {
    let score = 0;
    const maxScore = 100;
    
    // Basic info (30 points)
    if (data.full_name) score += 10;
    if (data.professional_title) score += 10;
    if (data.contact_info?.email) score += 10;
    
    // Experience (25 points)
    if (data.experience?.length > 0) score += 15;
    if (data.years_experience > 0) score += 10;
    
    // Skills (20 points)
    if (data.technical_skills?.length > 0) score += 15;
    if (data.soft_skills?.length > 0) score += 5;
    
    // Education (15 points)
    if (data.education?.length > 0) score += 15;
    
    // Additional info (10 points)
    if (data.projects?.length > 0) score += 3;
    if (data.certifications?.length > 0) score += 3;
    if (data.contact_info?.linkedin) score += 2;
    if (data.contact_info?.github) score += 2;
    
    return Math.min(score, maxScore);
  }

  /**
   * Populate user profile automatically from parsed resume data
   */
  async populateProfileFromResume(resumeData, userId, existingProfile = null) {
    try {
      console.log('🤖 Calling AI matchmaker service for profile population...');
      
      const response = await fetch('http://localhost:5001/api/profile/populate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeData: resumeData,
          userId: userId,
          existingProfile: existingProfile
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Profile population failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Profile population failed');
      }

      console.log('✅ Profile populated successfully!');
      console.log('📊 Population results:', {
        completeness: result.completeness,
        fieldsPopulated: result.fieldsPopulated
      });

      return {
        success: true,
        profile: result.profile,
        completeness: result.completeness,
        fieldsPopulated: result.fieldsPopulated
      };
      
    } catch (error) {
      console.error('❌ Profile population error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check profile completeness score
   */
  async checkProfileCompleteness(profile) {
    try {
      const response = await fetch('http://localhost:5001/api/profile/completeness', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profile })
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          completeness: result.completeness,
          complete: result.complete
        };
      }
      
      return { success: false, completeness: 0 };
      
    } catch (error) {
      console.error('Profile completeness check error:', error);
      return { success: false, completeness: 0 };
    }
  }

  /**
   * Sync Google account profile picture
   */
  async syncGoogleProfilePicture(userId = null) {
    try {
      const currentUserId = userId || this.getCurrentUserId();
      const user = auth.currentUser;

      if (!user || !user.photoURL) {
        throw new Error('No Google profile picture available');
      }

      console.log('Syncing Google profile picture from:', user.photoURL);

      // For CORS workaround, directly use Google's photo URL
      // This avoids the download and re-upload process that causes CORS issues
      const profilePictureData = {
        fileName: 'google-profile.jpg',
        fileSize: 0, // Unknown size for external URL
        fileType: 'image/jpeg',
        uploadedAt: new Date(),
        uploadMethod: 'google-url',
        syncedFromGoogle: true,
        lastGoogleSync: new Date(),
        googlePhotoURL: user.photoURL,
        originalName: 'google-profile.jpg'
      };

      // Update user profile in Firestore with Google photo URL directly
      await this.updateUserProfilePicture(currentUserId, user.photoURL, profilePictureData);

      console.log('Google profile picture synced successfully using direct URL');

      // Clear cache
      cacheService.delete(`profile-${currentUserId}`);

      return {
        success: true,
        url: user.photoURL,
        path: null,
        metadata: {
          size: 0,
          type: 'image/jpeg',
          uploadedAt: new Date(),
          method: 'google-url'
        }
      };

    } catch (error) {
      console.error('Google profile sync error:', error);
      throw new Error(`Google sync failed: ${error.message}`);
    }
  }

  /**
   * Get user's profile picture URL - alias for getProfilePictureURL for backward compatibility
   */
  async getProfilePicture(userId) {
    return await this.getProfilePictureURL(userId);
  }

  /**
   * Get user's profile picture URL
   */
  async getProfilePictureURL(userId) {
    try {
      const cacheKey = `profile-pic-${userId}`;
      const cached = cacheService.get(cacheKey);
      
      if (cached) return cached;

      // Try to get from user document first (most reliable and CORS-free)
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists() && userDoc.data().profilePicture?.url) {
        const url = userDoc.data().profilePicture.url;
        cacheService.set(cacheKey, url, 300); // Cache for 5 minutes
        return url;
      }

      // If no profile picture found in Firestore, return null
      // Avoid Firebase Storage operations that cause CORS issues
      return null;

    } catch (error) {
      console.warn('Get profile picture error:', error);
      return null;
    }
  }

  /**
   * Get user's active resume (most recent one)
   */
  async getUserResume(userId) {
    try {
      // First check if user has an active resume ID
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists() && userDoc.data().activeResumeId) {
        const resumeId = userDoc.data().activeResumeId;
        const resumeDoc = await getDoc(doc(db, 'resumes', resumeId));
        if (resumeDoc.exists()) {
          return resumeDoc.data();
        }
      }

      // Fallback: get all resumes for this user (legacy support)
      const resumes = await this.getUserResumes(userId);
      return resumes.length > 0 ? resumes[0] : null;
    } catch (error) {
      console.error('Get user resume error:', error);
      return null;
    }
  }

  /**
   * Get user's resumes
   */
  async getUserResumes(userId, includeInactive = false) {
    try {
      const cacheKey = `resumes-${userId}`;
      const cached = cacheService.get(cacheKey);
      
      if (cached) return cached;

      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) return [];

      const userData = userDoc.data();
      let resumes = userData.resumes || [];

      if (!includeInactive) {
        resumes = resumes.filter(resume => resume.isActive);
      }

      // Sort by upload date (newest first)
      resumes.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

      cacheService.set(cacheKey, resumes, 600); // Cache for 10 minutes
      return resumes;

    } catch (error) {
      console.error('Get user resumes error:', error);
      return [];
    }
  }

  /**
   * Get team member resumes (for viewing by other team members)
   */
  async getTeamMemberResumes(targetUserId) {
    try {
      const currentUserId = this.getCurrentUserId();
      
      // Verify team membership
      const isTeamMember = await this.verifyTeamMembership(currentUserId, targetUserId);
      if (!isTeamMember) {
        throw new Error('Access denied: Not a team member');
      }

      const resumes = await this.getUserResumes(targetUserId);
      
      // Filter only team-visible resumes
      return resumes.filter(resume => 
        resume.visibility === 'team' && resume.isActive
      );

    } catch (error) {
      console.error('Get team member resumes error:', error);
      throw new Error(`Access denied: ${error.message}`);
    }
  }

  /**
   * Delete profile picture
   */
  async deleteProfilePicture(userId = null) {
    try {
      const currentUserId = userId || this.getCurrentUserId();
      
      await this.deleteExistingProfilePicture(currentUserId);

      // Update Firestore
      await updateDoc(doc(db, 'users', currentUserId), {
        profilePicture: null
      });

      // Clear cache
      cacheService.delete(`profile-pic-${currentUserId}`);
      cacheService.delete(`profile-${currentUserId}`);

      return { success: true };

    } catch (error) {
      console.error('Delete profile picture error:', error);
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  /**
   * Delete resume
   */
  async deleteResume(resumeId, userId = null) {
    try {
      const currentUserId = userId || this.getCurrentUserId();
      
      const userDoc = await getDoc(doc(db, 'users', currentUserId));
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      const resumes = userData.resumes || [];
      const resumeIndex = resumes.findIndex(r => r.id === resumeId);

      if (resumeIndex === -1) {
        throw new Error('Resume not found');
      }

      const resume = resumes[resumeIndex];

      // Delete from Firebase Storage
      if (resume.storagePath) {
        const storageRef = ref(storage, resume.storagePath);
        await deleteObject(storageRef);
      }

      // Mark as inactive instead of removing completely
      resumes[resumeIndex].isActive = false;
      resumes[resumeIndex].deletedAt = new Date();

      // Update Firestore
      await updateDoc(doc(db, 'users', currentUserId), {
        resumes: resumes
      });

      // Clear cache
      cacheService.delete(`resumes-${currentUserId}`);
      cacheService.delete(`profile-${currentUserId}`);

      return { success: true };

    } catch (error) {
      console.error('Delete resume error:', error);
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  /**
   * Helper: Delete existing profile picture
   */
  async deleteExistingProfilePicture(userId) {
    const extensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    
    for (const ext of extensions) {
      try {
        const path = this.getProfilePicturePath(userId, ext);
        const storageRef = ref(storage, path);
        
        // Check if file exists before trying to delete
        try {
          await getMetadata(storageRef);
          // File exists, now try to delete it
          await deleteObject(storageRef);
          console.log(`Deleted existing profile picture: ${path}`);
        } catch (metadataError) {
          // File doesn't exist, skip
          if (metadataError.code === 'storage/object-not-found') {
            continue;
          }
          throw metadataError;
        }
      } catch (error) {
        // Log warning but don't throw - continue with other extensions
        console.warn(`Could not delete profile picture ${ext}:`, error.message);
        continue;
      }
    }
  }

  /**
   * Helper: Update user profile picture in Firestore
   */
  async updateUserProfilePicture(userId, url, metadata = {}) {
    try {
      console.log('🔧 DEBUG: updateUserProfilePicture called with userId:', userId);
      const userDocRef = doc(db, 'users', userId);
      
      // Get current user info from Firebase Auth for initial profile creation
      const user = auth.currentUser;
      const now = new Date();
      
      // Create basic profile data if document doesn't exist
      const profileData = {
        profilePicture: {
          url,
          ...metadata,
          updatedAt: now
        },
        lastUpdated: now
      };
      
      // If this is likely a new user, add basic info (but only if not already set)
      if (user && user.uid === userId) {
        // Only add basic profile info if it's not already in metadata
        if (!profileData.uid) profileData.uid = userId;
        if (!profileData.firebaseUID) profileData.firebaseUID = userId; // Required by Firestore rules
        if (!profileData.email && user.email) profileData.email = user.email;
        if (!profileData.displayName) {
          profileData.displayName = user.displayName || metadata.originalName || user.email?.split('@')[0] || 'User';
        }
        if (!profileData.createdAt) profileData.createdAt = now;
        if (!profileData.authProvider) {
          profileData.authProvider = user.providerData?.[0]?.providerId || 'unknown';
        }
      }
      
      console.log('🔧 DEBUG: Using setDoc with merge for profile data');
      
      // Use setDoc with merge to create document if it doesn't exist
      await setDoc(userDocRef, profileData, { merge: true });
      console.log('✅ SUCCESS: Profile picture updated in Firestore for user:', userId);
    } catch (error) {
      console.warn('⚠️ WARNING: Failed to update profile picture in Firestore:', error.message);
      // Don't throw error to avoid blocking other operations
    }
  }

  /**
   * Helper: Update user resume list in Firestore
   */
  async updateUserResumeList(userId, resumeData) {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const resumes = userData.resumes || [];
      
      // Deactivate previous resumes if needed
      resumes.forEach(resume => {
        if (resume.isActive) {
          resume.isActive = false;
          resume.replacedAt = new Date();
        }
      });
      
      resumes.push(resumeData);
      
      await updateDoc(userDocRef, {
        resumes,
        'profile.lastResumeUpdate': new Date()
      });
    } else {
      // Create new user document
      await setDoc(userDocRef, {
        resumes: [resumeData],
        profile: {
          lastResumeUpdate: new Date()
        }
      });
    }
  }

  /**
   * Helper: Verify team membership
   */
  async verifyTeamMembership(currentUserId, targetUserId) {
    try {
      // For now, allow all authenticated users to view team resumes
      // In production, implement proper team/organization logic
      return true;

      // Example team verification logic:
      // const currentUserDoc = await getDoc(doc(db, 'users', currentUserId));
      // const targetUserDoc = await getDoc(doc(db, 'users', targetUserId));
      
      // if (!currentUserDoc.exists() || !targetUserDoc.exists()) {
      //   return false;
      // }

      // const currentUserTeam = currentUserDoc.data().teamId;
      // const targetUserTeam = targetUserDoc.data().teamId;

      // return currentUserTeam && currentUserTeam === targetUserTeam;

    } catch (error) {
      console.error('Team membership verification error:', error);
      return false;
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageUsage(userId = null) {
    try {
      const currentUserId = userId || this.getCurrentUserId();
      
      const profilePicRef = ref(storage, `${this.PROFILE_PICTURES_PATH}/${currentUserId}`);
      const resumesRef = ref(storage, `${this.RESUMES_PATH}/${currentUserId}`);

      let totalSize = 0;
      let fileCount = 0;

      // Get profile pictures size
      try {
        const profilePicList = await listAll(profilePicRef);
        for (const item of profilePicList.items) {
          const metadata = await getMetadata(item);
          totalSize += metadata.size || 0;
          fileCount++;
        }
      } catch (error) {
        // No profile pictures
      }

      // Get resumes size
      try {
        const resumesList = await listAll(resumesRef);
        for (const item of resumesList.items) {
          const metadata = await getMetadata(item);
          totalSize += metadata.size || 0;
          fileCount++;
        }
      } catch (error) {
        // No resumes
      }

      return {
        totalSize,
        fileCount,
        formattedSize: this.formatFileSize(totalSize)
      };

    } catch (error) {
      console.error('Get storage usage error:', error);
      return {
        totalSize: 0,
        fileCount: 0,
        formattedSize: '0 B'
      };
    }
  }

  /**
   * Helper: Format file size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Helper: Cleanup old profile pictures (non-blocking)
   */
  async cleanupOldProfilePictures(userId) {
    try {
      const userFolderRef = ref(storage, `${this.PROFILE_PICTURES_PATH}/${userId}`);
      const listResult = await listAll(userFolderRef);
      
      // Keep only the latest 2 files, delete the rest
      if (listResult.items.length > 2) {
        const sortedItems = listResult.items.sort((a, b) => {
          // Sort by creation time (newer first)
          const aTime = a.name.match(/profile_(\d+)/)?.[1] || '0';
          const bTime = b.name.match(/profile_(\d+)/)?.[1] || '0';
          return parseInt(bTime) - parseInt(aTime);
        });
        
        // Delete old files (keep first 2)
        for (let i = 2; i < sortedItems.length; i++) {
          try {
            await deleteObject(sortedItems[i]);
            console.log('Cleaned up old profile picture:', sortedItems[i].name);
          } catch (error) {
            console.warn('Could not delete old profile picture:', error.message);
          }
        }
      }
    } catch (error) {
      console.warn('Profile picture cleanup error:', error.message);
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();
export default storageService;
