import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import storageService from '../../services/storageService';
import settingsService from '../../services/settingsService';
import {
  ArrowLeft,
  User,
  Lock,
  Bell,
  Shield,
  Palette,
  Globe,
  HelpCircle,
  LogOut,
  Eye,
  EyeOff,
  Volume2,
  Smartphone,
  Monitor,
  Camera,
  Upload,
  RefreshCw,
  Loader2,
  Check,
  ExternalLink,
} from 'lucide-react';

const Settings = () => {
  const { currentUser, logout, updateUserPassword, userProfile, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [profilePictureURL, setProfilePictureURL] = useState(userProfile?.profilePicture || currentUser?.photoURL);
  const [isProfilePictureLoading, setIsProfilePictureLoading] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    messageNotifications: true,
    groupInvites: true,
    soundEnabled: true,
    desktopNotifications: true
  });

  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'dark',
    fontSize: 'medium',
    compactMode: false
  });

  const [languageSettings, setLanguageSettings] = useState({
    language: 'en',
    timezone: 'auto',
    dateFormat: 'MM/DD/YYYY'
  });

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    lastSeenVisibility: 'everyone',
    messageReceipts: true,
    activityStatus: true,
    dataCollection: true,
    friendRequests: true
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const settings = await settingsService.getUserSettings();
        if (settings) {
          setNotificationSettings(settings.notifications || notificationSettings);
          setAppearanceSettings(settings.appearance || appearanceSettings);
          setLanguageSettings(settings.language || languageSettings);
          setPrivacySettings(settings.privacy || privacySettings);
        }
        setSettingsLoaded(true);
      } catch (error) {
        
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser) {
      loadSettings();
      settingsService.loadThemeFromStorage();
    }
  }, [currentUser]);

  const handleProfilePictureUpload = useCallback(async (file) => {
    if (!currentUser?.uid) return;
    
    try {
      setIsProfilePictureLoading(true);
      const uploadResult = await storageService.uploadProfilePicture(file, currentUser.uid);
      
      if (uploadResult.success && uploadResult.url) {
        setProfilePictureURL(uploadResult.url);
        await updateUserProfile({ profilePicture: uploadResult.url });
        showMessage('Profile picture updated successfully!', 'success');
      }
    } catch (error) {
      showMessage(`Failed to update profile picture: ${error.message}`, 'error');
    } finally {
      setIsProfilePictureLoading(false);
    }
  }, [currentUser, updateUserProfile]);

  const handleGoogleProfileSync = useCallback(async () => {
    if (!currentUser?.uid || !currentUser?.photoURL) return;
    
    try {
      setIsProfilePictureLoading(true);
      const syncResult = await storageService.syncGoogleProfilePicture(currentUser.uid);
      
      if (syncResult.success && syncResult.url) {
        setProfilePictureURL(syncResult.url);
        await updateUserProfile({ profilePicture: syncResult.url });
        showMessage('Profile picture synced from Google!', 'success');
      }
    } catch (error) {
      showMessage(`Failed to sync Google profile picture: ${error.message}`, 'error');
    } finally {
      setIsProfilePictureLoading(false);
    }
  }, [currentUser, updateUserProfile]);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(''), 4000);
  };

  const handleLogout = useCallback(async () => {
    try {
      setIsLoading(true);
      await logout();
      navigate('/login');
    } catch (error) {
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  }, [logout, navigate]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showMessage('New passwords do not match', 'error');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      showMessage('Password must be at least 6 characters', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await updateUserPassword(passwordForm.currentPassword, passwordForm.newPassword);
      showMessage('Password updated successfully!', 'success');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      showMessage('Failed to update password. Please check your current password.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const saveNotificationSettings = async (newSettings) => {
    setNotificationSettings(newSettings);
    setIsSaving(true);
    try {
      await settingsService.updateNotificationSettings(newSettings);
      showMessage('Notification settings saved!', 'success');
    } catch (error) {
      showMessage('Failed to save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const saveAppearanceSettings = async (newSettings) => {
    setAppearanceSettings(newSettings);
    setIsSaving(true);
    try {
      await settingsService.updateAppearanceSettings(newSettings);
      showMessage('Appearance settings saved!', 'success');
    } catch (error) {
      showMessage('Failed to save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const savePrivacySettings = async (newSettings) => {
    setPrivacySettings(newSettings);
    setIsSaving(true);
    try {
      await settingsService.updatePrivacySettings(newSettings);
      showMessage('Privacy settings saved!', 'success');
    } catch (error) {
      showMessage('Failed to save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const saveLanguageSettings = async (newSettings) => {
    setLanguageSettings(newSettings);
    setIsSaving(true);
    try {
      await settingsService.updateLanguageSettings(newSettings);
      showMessage('Language settings saved!', 'success');
    } catch (error) {
      showMessage('Failed to save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const settingsSections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'language', label: 'Language & Region', icon: Globe },
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
  ];

  const selectStyles = "w-full bg-slate-800 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 [&>option]:bg-slate-800 [&>option]:text-white";

  const ProfileSettings = () => (
    <div className="space-y-6">
      <div className="p-6 bg-white/5 rounded-xl border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Profile Picture</h3>
        <div className="flex items-center space-x-6">
          <div className="relative group">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center overflow-hidden">
              {profilePictureURL ? (
                <img src={profilePictureURL} alt="Profile" className="w-24 h-24 rounded-full object-cover" onError={() => setProfilePictureURL(null)} />
              ) : (
                <User className="w-10 h-10 text-white" />
              )}
              {isProfilePictureLoading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>
            <button onClick={() => document.getElementById('profile-picture-input').click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-cyan-500 hover:bg-cyan-400 rounded-full flex items-center justify-center transition-all"
              disabled={isProfilePictureLoading}>
              <Camera size={14} className="text-white" />
            </button>
            <input id="profile-picture-input" type="file" accept="image/*" onChange={(e) => e.target.files[0] && handleProfilePictureUpload(e.target.files[0])} className="hidden" />
          </div>
          <div className="flex-1">
            <div className="flex gap-3 mb-3">
              <button onClick={() => document.getElementById('profile-picture-input').click()}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg transition-colors font-medium"
                disabled={isProfilePictureLoading}>
                <Upload size={16} /> Upload New
              </button>
              {currentUser?.photoURL && (
                <button onClick={handleGoogleProfileSync}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-lg transition-colors font-medium"
                  disabled={isProfilePictureLoading}>
                  <RefreshCw size={16} /> Sync Google
                </button>
              )}
            </div>
            <p className="text-gray-400 text-sm">Supported formats: JPG, PNG, GIF. Max size: 5MB.</p>
          </div>
        </div>
      </div>
      
      <div className="p-6 bg-white/5 rounded-xl border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Account Information</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center overflow-hidden">
              {profilePictureURL ? (
                <img src={profilePictureURL} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-white" />
              )}
            </div>
            <div>
              <h4 className="text-xl font-semibold text-white">{userProfile?.username || currentUser?.displayName || 'User'}</h4>
              <p className="text-gray-400">{currentUser?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const SecuritySettings = () => (
    <div className="space-y-6">
      <div className="bg-white/5 rounded-xl border border-white/10 p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Change Password</h4>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Current Password</label>
            <div className="relative">
              <input type={showCurrentPassword ? 'text' : 'password'} value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                className="w-full bg-slate-800 border border-white/20 rounded-lg px-3 py-2 pr-10 text-white" required />
              <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">New Password</label>
            <div className="relative">
              <input type={showNewPassword ? 'text' : 'password'} value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                className="w-full bg-slate-800 border border-white/20 rounded-lg px-3 py-2 pr-10 text-white" required />
              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Confirm New Password</label>
            <input type="password" value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="w-full bg-slate-800 border border-white/20 rounded-lg px-3 py-2 text-white" required />
          </div>
          <button type="submit" disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
            {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</> : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );

  const NotificationSettings = () => (
    <div className="space-y-6">
      <div className="bg-white/5 rounded-xl border border-white/10 p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Notification Preferences</h4>
        <div className="space-y-4">
          {Object.entries(notificationSettings).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {key === 'soundEnabled' && <Volume2 className="w-5 h-5 text-gray-400" />}
                {key === 'desktopNotifications' && <Monitor className="w-5 h-5 text-gray-400" />}
                {key === 'pushNotifications' && <Smartphone className="w-5 h-5 text-gray-400" />}
                <span className="text-white text-sm font-medium">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={value}
                  onChange={(e) => saveNotificationSettings({ ...notificationSettings, [key]: e.target.checked })}
                  className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const PrivacySettings = () => (
    <div className="space-y-6">
      <div className="p-6 bg-white/5 rounded-xl border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Profile Visibility</h3>
        <div className="space-y-3">
          {['public', 'friends', 'private'].map((option) => (
            <label key={option} className="flex items-center space-x-3 cursor-pointer">
              <input type="radio" name="profileVisibility" value={option}
                className="w-4 h-4 text-blue-600 bg-slate-800 border-gray-600"
                checked={privacySettings.profileVisibility === option}
                onChange={(e) => savePrivacySettings({ ...privacySettings, profileVisibility: e.target.value })} />
              <span className="text-white capitalize">{option === 'public' ? 'Public - Anyone can see your profile' : option === 'friends' ? 'Friends only' : 'Private'}</span>
            </label>
          ))}
        </div>
      </div>
      
      <div className="p-6 bg-white/5 rounded-xl border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Data & Privacy</h3>
        <div className="space-y-3">
          {[
            { key: 'dataCollection', label: 'Allow data collection for analytics' },
            { key: 'activityStatus', label: 'Share activity status' },
            { key: 'friendRequests', label: 'Allow friend requests' }
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center justify-between cursor-pointer">
              <span className="text-white">{label}</span>
              <input type="checkbox" checked={privacySettings[key]}
                onChange={(e) => savePrivacySettings({ ...privacySettings, [key]: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-slate-800 border-gray-600 rounded" />
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const LanguageSettingsSection = () => (
    <div className="space-y-6">
      <div className="p-6 bg-white/5 rounded-xl border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Language</h3>
        <select className={selectStyles} value={languageSettings.language}
          onChange={(e) => saveLanguageSettings({ ...languageSettings, language: e.target.value })}>
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="de">Deutsch</option>
          <option value="ja">日本語</option>
        </select>
      </div>
      
      <div className="p-6 bg-white/5 rounded-xl border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Time Zone</h3>
        <select className={selectStyles} value={languageSettings.timezone}
          onChange={(e) => saveLanguageSettings({ ...languageSettings, timezone: e.target.value })}>
          <option value="auto">Auto-detect</option>
          <option value="UTC">UTC</option>
          <option value="EST">Eastern Time</option>
          <option value="PST">Pacific Time</option>
          <option value="GMT">Greenwich Mean Time</option>
          <option value="IST">India Standard Time</option>
        </select>
      </div>
      
      <div className="p-6 bg-white/5 rounded-xl border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Date Format</h3>
        <select className={selectStyles} value={languageSettings.dateFormat}
          onChange={(e) => saveLanguageSettings({ ...languageSettings, dateFormat: e.target.value })}>
          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
        </select>
      </div>
    </div>
  );

  const HelpSettings = () => (
    <div className="space-y-6">
      <div className="p-6 bg-white/5 rounded-xl border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Help</h3>
        <div className="space-y-3">
          <a href="https://github.com/IndAlok/Still-Standing#readme" target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg cursor-pointer text-white">
            <span>Documentation</span>
            <ExternalLink className="w-4 h-4 text-blue-400" />
          </a>
          <a href="https://github.com/IndAlok/Still-Standing/issues" target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg cursor-pointer text-white">
            <span>Report a Bug</span>
            <ExternalLink className="w-4 h-4 text-blue-400" />
          </a>
        </div>
      </div>
      
      <div className="p-6 bg-white/5 rounded-xl border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">App Information</h3>
        <div className="space-y-2 text-gray-400">
          <p>Version: 2.0.0</p>
          <p>Last Updated: December 2024</p>
          <p>Built with React, Firebase & Gemini AI</p>
        </div>
      </div>
    </div>
  );

  const AppearanceSettings = () => (
    <div className="space-y-6">
      <div className="bg-white/5 rounded-xl border border-white/10 p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Theme</h4>
        <div className="grid grid-cols-3 gap-3">
          {['dark', 'light', 'auto'].map((theme) => (
            <button key={theme} onClick={() => saveAppearanceSettings({ ...appearanceSettings, theme })}
              className={`p-3 rounded-lg border-2 transition-colors capitalize flex items-center justify-center gap-2 ${
                appearanceSettings.theme === theme ? 'border-blue-500 bg-blue-500/20 text-white' : 'border-white/20 hover:border-white/40 text-gray-300'
              }`}>
              {appearanceSettings.theme === theme && <Check className="w-4 h-4" />}
              {theme}
            </button>
          ))}
        </div>
      </div>
      
      <div className="bg-white/5 rounded-xl border border-white/10 p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Font Size</h4>
        <select className={selectStyles} value={appearanceSettings.fontSize}
          onChange={(e) => saveAppearanceSettings({ ...appearanceSettings, fontSize: e.target.value })}>
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </div>
    </div>
  );

  const renderActiveSection = () => {
    if (isLoading && !settingsLoaded) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      );
    }

    switch (activeSection) {
      case 'profile': return <ProfileSettings />;
      case 'security': return <SecuritySettings />;
      case 'notifications': return <NotificationSettings />;
      case 'privacy': return <PrivacySettings />;
      case 'appearance': return <AppearanceSettings />;
      case 'language': return <LanguageSettingsSection />;
      case 'help': return <HelpSettings />;
      default: return <div className="text-white">Section under development</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-white" />
              </Link>
              <h1 className="text-2xl font-bold text-white">Settings</h1>
            </div>
            {isSaving && (
              <div className="flex items-center gap-2 text-blue-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Saving...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4 sticky top-4">
              <nav className="space-y-2">
                {settingsSections.map((section) => (
                  <button key={section.id} onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeSection === section.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}>
                    <section.icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{section.label}</span>
                  </button>
                ))}
                
                <hr className="border-white/20 my-4" />
                
                <button onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors">
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm font-medium">Sign Out</span>
                </button>
              </nav>
            </div>
          </div>

          <div className="lg:col-span-3">
            {renderActiveSection()}
            
            {message && (
              <div className={`mt-6 p-4 rounded-lg flex items-center gap-2 ${
                message.type === 'success' ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                  : 'bg-red-500/20 border border-red-500/30 text-red-400'
              }`}>
                {message.type === 'success' && <Check className="w-4 h-4" />}
                {message.text}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
