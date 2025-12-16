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

  sanitizeForFirestore(obj) {
    if (obj === null || obj === undefined) return null;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeForFirestore(item)).filter(item => item !== undefined);
    }
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        sanitized[key] = this.sanitizeForFirestore(value);
      }
    }
    return sanitized;
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
    
    try {
      const currentUserId = userId || this.getCurrentUserId();
      const user = auth.currentUser;
      
      
      
      
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

      
      // Convert file to Data URL as fallback for CORS issues
      const dataURL = await this.fileToDataURL(file);
      
      
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

      
      // Update user profile in Firestore with data URL
      await this.updateUserProfilePicture(currentUserId, dataURL, profilePictureData);

      

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
        
        const parseResult = await this.parseResumeWithAI(file, currentUserId, true);
        
        parsedData = parseResult.data;
        parseMethod = parseResult.method || 'comprehensive_ai';
        profilePopulated = parseResult.profile_populated || false;
        profileData = parseResult.profile_data || null;
        profileCompleteness = parseResult.profile_completeness || 0;
        
        // Extract key insights from parsed data
        const insights = this.extractResumeInsights(parsedData);
        
        
        if (profilePopulated) {
          
          
        }
        
      } catch (aiError) {
        
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

      // Sanitize data before saving to Firestore (removes undefined values)
      const sanitizedResumeData = this.sanitizeForFirestore(resumeData);
      
      try {
        await setDoc(doc(db, 'resumes', resumeDocId), sanitizedResumeData);
        
      } catch (firestoreError) {
        
        throw new Error(`Firestore permission denied: ${firestoreError.message}`);
      }

      // Update user document with just a reference to the resume
      const userDocRef = doc(db, 'users', currentUserId);
      
      
      try {
        await updateDoc(userDocRef, {
          activeResumeId: resumeDocId,
          lastResumeUpdate: new Date()
        });
        
      } catch (userUpdateError) {
        
        // Don't throw here as the resume is already saved
      }

      // Clear cache
      cacheService.delete(`profile-${currentUserId}`);
      cacheService.delete(`resumes-${currentUserId}`);

      

      return {
        success: true,
        resumeData,
        downloadURL: null, // No download URL for resume collection method
        parsedData,
        parseError
      };

    } catch (error) {
      
      throw new Error(`Resume upload failed: ${error.message}`);
    }
  }

  async parseResumeWithAI(file, userId, populateProfile = true) {
    const { geminiService } = await import('./geminiService');
    const { resumeParserService } = await import('./resumeParserService');
    
    const textContent = await resumeParserService.extractText(file);

    if (!textContent || textContent.length < 30) {
      throw new Error(
        'Could not extract text from this resume format. Please try uploading a .txt file.'
      );
    }

    const parseResult = await geminiService.parseResume(textContent, file.type);
    
    if (!parseResult.success) {
      throw new Error(parseResult.error || 'Resume parsing failed');
    }

    const data = parseResult.data;
    
    const normalizedData = {
      full_name: data.personalInfo?.name,
      summary: data.personalInfo?.summary,
      domain: data.domain,
      contact_info: {
        email: data.personalInfo?.email,
        phone: data.personalInfo?.phone,
        linkedin: data.personalInfo?.linkedin,
        github: data.personalInfo?.github,
        website: data.personalInfo?.portfolio,
        location: data.personalInfo?.location
      },
      skills: data.skills || [],
      technical_skills: (data.skills || []).filter(s => s.category !== 'soft'),
      soft_skills: (data.skills || []).filter(s => s.category === 'soft'),
      experience: data.experience || [],
      education: data.education || [],
      projects: data.projects || [],
      certifications: data.certifications || [],
      awards: data.awards || [],
      volunteering: data.volunteering || [],
      languages: data.languages || [],
      career_level: data.careerLevel,
      key_strengths: data.keyStrengths || []
    };

    return {
      success: true,
      data: normalizedData,
      rawParsedData: data,
      profile_completeness: parseResult.confidence || 0
    };
  }

  async extractTextFromPdf(file) {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    let extractedTexts = [];
    
    // Strategy 1: Find text streams between BT and ET markers
    const btEtText = this.extractBtEtText(bytes);
    if (btEtText.length > 50) extractedTexts.push({ method: 'bt_et', text: btEtText });
    
    // Strategy 2: Extract text from parentheses (PDF string format)
    const parenText = this.extractParenthesesText(bytes);
    if (parenText.length > 50) extractedTexts.push({ method: 'paren', text: parenText });
    
    // Strategy 3: Extract hex strings (PDF hex format)
    const hexText = this.extractHexText(bytes);
    if (hexText.length > 50) extractedTexts.push({ method: 'hex', text: hexText });
    
    // Strategy 4: Raw printable ASCII extraction
    const asciiText = this.extractAsciiText(bytes);
    if (asciiText.length > 50) extractedTexts.push({ method: 'ascii', text: asciiText });

    // Use the longest extracted text
    if (extractedTexts.length === 0) {
      
      return '';
    }

    extractedTexts.sort((a, b) => b.text.length - a.text.length);
    
    
    return this.cleanExtractedText(extractedTexts[0].text);
  }

  extractBtEtText(bytes) {
    const str = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    const btEtRegex = /BT\s*([\s\S]*?)\s*ET/g;
    let matches = [];
    let match;
    
    while ((match = btEtRegex.exec(str)) !== null) {
      const content = match[1];
      // Extract Tj and TJ operators content
      const tjRegex = /\((.*?)\)\s*Tj/g;
      let tjMatch;
      while ((tjMatch = tjRegex.exec(content)) !== null) {
        matches.push(tjMatch[1]);
      }
    }
    
    return matches.join(' ');
  }

  extractParenthesesText(bytes) {
    let text = '';
    let inParen = 0;
    let buffer = '';
    
    for (let i = 0; i < bytes.length; i++) {
      const char = String.fromCharCode(bytes[i]);
      
      if (char === '(' && (i === 0 || bytes[i-1] !== 92)) { // Not escaped
        inParen++;
        if (inParen === 1) buffer = '';
      } else if (char === ')' && (i === 0 || bytes[i-1] !== 92)) {
        inParen--;
        if (inParen === 0 && buffer.length > 0) {
          text += buffer + ' ';
        }
      } else if (inParen > 0) {
        if (bytes[i] >= 32 && bytes[i] <= 126) {
          buffer += char;
        } else if (bytes[i] === 10 || bytes[i] === 13) {
          buffer += ' ';
        }
      }
    }
    
    return text;
  }

  extractHexText(bytes) {
    const str = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    const hexRegex = /<([0-9A-Fa-f\s]+)>/g;
    let text = '';
    let match;
    
    while ((match = hexRegex.exec(str)) !== null) {
      const hexStr = match[1].replace(/\s/g, '');
      if (hexStr.length % 2 === 0) {
        let decoded = '';
        for (let i = 0; i < hexStr.length; i += 2) {
          const charCode = parseInt(hexStr.substr(i, 2), 16);
          if (charCode >= 32 && charCode <= 126) {
            decoded += String.fromCharCode(charCode);
          }
        }
        if (decoded.length > 2) text += decoded + ' ';
      }
    }
    
    return text;
  }

  extractAsciiText(bytes) {
    let text = '';
    let wordBuffer = '';
    
    for (let i = 0; i < bytes.length; i++) {
      if (bytes[i] >= 32 && bytes[i] <= 126) {
        wordBuffer += String.fromCharCode(bytes[i]);
      } else {
        if (wordBuffer.length >= 2) {
          text += wordBuffer + ' ';
        }
        wordBuffer = '';
      }
    }
    
    return text;
  }

  cleanExtractedText(text) {
    return text
      .replace(/\\[nrt]/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/[^\x20-\x7E\n]/g, ' ')
      .replace(/\s{3,}/g, ' ')
      .trim();
  }

  async extractTextFromDoc(file) {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    // For DOCX (ZIP format), try to find XML content
    const str = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    
    // Check if it's DOCX (starts with PK, ZIP format)
    if (bytes[0] === 0x50 && bytes[1] === 0x4B) {
      // Extract text from XML content inside DOCX
      const textRegex = /<w:t[^>]*>([^<]+)<\/w:t>/g;
      let matches = [];
      let match;
      while ((match = textRegex.exec(str)) !== null) {
        matches.push(match[1]);
      }
      if (matches.length > 0) {
        return this.cleanExtractedText(matches.join(' '));
      }
    }
    
    // Fallback: extract printable ASCII
    return this.extractAsciiText(bytes);
  }

  async extractTextFallback(file) {
    try {
      const text = await file.text();
      return this.cleanExtractedText(text);
    } catch {
      return '';
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
          
        } catch (metadataError) {
          // File doesn't exist, skip
          if (metadataError.code === 'storage/object-not-found') {
            continue;
          }
          throw metadataError;
        }
      } catch (error) {
        // Log warning but don't throw - continue with other extensions
        
        continue;
      }
    }
  }

  /**
   * Helper: Update user profile picture in Firestore
   */
  async updateUserProfilePicture(userId, url, metadata = {}) {
    try {
      
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
      
      
      
      // Use setDoc with merge to create document if it doesn't exist
      await setDoc(userDocRef, profileData, { merge: true });
      
    } catch (error) {
      
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
            
          } catch (error) {
            
          }
        }
      }
    } catch (error) {
      
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();
export default storageService;
