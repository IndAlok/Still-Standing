import React, { useState, useRef } from 'react';
import { Camera, Upload, X, User, Check } from 'lucide-react';
import imageUploadService from '../services/imageUploadService';

const ProfilePictureUpload = ({ 
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
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Add timeout to prevent infinite hanging
      const uploadPromise = Promise.race([
        imageUploadService.uploadProfilePicture(file, `user_${Date.now()}`),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Upload timeout - please try again')), 30000)
        )
      ]);

      const imageUrl = await uploadPromise;
      
      // Update profile
      if (onImageUpdate) {
        await onImageUpdate(imageUrl);
      }

      setPreview(null);
      URL.revokeObjectURL(previewUrl);

    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setError(error.message || 'Failed to upload image');
      if (preview) {
        URL.revokeObjectURL(preview);
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

      // Delete from storage if it's a Firebase URL
      if (currentImageUrl && currentImageUrl.includes('firebase')) {
        await imageUploadService.deleteProfilePicture(currentImageUrl);
      }

      // Update profile with null image
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
  const placeholderAvatar = imageUploadService.generatePlaceholderAvatar(userName);

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

export default ProfilePictureUpload;
