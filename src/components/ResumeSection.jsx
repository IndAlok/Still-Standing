import React, { useRef, useState } from 'react';
import { Upload, FileText, Download, X, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const ResumeSection = ({ 
  resume, 
  onUpload, 
  onRemove, 
  uploading = false, 
  progress = 0 
}) => {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (files) => {
    const file = files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('Please upload only PDF, DOC, or DOCX files.');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB.');
      return;
    }

    onUpload(file);
  };

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Resume Management</h2>
        <p className="text-slate-400">
          Upload your resume for automatic parsing and skill extraction. Supported formats: PDF, DOC, DOCX (max 10MB).
        </p>
      </div>

      {/* Upload Section */}
      {!resume && (
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
              accept=".pdf,.doc,.docx"
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
                  PDF, DOC, DOCX • Max 10MB
                </p>
              </div>
            </div>

            {uploading && (
              <div className="absolute inset-0 bg-slate-800/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-white font-medium mb-2">
                    {progress < 90 ? 'Uploading...' : 'Parsing resume...'}
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
              <h4 className="font-medium text-white mb-1">Auto-Parse Skills</h4>
              <p className="text-sm text-slate-400">Automatically extract skills and experience</p>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-4 text-center">
              <Clock className="text-blue-400 mx-auto mb-2" size={20} />
              <h4 className="font-medium text-white mb-1">Fast Processing</h4>
              <p className="text-sm text-slate-400">AI-powered parsing in seconds</p>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-4 text-center">
              <FileText className="text-purple-400 mx-auto mb-2" size={20} />
              <h4 className="font-medium text-white mb-1">Profile Updates</h4>
              <p className="text-sm text-slate-400">Automatically update your profile</p>
            </div>
          </div>
        </div>
      )}

      {/* Resume Display */}
      {resume && (
        <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Current Resume</h3>
            <div className="flex items-center gap-2">
              {resume.downloadURL && (
                <button
                  onClick={() => window.open(resume.downloadURL, '_blank')}
                  className="px-4 py-2 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center gap-2"
                >
                  <Download size={16} />
                  Download
                </button>
              )}
              <button
                onClick={onRemove}
                className="px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors flex items-center gap-2"
              >
                <X size={16} />
                Remove
              </button>
            </div>
          </div>

          {/* File Info */}
          <div className="flex items-center gap-4 p-4 bg-slate-600/30 rounded-lg mb-6">
            <div className="text-2xl">{getFileIcon(resume.fileName)}</div>
            <div className="flex-1">
              <h4 className="font-medium text-white">{resume.fileName}</h4>
              <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
                <span>Uploaded: {new Date(resume.uploadedAt).toLocaleDateString()}</span>
                {resume.size && <span>Size: {resume.size}</span>}
              </div>
            </div>
            <CheckCircle className="text-green-400" size={20} />
          </div>

          {/* Parsed Data */}
          {resume.parsedData && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Extracted Information</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Experience Level */}
                <div className="bg-slate-600/30 rounded-lg p-4">
                  <h5 className="font-medium text-white mb-2">Experience Level</h5>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    resume.parsedData.experience_level === 'Expert' 
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : resume.parsedData.experience_level === 'Advanced' 
                      ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                      : resume.parsedData.experience_level === 'Intermediate'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-green-500/20 text-green-300 border border-green-500/30'
                  }`}>
                    {resume.parsedData.experience_level || 'Beginner'}
                  </span>
                </div>

                {/* Domains */}
                <div className="bg-slate-600/30 rounded-lg p-4">
                  <h5 className="font-medium text-white mb-2">Domains</h5>
                  <div className="flex flex-wrap gap-2">
                    {(resume.parsedData.domains || []).map((domain, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-sm">
                        {domain}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Skills */}
                <div className="bg-slate-600/30 rounded-lg p-4 md:col-span-2">
                  <h5 className="font-medium text-white mb-2">Skills ({resume.parsedData.skills?.length || 0})</h5>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {(resume.parsedData.skills || []).map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Companies */}
                {resume.parsedData.companies && resume.parsedData.companies.length > 0 && (
                  <div className="bg-slate-600/30 rounded-lg p-4 md:col-span-2">
                    <h5 className="font-medium text-white mb-2">Previous Companies</h5>
                    <div className="flex flex-wrap gap-2">
                      {resume.parsedData.companies.map((company, index) => (
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
              className="w-full py-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-300 rounded-lg hover:from-cyan-500/30 hover:to-blue-500/30 transition-colors flex items-center justify-center gap-2"
            >
              <Upload size={16} />
              Replace Resume
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeSection;
