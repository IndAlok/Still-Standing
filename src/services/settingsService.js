import { db, auth } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

const DEFAULT_SETTINGS = {
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    messageNotifications: true,
    groupInvites: true,
    soundEnabled: true,
    desktopNotifications: true
  },
  appearance: {
    theme: 'dark',
    fontSize: 'medium',
    compactMode: false
  },
  privacy: {
    profileVisibility: 'public',
    lastSeenVisibility: 'everyone',
    messageReceipts: true,
    activityStatus: true,
    dataCollection: true,
    friendRequests: true
  },
  language: {
    language: 'en',
    timezone: 'auto',
    dateFormat: 'MM/DD/YYYY'
  }
};

class SettingsService {
  constructor() {
    this.settingsCache = null;
    this.cacheExpiry = null;
  }

  getCurrentUserId() {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    return user.uid;
  }

  async getUserSettings(userId = null) {
    try {
      const uid = userId || this.getCurrentUserId();
      
      if (this.settingsCache && this.cacheExpiry > Date.now()) {
        return this.settingsCache;
      }

      const settingsRef = doc(db, 'userSettings', uid);
      const settingsDoc = await getDoc(settingsRef);

      if (settingsDoc.exists()) {
        const settings = { ...DEFAULT_SETTINGS, ...settingsDoc.data() };
        this.settingsCache = settings;
        this.cacheExpiry = Date.now() + 300000;
        return settings;
      }

      await this.initializeSettings(uid);
      return DEFAULT_SETTINGS;
    } catch (error) {
      
      return DEFAULT_SETTINGS;
    }
  }

  async initializeSettings(userId) {
    try {
      const settingsRef = doc(db, 'userSettings', userId);
      await setDoc(settingsRef, {
        ...DEFAULT_SETTINGS,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      this.settingsCache = DEFAULT_SETTINGS;
      this.cacheExpiry = Date.now() + 300000;
    } catch (error) {
      
    }
  }

  async updateNotificationSettings(settings) {
    return this.updateSettingsCategory('notifications', settings);
  }

  async updateAppearanceSettings(settings) {
    const result = await this.updateSettingsCategory('appearance', settings);
    if (result.success && settings.theme) {
      this.applyTheme(settings.theme);
    }
    return result;
  }

  async updatePrivacySettings(settings) {
    return this.updateSettingsCategory('privacy', settings);
  }

  async updateLanguageSettings(settings) {
    return this.updateSettingsCategory('language', settings);
  }

  async updateSettingsCategory(category, settings) {
    try {
      const uid = this.getCurrentUserId();
      const settingsRef = doc(db, 'userSettings', uid);

      const updateData = {
        [category]: settings,
        updatedAt: serverTimestamp()
      };

      const docSnap = await getDoc(settingsRef);
      if (docSnap.exists()) {
        await updateDoc(settingsRef, updateData);
      } else {
        await setDoc(settingsRef, {
          ...DEFAULT_SETTINGS,
          ...updateData,
          createdAt: serverTimestamp()
        });
      }

      if (this.settingsCache) {
        this.settingsCache[category] = settings;
      }

      return { success: true };
    } catch (error) {
      
      return { success: false, error: error.message };
    }
  }

  applyTheme(theme) {
    const root = document.documentElement;
    
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      theme = prefersDark ? 'dark' : 'light';
    }

    if (theme === 'light') {
      root.style.setProperty('--bg-primary', '#ffffff');
      root.style.setProperty('--bg-secondary', '#f8fafc');
      root.style.setProperty('--text-primary', '#1e293b');
      root.style.setProperty('--text-secondary', '#64748b');
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.style.setProperty('--bg-primary', '#0f172a');
      root.style.setProperty('--bg-secondary', '#1e293b');
      root.style.setProperty('--text-primary', '#f8fafc');
      root.style.setProperty('--text-secondary', '#94a3b8');
      root.classList.remove('light');
      root.classList.add('dark');
    }

    localStorage.setItem('crewconnect-theme', theme);
  }

  loadThemeFromStorage() {
    const savedTheme = localStorage.getItem('crewconnect-theme');
    if (savedTheme) {
      this.applyTheme(savedTheme);
    }
  }

  clearCache() {
    this.settingsCache = null;
    this.cacheExpiry = null;
  }
}

export const settingsService = new SettingsService();
export default settingsService;
