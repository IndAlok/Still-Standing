import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, RefreshCw, User, Check } from 'lucide-react';
import { storageService } from '../services/storageService';
import { useAuth } from '../contexts/AuthContext';

const ProfilePictureUpload = ({ 
  currentPhotoURL, 
  onPhotoUpdate, 
  size = 'large',
  className = '',
  showGoogleSync = true 
}) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [previewURL, setPreviewURL] = useState(currentPhotoURL);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setPreviewURL(currentPhotoURL);
  }, [currentPhotoURL]);

  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32',
    xlarge: 'w-48 h-48'
  };

  const handleFileSelect = (file) => {
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewURL(e.target.result);
    };
    reader.readAsDataURL(file);

    // Upload file
    uploadProfilePicture(file);
  };

  const uploadProfilePicture = async (file) => {
    setIsUploading(true);
    setError('');

    try {
      const result = await storageService.uploadProfilePicture(file);
      
      if (result.success) {
        setPreviewURL(result.url);
        onPhotoUpdate?.(result.url);
        
        // Success feedback
        setTimeout(() => {
          setIsUploading(false);
        }, 500);
      }
    } catch (error) {
      
      setError(error.message);
      setPreviewURL(currentPhotoURL); // Revert preview
      setIsUploading(false);
    }
  };

  const handleGoogleSync = async () => {
    if (!user?.photoURL) {
      setError('No Google profile picture available');
      return;
    }

    setIsSyncing(true);
    setError('');

    try {
      const result = await storageService.syncGoogleProfilePicture();
      
      if (result.success) {
        setPreviewURL(result.url);
        onPhotoUpdate?.(result.url);
      }
    } catch (error) {
      
      setError(error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRemovePicture = async () => {
    setIsUploading(true);
    setError('');

    try {
      await storageService.deleteProfilePicture();
      setPreviewURL(null);
      onPhotoUpdate?.(null);
    } catch (error) {
      
      setError(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragOut = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const openFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`relative ${className}`}>
      <div 
        className={`
          ${sizeClasses[size]}
          relative rounded-full overflow-hidden border-4 border-gray-200 
          hover:border-blue-300 transition-all duration-200 cursor-pointer group
          ${dragActive ? 'border-blue-500 bg-blue-50' : ''}
          ${isUploading ? 'border-blue-500' : ''}
        `}
        onClick={openFileSelect}
        onDrag={handleDrag}
        onDragStart={handleDrag}
        onDragEnd={handleDrag}
        onDragOver={handleDragIn}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDrop={handleDrop}
      >
        {/* Profile Picture Display */}
        {previewURL ? (
          <img
            src={previewURL}
            alt="Profile"
            className="w-full h-full object-cover"
            onError={() => {
              setPreviewURL(null);
              setError('Failed to load image');
            }}
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <User className="w-1/2 h-1/2 text-gray-400" />
          </div>
        )}

        {/* Upload Overlay */}
        <div className={`
          absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center
          opacity-0 group-hover:opacity-100 transition-opacity duration-200
          ${isUploading || isSyncing ? 'opacity-100' : ''}
        `}>
          {isUploading ? (
            <div className="text-white text-center">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-1" />
              <span className="text-xs">Uploading...</span>
            </div>
          ) : isSyncing ? (
            <div className="text-white text-center">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-1" />
              <span className="text-xs">Syncing...</span>
            </div>
          ) : (
            <div className="text-white text-center">
              <Camera className="w-6 h-6 mx-auto mb-1" />
              <span className="text-xs">Change</span>
            </div>
          )}
        </div>

        {/* Success Indicator */}
        {isUploading && (
          <div className="absolute top-2 right-2">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="absolute -bottom-2 -right-2 flex gap-1">
        {/* Upload Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            openFileSelect();
          }}
          disabled={isUploading || isSyncing}
          className="w-8 h-8 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 
                   rounded-full flex items-center justify-center shadow-lg
                   transition-colors duration-200"
          title="Upload new picture"
        >
          <Upload className="w-4 h-4 text-white" />
        </button>

        {/* Google Sync Button */}
        {showGoogleSync && user?.photoURL && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleGoogleSync();
            }}
            disabled={isUploading || isSyncing}
            className="w-8 h-8 bg-red-500 hover:bg-red-600 disabled:bg-red-300 
                     rounded-full flex items-center justify-center shadow-lg
                     transition-colors duration-200"
            title="Sync from Google account"
          >
            <RefreshCw className={`w-4 h-4 text-white ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
        )}

        {/* Remove Button */}
        {previewURL && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRemovePicture();
            }}
            disabled={isUploading || isSyncing}
            className="w-8 h-8 bg-red-500 hover:bg-red-600 disabled:bg-red-300 
                     rounded-full flex items-center justify-center shadow-lg
                     transition-colors duration-200"
            title="Remove picture"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileSelect(e.target.files?.[0])}
        className="hidden"
      />

      {/* Error Message */}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-2">
          <div className="bg-red-50 border border-red-200 rounded-md p-2">
            <p className="text-xs text-red-600">{error}</p>
            <button
              onClick={() => setError('')}
              className="mt-1 text-xs text-red-500 hover:text-red-700"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Drag Active Overlay */}
      {dragActive && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-20 rounded-full 
                       flex items-center justify-center border-2 border-dashed border-blue-500">
          <div className="text-blue-700 text-center">
            <Upload className="w-8 h-8 mx-auto mb-2" />
            <span className="text-sm font-medium">Drop image here</span>
          </div>
        </div>
      )}

      {/* Upload Instructions */}
      {size === 'large' && !previewURL && (
        <div className="absolute top-full left-0 right-0 mt-4 text-center">
          <p className="text-xs text-gray-500 mb-2">
            Click to upload or drag & drop
          </p>
          <p className="text-xs text-gray-400">
            Supports: JPG, PNG, WebP, GIF (max 5MB)
          </p>
        </div>
      )}
    </div>
  );
};

export default ProfilePictureUpload;
