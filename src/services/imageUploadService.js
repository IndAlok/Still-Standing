import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';

class ImageUploadService {
  // Upload profile picture
  async uploadProfilePicture(file, userId) {
    try {
      console.log('Starting upload for file:', file.name, 'size:', file.size);
      
      // Validate file
      if (!file) throw new Error('No file provided');
      if (!file.type.startsWith('image/')) throw new Error('File must be an image');
      if (file.size > 5 * 1024 * 1024) throw new Error('File size must be less than 5MB');

      // Create reference
      const timestamp = Date.now();
      const fileName = `profile-pictures/${userId}/${timestamp}-${file.name}`;
      const storageRef = ref(storage, fileName);

      console.log('Uploading to storage path:', fileName);

      // Upload file with metadata
      const metadata = {
        contentType: file.type,
      };
      
      const snapshot = await uploadBytes(storageRef, file, metadata);
      console.log('Upload successful, getting download URL...');
      
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('Download URL obtained:', downloadURL);

      return downloadURL;
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      throw error;
    }
  }

  // Delete profile picture
  async deleteProfilePicture(imageUrl) {
    try {
      if (!imageUrl) return;
      
      // Extract path from Firebase URL
      const decodedUrl = decodeURIComponent(imageUrl);
      const pathMatch = decodedUrl.match(/\/o\/(.+?)\?/);
      
      if (pathMatch && pathMatch[1]) {
        const imagePath = pathMatch[1];
        const imageRef = ref(storage, imagePath);
        await deleteObject(imageRef);
      }
    } catch (error) {
      console.error('Error deleting profile picture:', error);
      // Don't throw error - deletion failure shouldn't block other operations
    }
  }

  // Compress image before upload (optional)
  compressImage(file, maxWidth = 400, maxHeight = 400, quality = 0.8) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        // Set canvas size and draw image
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };

      img.src = URL.createObjectURL(file);
    });
  }

  // Generate placeholder avatar with initials
  generatePlaceholderAvatar(name, size = 200) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = size;
    canvas.height = size;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // Text
    const initials = name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${size / 3}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials, size / 2, size / 2);

    return canvas.toDataURL('image/png');
  }
}

export const imageUploadService = new ImageUploadService();
export default imageUploadService;
