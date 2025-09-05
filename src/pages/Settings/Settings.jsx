import React, { useState, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
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
  Save,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Smartphone,
  Monitor,
  Check,
} from 'lucide-react';

const Settings = () => {
  const { currentUser, logout, updateUserPassword } = useAuth();
  const [activeSection, setActiveSection] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Individual handlers to prevent focus loss
  const handleCurrentPasswordChange = useCallback((e) => {
    setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }));
  }, []);

  const handleNewPasswordChange = useCallback((e) => {
    setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }));
  }, []);

  const handleConfirmPasswordChange = useCallback((e) => {
    setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }));
  }, []);

  // Notification settings handlers
  const handleNotificationSettingChange = useCallback((key) => (e) => {
    setNotificationSettings(prev => ({ ...prev, [key]: e.target.checked }));
  }, []);

  // Appearance settings handlers  
  const handleThemeChange = useCallback((theme) => {
    setAppearanceSettings(prev => ({ ...prev, theme }));
  }, []);

  const handleFontSizeChange = useCallback((e) => {
    setAppearanceSettings(prev => ({ ...prev, fontSize: e.target.value }));
  }, []);

  // Privacy settings handlers
  const handlePrivacySettingChange = useCallback((key, value) => {
    setPrivacySettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleProfileVisibilityChange = useCallback((e) => {
    setPrivacySettings(prev => ({ ...prev, profileVisibility: e.target.value }));
  }, []);

  const handleDataCollectionChange = useCallback((e) => {
    setPrivacySettings(prev => ({ ...prev, dataCollection: e.target.checked }));
  }, []);

  const handleActivityStatusChange = useCallback((e) => {
    setPrivacySettings(prev => ({ ...prev, activityStatus: e.target.checked }));
  }, []);

  const handleFriendRequestsChange = useCallback((e) => {
    setPrivacySettings(prev => ({ ...prev, friendRequests: e.target.checked }));
  }, []);

  // Language settings handlers
  const handleLanguageChange = useCallback((e) => {
    setLanguageSettings(prev => ({ ...prev, language: e.target.value }));
  }, []);

  const handleTimezoneChange = useCallback((e) => {
    setLanguageSettings(prev => ({ ...prev, timezone: e.target.value }));
  }, []);

  const handleDateFormatChange = useCallback((e) => {
    setLanguageSettings(prev => ({ ...prev, dateFormat: e.target.value }));
  }, []);

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
    language: 'en',
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

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage('New passwords do not match');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      setMessage('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      await updateUserPassword(passwordForm.currentPassword, passwordForm.newPassword);
      setMessage('Password updated successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      setMessage('Failed to update password. Please check your current password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to logout:', error);
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

  const ProfileSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 p-6 bg-white/5 rounded-xl border border-white/10">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
          {currentUser.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt="Profile"
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <User className="w-8 h-8 text-white" />
          )}
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white">{currentUser.displayName || 'User'}</h3>
          <p className="text-gray-400">{currentUser.email}</p>
        </div>
      </div>
      
      <div className="bg-white/5 rounded-xl border border-white/10 p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Account Information</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Email Address</label>
            <input
              type="email"
              value={currentUser.email}
              disabled
              className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Account Created</label>
            <input
              type="text"
              value={new Date(currentUser.metadata.creationTime).toLocaleDateString()}
              disabled
              className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-gray-400"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const SecuritySettings = useMemo(() => (
    <div className="space-y-6">
      <div className="bg-white/5 rounded-xl border border-white/10 p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Change Password</h4>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Current Password</label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={handleCurrentPasswordChange}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 pr-10 text-white"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-2">New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={handleNewPasswordChange}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 pr-10 text-white"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-2">Confirm New Password</label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={handleConfirmPasswordChange}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white py-2 px-4 rounded-lg transition-colors"
          >
            {isLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  ), [
    handlePasswordChange,
    showCurrentPassword,
    passwordForm,
    handleCurrentPasswordChange,
    showNewPassword,
    handleNewPasswordChange,
    handleConfirmPasswordChange,
    isLoading
  ]);

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
                <div>
                  <p className="text-white text-sm font-medium">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={handleNotificationSettingChange(key)}
                  className="sr-only peer"
                />
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
      <h2 className="text-2xl font-bold text-white mb-6">Privacy Settings</h2>
      
      <div className="space-y-4">
        <div className="p-6 bg-white/5 rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Profile Visibility</h3>
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input 
                type="radio" 
                name="profileVisibility" 
                value="public" 
                className="text-blue-600" 
                checked={privacySettings.profileVisibility === 'public'}
                onChange={handleProfileVisibilityChange}
              />
              <span className="text-white">Public - Anyone can see your profile</span>
            </label>
            <label className="flex items-center space-x-3">
              <input 
                type="radio" 
                name="profileVisibility" 
                value="friends" 
                className="text-blue-600"
                checked={privacySettings.profileVisibility === 'friends'}
                onChange={handleProfileVisibilityChange}
              />
              <span className="text-white">Friends only</span>
            </label>
            <label className="flex items-center space-x-3">
              <input 
                type="radio" 
                name="profileVisibility" 
                value="private" 
                className="text-blue-600"
                checked={privacySettings.profileVisibility === 'private'}
                onChange={handleProfileVisibilityChange}
              />
              <span className="text-white">Private</span>
            </label>
          </div>
        </div>
        
        <div className="p-6 bg-white/5 rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Data & Privacy</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-white">Allow data collection for analytics</span>
              <input 
                type="checkbox" 
                className="toggle-checkbox" 
                checked={privacySettings.dataCollection}
                onChange={handleDataCollectionChange}
              />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-white">Share activity status</span>
              <input 
                type="checkbox" 
                className="toggle-checkbox" 
                checked={privacySettings.activityStatus}
                onChange={handleActivityStatusChange}
              />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-white">Allow friend requests</span>
              <input 
                type="checkbox" 
                className="toggle-checkbox" 
                checked={privacySettings.friendRequests}
                onChange={handleFriendRequestsChange}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const LanguageSettings = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">Language & Region</h2>
      
      <div className="space-y-4">
        <div className="p-6 bg-white/5 rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Language</h3>
          <select 
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
            value={languageSettings.language}
            onChange={handleLanguageChange}
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
            <option value="ja">日本語</option>
          </select>
        </div>
        
        <div className="p-6 bg-white/5 rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Time Zone</h3>
          <select 
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
            value={languageSettings.timezone}
            onChange={handleTimezoneChange}
          >
            <option value="auto">Auto-detect</option>
            <option value="UTC">UTC</option>
            <option value="EST">Eastern Time</option>
            <option value="PST">Pacific Time</option>
            <option value="GMT">Greenwich Mean Time</option>
          </select>
        </div>
        
        <div className="p-6 bg-white/5 rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Date Format</h3>
          <select 
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
            value={languageSettings.dateFormat}
            onChange={handleDateFormatChange}
          >
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>
      </div>
    </div>
  );

  const HelpSettings = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">Help & Support</h2>
      
      <div className="space-y-4">
        <div className="p-6 bg-white/5 rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Help</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg cursor-pointer">
              <span className="text-white">Getting Started Guide</span>
              <span className="text-blue-400">→</span>
            </div>
            <div className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg cursor-pointer">
              <span className="text-white">Keyboard Shortcuts</span>
              <span className="text-blue-400">→</span>
            </div>
            <div className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg cursor-pointer">
              <span className="text-white">FAQ</span>
              <span className="text-blue-400">→</span>
            </div>
          </div>
        </div>
        
        <div className="p-6 bg-white/5 rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Contact Support</h3>
          <div className="space-y-3">
            <button className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors">
              Send Feedback
            </button>
            <button className="w-full p-3 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors">
              Report a Bug
            </button>
            <button className="w-full p-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors">
              Contact Support
            </button>
          </div>
        </div>
        
        <div className="p-6 bg-white/5 rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">App Information</h3>
          <div className="space-y-2 text-gray-400">
            <p>Version: 1.0.0</p>
            <p>Last Updated: December 2024</p>
            <p>Terms of Service | Privacy Policy</p>
          </div>
        </div>
      </div>
    </div>
  );

  const AppearanceSettings = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">Appearance</h2>
      
      <div className="bg-white/5 rounded-xl border border-white/10 p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Theme</h4>
        <div className="grid grid-cols-3 gap-3">
          {['dark', 'light', 'auto'].map((theme) => (
            <button
              key={theme}
              onClick={() => handleThemeChange(theme)}
              className={`p-3 rounded-lg border-2 transition-colors capitalize ${
                appearanceSettings.theme === theme
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-white/20 hover:border-white/40'
              }`}
            >
              <span className="text-white">{theme}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="bg-white/5 rounded-xl border border-white/10 p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Font Size</h4>
        <select
          value={appearanceSettings.fontSize}
          onChange={handleFontSizeChange}
          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </div>
    </div>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileSettings />;
      case 'security':
        return SecuritySettings;
      case 'notifications':
        return <NotificationSettings />;
      case 'privacy':
        return <PrivacySettings />;
      case 'appearance':
        return <AppearanceSettings />;
      case 'language':
        return <LanguageSettings />;
      case 'help':
        return <HelpSettings />;
      default:
        return <div className="text-white">Section under development</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Link
              to="/dashboard"
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Settings Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4 sticky top-4">
              <nav className="space-y-2">
                {settingsSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <section.icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{section.label}</span>
                  </button>
                ))}
                
                <hr className="border-white/20 my-4" />
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm font-medium">Sign Out</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3">
            {renderActiveSection()}
            
            {/* Success/Error Message */}
            {message && (
              <div className={`mt-6 p-4 rounded-lg ${
                message.includes('successfully') 
                  ? 'bg-green-500/20 border border-green-500/30 text-green-400' 
                  : 'bg-red-500/20 border border-red-500/30 text-red-400'
              }`}>
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
