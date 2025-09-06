import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Upload, FileText, Download, X, AlertCircle, CheckCircle, Clock, Eye, User, Calendar, HardDrive } from 'lucide-react';
import storageService from '../services/storageService';
import { useAuth } from '../contexts/AuthContext';

const ResumeSection = ({ 
  userId, 
  onResumeUpdate,
  className = ''
}) => {
  const { user, userProfile, updateUserProfile } = useAuth();
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resumes, setResumes] = useState([]);
  const [activeResume, setActiveResume] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingStatus, setProcessingStatus] = useState('');

  // Load user's resumes on component mount
  useEffect(() => {
    loadResumes();
  }, [userId, userProfile]);

  const loadResumes = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const targetUserId = userId || user?.uid;
      if (!targetUserId) return;

      // Try to get resume from user profile first
      if (userProfile?.resume) {
        setActiveResume({
          name: userProfile.resume.fileName || 'Resume',
          url: userProfile.resume.downloadURL,
          uploadDate: userProfile.resume.uploadDate,
          size: userProfile.resume.size || 'Unknown',
          type: userProfile.resume.type || 'PDF',
          processingStatus: userProfile.resume.processingStatus || 'completed',
          extractedData: userProfile.resume.extractedData,
          isActive: true
        });
        setResumes([{
          ...userProfile.resume,
          name: userProfile.resume.fileName || 'Resume',
          isActive: true
        }]);
      } else {
        // Fallback to storage service
        try {
          const resumeData = await storageService.getUserResume(targetUserId);
          if (resumeData) {
            setActiveResume({
              name: resumeData.originalName || 'Resume',
              url: resumeData.downloadURL,
              uploadDate: resumeData.uploadDate,
              size: resumeData.size || 'Unknown',
              type: resumeData.type || 'PDF',
              processingStatus: resumeData.processingStatus || 'completed',
              extractedData: resumeData.extractedData,
              isActive: true
            });
            setResumes([resumeData]);
          }
        } catch (storageError) {
          console.log('No resume found in storage');
        }
      }
    } catch (error) {
      console.error('Error loading resumes:', error);
      setError('Failed to load resumes');
    } finally {
      setLoading(false);
    }
  }, [userId, user, userProfile]);

  const handleFileSelect = useCallback(async (files) => {
    const file = files[0];
    if (!file) return;

    setError('');
    setUploading(true);
    setProgress(10);
    setProcessingStatus('Uploading...');

    try {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];

      if (!allowedTypes.includes(file.type)) {
        throw new Error('Please upload a PDF, DOC, DOCX, or TXT file');
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB');
      }

      setProgress(20);
      setProcessingStatus('Uploading to Firebase...');

      const targetUserId = userId || user?.uid;
      if (!targetUserId) {
        throw new Error('User not authenticated');
      }

      // Upload resume with AI parsing
      const result = await storageService.uploadResume(file, targetUserId, (progressPercent) => {
        setProgress(20 + (progressPercent * 0.8)); // 20% to 100%
        if (progressPercent < 50) {
          setProcessingStatus('Uploading to Firebase...');
        } else if (progressPercent < 90) {
          setProcessingStatus('Processing with AI...');
        } else {
          setProcessingStatus('Finalizing...');
        }
      });

      if (result) {
        const newResume = {
          name: result.originalName || file.name,
          url: result.downloadURL,
          uploadDate: result.uploadDate || new Date().toISOString(),
          size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
          type: file.type.includes('pdf') ? 'PDF' : file.type.includes('doc') ? 'DOC' : 'TXT',
          processingStatus: result.processingStatus || 'completed',
          extractedData: result.extractedData,
          isActive: true
        };

        setActiveResume(newResume);
        setResumes([newResume]);

        // Update user profile with resume data
        if (updateUserProfile) {
          await updateUserProfile({
            resume: {
              fileName: result.originalName || file.name,
              downloadURL: result.downloadURL,
              uploadDate: result.uploadDate || new Date().toISOString(),
              size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
              type: file.type,
              processingStatus: result.processingStatus || 'completed',
              extractedData: result.extractedData || null
            }
          });
        }

        if (onResumeUpdate) {
          onResumeUpdate(newResume);
        }

        setProcessingStatus('Upload completed successfully!');
        setTimeout(() => setProcessingStatus(''), 3000);
      }
    } catch (err) {
      console.error('Resume upload error:', err);
      setError(err.message || 'Failed to upload resume. Please try again.');
      setProcessingStatus('');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [userId, user, updateUserProfile, onResumeUpdate]);

  const handleDeleteResume = useCallback(async (resumeId) => {
    if (!confirm('Are you sure you want to delete this resume? This action cannot be undone.')) {
      return;
    }

    try {
      await storageService.deleteResume(resumeId);
      await loadResumes();
      
      // If the deleted resume was active, notify parent
      if (activeResume?.id === resumeId) {
        onResumeUpdate?.(null);
      }
    } catch (error) {
      console.error('Delete resume error:', error);
      setError('Failed to delete resume');
    }
  }, [loadResumes, activeResume, onResumeUpdate]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName) => {
    if (fileName?.toLowerCase().includes('.pdf')) return '📄';
    if (fileName?.toLowerCase().includes('.doc')) return '📝';
    return '📄';
  };

  const getParseStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'text-green-400';
      case 'failed':
        return 'text-red-400';
      case 'pending':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const getParseStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={16} className="text-green-400" />;
      case 'failed':
        return <AlertCircle size={16} className="text-red-400" />;
      case 'pending':
        return <Clock size={16} className="text-yellow-400" />;
      default:
        return <Clock size={16} className="text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-slate-600 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-slate-600/30 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Resume Management</h2>
        <p className="text-slate-400">
          Upload your resume for automatic AI-powered parsing and skill extraction. Supported formats: PDF, DOC, DOCX, TXT (max 10MB).
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-red-400" size={20} />
          <div>
            <p className="text-red-300 font-medium">Error</p>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
          <button
            onClick={() => setError('')}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Upload Section */}
      {!activeResume && (
        <div className="space-y-6">
          {/* Drop Zone */}
          <div
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer ${
              dragActive 
                ? 'border-cyan-500 bg-cyan-500/10' 
                : 'border-slate-600 hover:border-cyan-500/50 bg-slate-700/30'
            } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
            onClick={() => !uploading && fileInputRef.current?.click()}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.txt"
              onChange={(e) => handleFileSelect(e.target.files)}
              disabled={uploading}
            />

            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-cyan-500/20 rounded-2xl flex items-center justify-center border border-cyan-500/30">
                <Upload className="text-cyan-400" size={32} />
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {dragActive ? 'Drop your resume here' : 'Upload your resume'}
                </h3>
                <p className="text-slate-400 mb-4">
                  {dragActive ? 'Release to upload' : 'Drag and drop or click to browse'}
                </p>
                <p className="text-sm text-slate-500">
                  PDF, DOC, DOCX, TXT • Max 10MB
                </p>
              </div>
            </div>

            {uploading && (
              <div className="absolute inset-0 bg-slate-800/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-white font-medium mb-2">
                    {progress < 30 ? 'Uploading...' : progress < 80 ? 'Processing with AI...' : 'Finalizing...'}
                  </p>
                  <div className="w-48 bg-slate-700 rounded-full h-2 mx-auto mb-2">
                    <div 
                      className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-slate-400">{progress}%</p>
                </div>
              </div>
            )}
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-700/30 rounded-lg p-4 text-center">
              <CheckCircle className="text-green-400 mx-auto mb-2" size={20} />
              <h4 className="font-medium text-white mb-1">AI-Powered Parsing</h4>
              <p className="text-sm text-slate-400">Gemini AI extracts skills and experience</p>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-4 text-center">
              <Clock className="text-blue-400 mx-auto mb-2" size={20} />
              <h4 className="font-medium text-white mb-1">Fast Processing</h4>
              <p className="text-sm text-slate-400">Advanced parsing in seconds</p>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-4 text-center">
              <User className="text-purple-400 mx-auto mb-2" size={20} />
              <h4 className="font-medium text-white mb-1">Team Access</h4>
              <p className="text-sm text-slate-400">Team members can view your resume</p>
            </div>
          </div>
        </div>
      )}

      {/* Resume Display */}
      {activeResume && (
        <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Current Resume</h3>
            <div className="flex items-center gap-2">
              {activeResume.downloadURL && (
                <button
                  onClick={() => window.open(activeResume.downloadURL, '_blank')}
                  className="px-4 py-2 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center gap-2"
                >
                  <Download size={16} />
                  Download
                </button>
              )}
              <button
                onClick={() => window.open(activeResume.downloadURL, '_blank')}
                className="px-4 py-2 bg-green-500/20 text-green-300 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors flex items-center gap-2"
              >
                <Eye size={16} />
                View
              </button>
              <button
                onClick={() => handleDeleteResume(activeResume.id)}
                className="px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors flex items-center gap-2"
              >
                <X size={16} />
                Remove
              </button>
            </div>
          </div>

          {/* File Info */}
          <div className="flex items-center gap-4 p-4 bg-slate-600/30 rounded-lg mb-6">
            <div className="text-2xl">{getFileIcon(activeResume.fileName)}</div>
            <div className="flex-1">
              <h4 className="font-medium text-white">{activeResume.fileName}</h4>
              <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date(activeResume.uploadedAt.seconds * 1000).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <HardDrive size={12} />
                  {formatFileSize(activeResume.fileSize)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getParseStatusIcon(activeResume.parseStatus)}
              <span className={`text-sm font-medium ${getParseStatusColor(activeResume.parseStatus)}`}>
                {activeResume.parseStatus === 'success' ? 'Parsed' : 
                 activeResume.parseStatus === 'failed' ? 'Parse Failed' : 'Processing'}
              </span>
            </div>
          </div>

          {/* Parse Error */}
          {activeResume.parseError && (
            <div className="mb-6 bg-red-500/20 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="text-red-400" size={16} />
                <h5 className="text-red-300 font-medium">Parsing Error</h5>
              </div>
              <p className="text-red-400 text-sm">{activeResume.parseError}</p>
              <p className="text-red-500/80 text-xs mt-2">
                You can still download and view your resume, but automatic skill extraction failed.
              </p>
            </div>
          )}

          {/* Parsed Data */}
          {activeResume.parsedData && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                <CheckCircle className="text-green-400" size={20} />
                AI-Extracted Information
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Experience Level */}
                <div className="bg-slate-600/30 rounded-lg p-4">
                  <h5 className="font-medium text-white mb-2">Experience Level</h5>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    activeResume.parsedData.experience_level === 'Expert' 
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : activeResume.parsedData.experience_level === 'Advanced' 
                      ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                      : activeResume.parsedData.experience_level === 'Intermediate'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-green-500/20 text-green-300 border border-green-500/30'
                  }`}>
                    {activeResume.parsedData.experience_level || 'Beginner'}
                  </span>
                </div>

                {/* Domains */}
                <div className="bg-slate-600/30 rounded-lg p-4">
                  <h5 className="font-medium text-white mb-2">Domains</h5>
                  <div className="flex flex-wrap gap-2">
                    {(activeResume.parsedData.domains || []).map((domain, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-sm">
                        {domain}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Skills */}
                <div className="bg-slate-600/30 rounded-lg p-4 md:col-span-2">
                  <h5 className="font-medium text-white mb-2 flex items-center justify-between">
                    Skills
                    <span className="text-slate-400 text-sm">({activeResume.parsedData.skills?.length || 0} found)</span>
                  </h5>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {(activeResume.parsedData.skills || []).map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Companies */}
                {activeResume.parsedData.companies && activeResume.parsedData.companies.length > 0 && (
                  <div className="bg-slate-600/30 rounded-lg p-4 md:col-span-2">
                    <h5 className="font-medium text-white mb-2">Previous Companies</h5>
                    <div className="flex flex-wrap gap-2">
                      {activeResume.parsedData.companies.map((company, index) => (
                        <span key={index} className="px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded text-sm">
                          {company}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Replace Resume */}
          <div className="mt-6 pt-6 border-t border-slate-600/50">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full py-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-300 rounded-lg hover:from-cyan-500/30 hover:to-blue-500/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Upload size={16} />
              Replace Resume
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.txt"
              onChange={(e) => handleFileSelect(e.target.files)}
              disabled={uploading}
            />
          </div>
        </div>
      )}

      {/* Resume History */}
      {resumes.length > 1 && (
        <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/50">
          <h3 className="text-lg font-semibold text-white mb-4">Resume History</h3>
          <div className="space-y-3">
            {resumes.slice(0, 5).map((resume) => (
              <div key={resume.id} className={`flex items-center justify-between p-3 rounded-lg ${
                resume.isActive ? 'bg-green-500/20 border border-green-500/30' : 'bg-slate-600/30'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="text-lg">{getFileIcon(resume.fileName)}</div>
                  <div>
                    <p className="text-white font-medium text-sm">{resume.fileName}</p>
                    <p className="text-slate-400 text-xs">
                      {new Date(resume.uploadedAt.seconds * 1000).toLocaleDateString()} • {formatFileSize(resume.fileSize)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getParseStatusIcon(resume.parseStatus)}
                  {resume.isActive && (
                    <span className="px-2 py-1 bg-green-500/30 text-green-300 text-xs rounded">Active</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeSection;
