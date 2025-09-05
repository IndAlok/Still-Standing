import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import ProfilePictureUpload from '../../components/ProfilePictureUpload';
import crewConnectService from '../../services/crewConnectService';
import {
  User,
  Mail,
  Calendar,
  MapPin,
  Camera,
  Edit2,
  Save,
  X,
  ArrowLeft,
  Shield,
  Activity,
  Users,
  MessageCircle,
} from 'lucide-react';

const Profile = () => {
  const { currentUser, updateUserProfile, getUserData } = useAuth();
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    bio: '',
    location: '',
    photoURL: ''
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        const data = await getUserData();
        setUserData(data);
        setEditForm({
          displayName: data?.displayName || currentUser.displayName || '',
          bio: data?.bio || '',
          location: data?.location || '',
          photoURL: data?.photoURL || currentUser.photoURL || ''
        });
      }
    };

    fetchUserData();
  }, [currentUser, getUserData]);

  const handleSave = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      await updateUserProfile(editForm);
      setMessage('Profile updated successfully!');
      setIsEditing(false);
      
      // Refresh user data
      const updatedData = await getUserData();
      setUserData(updatedData);
    } catch (error) {
      setMessage('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setMessage('');
    setEditForm({
      displayName: userData?.displayName || currentUser.displayName || '',
      bio: userData?.bio || '',
      location: userData?.location || '',
      photoURL: userData?.photoURL || currentUser.photoURL || ''
    });
  };

  const handleProfilePictureUpdate = async (newImageUrl) => {
    try {
      // Update in Firestore through crewConnectService
      await crewConnectService.updateUserProfile(currentUser.uid, {
        profilePicture: newImageUrl
      });
      
      // Update local state
      setUserData(prev => ({
        ...prev,
        profilePicture: newImageUrl,
        photoURL: newImageUrl
      }));
      
      console.log('Profile picture updated successfully');
    } catch (error) {
      console.error('Error updating profile picture:', error);
      throw error;
    }
  };

  const stats = [
    {
      label: 'Groups Joined',
      value: userData?.joinedGroups?.length || 0,
      icon: Users,
      color: 'text-blue-400'
    },
    {
      label: 'Groups Created',
      value: userData?.createdGroups?.length || 0,
      icon: Shield,
      color: 'text-green-400'
    },
    {
      label: 'Messages Sent',
      value: '142', // Mock data
      icon: MessageCircle,
      color: 'text-purple-400'
    },
    {
      label: 'Days Active',
      value: '30', // Mock data
      icon: Activity,
      color: 'text-orange-400'
    }
  ];

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/20 border-t-purple-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </Link>
              <h1 className="text-2xl font-bold text-white">Profile</h1>
            </div>
            
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleCancel}
                  className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white px-4 py-2 rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>Save</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Card */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden mb-8">
          <div className="h-32 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500"></div>
          
          <div className="px-8 pb-8">
            <div className="flex items-start -mt-16 mb-6">
              <div className="relative">
                <ProfilePictureUpload
                  currentImageUrl={userData?.profilePicture || userData?.photoURL || currentUser.photoURL}
                  onImageUpdate={handleProfilePictureUpdate}
                  userName={userData?.displayName || currentUser.email}
                  size="xlarge"
                  showUploadButton={true}
                />
              </div>
              
              <div className="ml-6 flex-1 mt-16">
                <div className="flex items-center justify-between mb-4">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.displayName}
                      onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                      className="text-2xl font-bold bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="Display Name"
                    />
                  ) : (
                    <h2 className="text-2xl font-bold text-white">
                      {userData.displayName || currentUser.displayName || 'User'}
                    </h2>
                  )}
                </div>
                
                <div className="flex items-center space-x-4 text-gray-400 mb-4">
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    <span className="text-sm">{currentUser.email}</span>
                  </div>
                  
                  {userData.createdAt && (
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span className="text-sm">
                        Joined {new Date(userData.createdAt.toDate()).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Bio</label>
                        <textarea
                          value={editForm.bio}
                          onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                          rows={3}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                          placeholder="Tell us about yourself..."
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Location</label>
                        <input
                          type="text"
                          value={editForm.location}
                          onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          placeholder="Where are you based?"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {userData.bio && (
                        <p className="text-gray-300">{userData.bio}</p>
                      )}
                      
                      {userData.location && (
                        <div className="flex items-center text-gray-400">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span className="text-sm">{userData.location}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6 text-center"
            >
              <div className="flex justify-center mb-3">
                <div className="p-3 bg-white/10 rounded-full">
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-gray-400 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Activity Section */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-green-400" />
            Recent Activity
          </h3>
          
          <div className="space-y-4">
            {[
              { action: 'Joined group "Tech Team"', time: '2 hours ago' },
              { action: 'Updated profile information', time: '1 day ago' },
              { action: 'Created group "Project Alpha"', time: '3 days ago' },
              { action: 'Sent 15 messages in "Daily Standup"', time: '1 week ago' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition-colors">
                <span className="text-gray-300">{activity.action}</span>
                <span className="text-gray-500 text-sm">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

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
  );
};

export default Profile;
