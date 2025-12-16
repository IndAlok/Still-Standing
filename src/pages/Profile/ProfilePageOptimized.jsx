import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  User,
  Mail,
  Clock,
  Star,
  Users,
  Code,
  Brain,
  Monitor,
  Server,
  Plus,
  Edit3,
  Calendar,
  TrendingUp,
  Battery,
  Zap,
  Upload,
  FileText,
  Download,
  X,
  Check,
  AlertCircle,
  MapPin,
  Briefcase,
  Award,
  Activity
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { profileService } from '../../services/profileService';
import { storageService } from '../../services/storageService';
import LoadingSpinner from '../../components/LoadingSpinner';
import ProfileStats from '../../components/ProfileStats';
import SkillsSection from '../../components/SkillsSection';
import ResumeSection from '../../components/ResumeSection';
import ProfilePictureUpload from '../../components/ProfilePictureUpload';

const ProfilePage = () => {
  const { currentUser, userProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [profilePictureURL, setProfilePictureURL] = useState(null);

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  // Resume states
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeProgress, setResumeProgress] = useState(0);

  // Team preferences state
  const [teamPreferences, setTeamPreferences] = useState({
    frontend: [],
    backend: [],
    aiml: []
  });

  // Memoized skill options to prevent recreation on every render
  const skillOptions = useMemo(() => ({
    frontend: [
      'React', 'Vue.js', 'Angular', 'JavaScript', 'TypeScript',
      'CSS', 'HTML', 'Tailwind', 'Next.js', 'Svelte'
    ],
    backend: [
      'Node.js', 'Python', 'Java', 'Django', 'Express',
      'Flask', 'Spring Boot', 'PostgreSQL', 'MongoDB', 'Redis'
    ],
    aiml: [
      'TensorFlow', 'PyTorch', 'Scikit-learn', 'Machine Learning',
      'Deep Learning', 'NLP', 'Computer Vision', 'Pandas', 'NumPy'
    ]
  }), []);

  // Load profile data on component mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser?.uid) return;
      
      setLoading(true);
      setError('');
      
      try {
        const profileData = await profileService.getUserProfile(currentUser.uid);
        if (profileData) {
          setProfile(profileData);
          setTeamPreferences(profileData.teamPreferences || {
            frontend: [],
            backend: [],
            aiml: []
          });
        } else {
          setProfile(userProfile);
        }

        // Load profile picture
        const profilePicURL = await storageService.getProfilePictureURL(currentUser.uid);
        setProfilePictureURL(profilePicURL);

      } catch (error) {
        
        setError('Failed to load profile data');
        setProfile(userProfile); // Fallback to auth context
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [currentUser?.uid, userProfile]);

  // Memoized profile data to display
  const displayProfile = useMemo(() => {
    return profile || userProfile || {};
  }, [profile, userProfile]);

  // Handle profile update with optimistic updates
  const handleProfileUpdate = useCallback(async (updates) => {
    if (!currentUser?.uid) return;

    setUpdating(true);
    setError('');

    try {
      // Optimistic update
      setProfile(prev => ({ ...prev, ...updates }));

      const result = await profileService.updateUserProfile(currentUser.uid, updates);
      
      if (result.success) {
        
      } else {
        throw new Error(result.error || 'Update failed');
      }
    } catch (error) {
      
      setError(error.message);
      
      // Revert optimistic update on error
      setProfile(prev => {
        const reverted = { ...prev };
        Object.keys(updates).forEach(key => {
          delete reverted[key];
        });
        return reverted;
      });
    } finally {
      setUpdating(false);
    }
  }, [currentUser?.uid]);

  // Handle resume upload with progress tracking
  const handleResumeUpload = useCallback(async (resumeData) => {
    if (!currentUser?.uid || !resumeData) return;

    try {
      // Update local profile state with new resume
      setProfile(prev => ({
        ...prev,
        resume: resumeData,
        // Update profile with parsed data if available
        ...(resumeData.parsedData && {
          skills: [...new Set([...(prev.skills || []), ...(resumeData.parsedData.skills || [])])],
          domains: resumeData.parsedData.domains,
          experience: resumeData.parsedData.experience_level
        })
      }));
      
      
    } catch (error) {
      
      setError(error.message);
    }
  }, [currentUser?.uid]);

  // Handle profile picture update
  const handleProfilePictureUpdate = useCallback(async (newURL) => {
    setProfilePictureURL(newURL);
    
    // Update profile in database
    if (currentUser?.uid) {
      try {
        await handleProfileUpdate({ profilePicture: newURL });
      } catch (error) {
        
      }
    }
  }, [currentUser?.uid, handleProfileUpdate]);

  // Handle team preferences update
  const handleTeamPreferencesUpdate = useCallback(async (preferences) => {
    if (!currentUser?.uid) return;

    try {
      const result = await profileService.updateTeamPreferences(currentUser.uid, preferences);
      
      if (result.success) {
        setTeamPreferences(preferences);
        setProfile(prev => ({ ...prev, teamPreferences: preferences }));
        
      } else {
        throw new Error(result.error || 'Update failed');
      }
    } catch (error) {
      
      setError(error.message);
    }
  }, [currentUser?.uid]);

  // Memoized experience level configuration
  const experienceConfig = useMemo(() => {
    const level = displayProfile.experience || 'Beginner';
    const configs = {
      Beginner: { color: 'bg-green-500/20 text-green-300 border-green-500/30', icon: Star },
      Intermediate: { color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icon: TrendingUp },
      Advanced: { color: 'bg-orange-500/20 text-orange-300 border-orange-500/30', icon: Award },
      Expert: { color: 'bg-red-500/20 text-red-300 border-red-500/30', icon: Zap }
    };
    return configs[level] || configs.Beginner;
  }, [displayProfile.experience]);

  // Tabs configuration
  const tabs = useMemo(() => [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'skills', label: 'Skills & Preferences', icon: Code },
    { id: 'resume', label: 'Resume', icon: FileText },
    { id: 'stats', label: 'Statistics', icon: Activity }
  ], []);

  if (loading) {
    return <LoadingSpinner message="Loading profile..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 p-4 max-w-7xl mx-auto">
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="text-red-400" size={20} />
            <span className="text-red-300">{error}</span>
            <button
              onClick={() => setError('')}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Profile Header */}
        <div className="bg-slate-800/40 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden mb-8 border border-slate-700/50">
          <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 px-8 py-12 text-white relative">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative z-10 flex items-center justify-between flex-wrap gap-6">
              <div className="flex items-center gap-6">
                {/* Profile Picture */}
                <ProfilePictureUpload
                  currentPhotoURL={profilePictureURL || displayProfile.profilePicture}
                  onPhotoUpdate={handleProfilePictureUpdate}
                  size="large"
                  showGoogleSync={true}
                  className="w-24 h-24"
                />

                <div>
                  <h1 className="text-3xl font-bold mb-2 text-white">
                    {displayProfile.displayName || displayProfile.username || 'User'}
                  </h1>
                  <p className="text-cyan-100 mb-2 flex items-center gap-2">
                    <Mail size={16} />
                    {displayProfile.email}
                  </p>
                  {displayProfile.location && (
                    <p className="text-cyan-100 mb-2 flex items-center gap-2">
                      <MapPin size={16} />
                      {displayProfile.location}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-3">
                    <span className={`px-3 py-1 rounded-lg text-sm font-medium border ${experienceConfig.color}`}>
                      <experienceConfig.icon className="inline mr-2" size={16} />
                      {displayProfile.experience || 'Beginner'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsEditing(true)}
                className="bg-white/10 backdrop-blur-sm border border-white/20 px-6 py-3 rounded-xl text-white hover:bg-white/20 transition-colors flex items-center gap-2"
              >
                <Edit3 size={16} />
                Edit Profile
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-slate-800/60 backdrop-blur-sm px-8">
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-cyan-400 text-cyan-400'
                      : 'border-transparent text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Profile Overview</h2>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-slate-700/30 rounded-xl p-6 text-center">
                  <Users className="text-blue-400 mx-auto mb-3" size={24} />
                  <div className="text-2xl font-bold text-white">12</div>
                  <div className="text-slate-400">Groups Joined</div>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-6 text-center">
                  <Code className="text-green-400 mx-auto mb-3" size={24} />
                  <div className="text-2xl font-bold text-white">{displayProfile.skills?.length || 0}</div>
                  <div className="text-slate-400">Skills</div>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-6 text-center">
                  <Briefcase className="text-purple-400 mx-auto mb-3" size={24} />
                  <div className="text-2xl font-bold text-white">3</div>
                  <div className="text-slate-400">Projects</div>
                </div>
              </div>

              {/* Bio/Description */}
              <div className="bg-slate-700/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">About</h3>
                <p className="text-slate-300 leading-relaxed">
                  {displayProfile.bio || 'No bio added yet. Edit your profile to add a description about yourself.'}
                </p>
              </div>

              {/* Recent Activity */}
              <div className="bg-slate-700/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-slate-600/30 rounded-lg">
                    <Activity className="text-cyan-400" size={16} />
                    <span className="text-slate-300">Joined "React Developers" group</span>
                    <span className="text-slate-500 ml-auto text-sm">2 hours ago</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-600/30 rounded-lg">
                    <Upload className="text-green-400" size={16} />
                    <span className="text-slate-300">Updated resume</span>
                    <span className="text-slate-500 ml-auto text-sm">1 day ago</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'skills' && (
            <SkillsSection
              teamPreferences={teamPreferences}
              skillOptions={skillOptions}
              onUpdate={handleTeamPreferencesUpdate}
              updating={updating}
            />
          )}

          {activeTab === 'resume' && (
            <ResumeSection
              userId={currentUser?.uid}
              onResumeUpdate={handleResumeUpload}
            />
          )}

          {activeTab === 'stats' && (
            <ProfileStats userId={currentUser?.uid} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
