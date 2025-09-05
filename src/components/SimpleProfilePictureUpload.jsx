import React, { useState, useRef } from 'react';
import { Camera, Upload, X, User, Check } from 'lucide-react';

const SimpleProfilePictureUpload = ({ 
  currentImageUrl, 
  onImageUpdate, 
  userName = 'User',
  size = 'large',
  showUploadButton = true,
  className = '' 
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const sizeClasses = {
    small: 'w-10 h-10',
    medium: 'w-16 h-16',
    large: 'w-24 h-24',
    xlarge: 'w-32 h-32'
  };

  const iconSizes = {
    small: 'w-3 h-3',
    medium: 'w-4 h-4', 
    large: 'w-5 h-5',
    xlarge: 'w-6 h-6'
  };

  // Simple base64 conversion for testing
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const generatePlaceholderAvatar = (name) => {
    const colors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    ];
    
    const initials = name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
    
    const colorIndex = name.charCodeAt(0) % colors.length;
    const gradient = colors[colorIndex];
    
    // Create SVG data URL
    const svg = `
      <svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea"/>
            <stop offset="100%" style="stop-color:#764ba2"/>
          </linearGradient>
        </defs>
        <circle cx="64" cy="64" r="64" fill="url(#gradient)"/>
        <text x="64" y="74" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="32" font-weight="bold">${initials}</text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setError('');
      setUploading(true);

      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('File size must be less than 2MB');
      }

      // Convert to base64 for simple storage
      const base64Image = await convertToBase64(file);
      setPreview(base64Image);

      // For now, just use the base64 as the image URL
      if (onImageUpdate) {
        await onImageUpdate(base64Image);
      }

      setPreview(null);

    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setError(error.message || 'Failed to upload image');
      if (preview) {
        setPreview(null);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async () => {
    try {
      setUploading(true);
      setError('');

      if (onImageUpdate) {
        await onImageUpdate(null);
      }
    } catch (error) {
      console.error('Error removing profile picture:', error);
      setError('Failed to remove image');
    } finally {
      setUploading(false);
    }
  };

  const displayImage = preview || currentImageUrl;
  const placeholderAvatar = generatePlaceholderAvatar(userName);

  return (
    <div className={`relative ${className}`}>
      {/* Profile Picture Display */}
      <div className={`relative ${sizeClasses[size]} rounded-full overflow-hidden group`}>
        {displayImage ? (
          <img
            src={displayImage}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={placeholderAvatar}
            alt="Profile placeholder"
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Loading overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
        )}

        {/* Edit overlay on hover (for large sizes) */}
        {showUploadButton && size !== 'small' && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className={`${iconSizes[size]} text-white`} />
          </div>
        )}
      </div>

      {/* Upload button for small sizes */}
      {showUploadButton && size === 'small' && (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-50"
        >
          <Camera className="w-3 h-3" />
        </button>
      )}

      {/* Upload button for larger sizes */}
      {showUploadButton && size !== 'small' && (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 w-full h-full rounded-full bg-transparent cursor-pointer"
        />
      )}

      {/* Remove button */}
      {currentImageUrl && !uploading && showUploadButton && size !== 'small' && (
        <button
          onClick={handleRemoveImage}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload buttons (external) */}
      {showUploadButton && size !== 'small' && (
        <div className="flex items-center space-x-2 mt-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span>{currentImageUrl ? 'Change' : 'Upload'}</span>
          </button>
          
          {currentImageUrl && (
            <button
              onClick={handleRemoveImage}
              disabled={uploading}
              className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
            >
              Remove
            </button>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-2 text-red-400 text-sm">{error}</div>
      )}

      {/* Success indicator */}
      {!uploading && preview && (
        <div className="absolute -top-2 -left-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white">
          <Check className="w-3 h-3" />
        </div>
      )}
    </div>
  );
};

export default SimpleProfilePictureUpload;
