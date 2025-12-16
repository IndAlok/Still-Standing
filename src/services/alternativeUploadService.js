// Alternative upload service using Firebase REST API to bypass CORS
import { auth } from '../config/firebase';

class AlternativeUploadService {
  constructor() {
    this.PROJECT_ID = process.env.REACT_APP_FIREBASE_PROJECT_ID;
    this.STORAGE_BUCKET = process.env.REACT_APP_FIREBASE_STORAGE_BUCKET;
  }

  async uploadWithRestAPI(file, path) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const token = await user.getIdToken();
      
      // Convert file to base64
      const base64Data = await this.fileToBase64(file);
      
      const uploadData = {
        name: path,
        contentType: file.type,
        customMetadata: {
          uploadedBy: user.uid,
          uploadedAt: new Date().toISOString(),
          originalName: file.name
        }
      };

      const response = await fetch(
        `https://firebasestorage.googleapis.com/v0/b/${this.STORAGE_BUCKET}/o?uploadType=media&name=${encodeURIComponent(path)}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': file.type,
            'X-Firebase-Storage-Version': 'v0'
          },
          body: file
        }
      );

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Get download URL
      const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${this.STORAGE_BUCKET}/o/${encodeURIComponent(path)}?alt=media`;
      
      return {
        success: true,
        url: downloadURL,
        path: path,
        metadata: result
      };

    } catch (error) {
      
      throw error;
    }
  }

  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = error => reject(error);
    });
  }
}

export default new AlternativeUploadService();
