import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import ProfilePictureUpload from '../../components/ProfilePictureUpload';
import crewConnectService from '../../services/crewConnectService';
import { skillService } from '../../services/skillService';
import { geminiService } from '../../services/geminiService';
import { storageService } from '../../services/storageService';
import SkillBadge, { SkillBadgeGroup, SkillLevelIndicator } from '../../components/SkillBadge/SkillBadge';
import {
  User,
  Mail,
  Calendar,
  MapPin,
  Edit2,
  Save,
  X,
  ArrowLeft,
  Shield,
  Activity,
  Users,
  MessageCircle,
  Plus,
  Trash2,
  Upload,
  FileText,
  Github,
  Linkedin,
  Globe,
  Sparkles,
  Loader2,
  Star,
  TrendingUp,
  Briefcase
} from 'lucide-react';

const Profile = () => {
  const { currentUser, updateUserProfile, getUserData } = useAuth();
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [editForm, setEditForm] = useState({
    displayName: '',
    bio: '',
    location: '',
    photoURL: '',
    portfolio: { github: '', linkedin: '', website: '' }
  });
  const [message, setMessage] = useState('');
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: '', level: 'intermediate', category: 'technical' });
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeParsing, setResumeParsing] = useState(false);

  const allSkills = skillService.getAllSkills();
  const skillLevels = skillService.getSkillLevels();

  const handleInputChange = useCallback((field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handlePortfolioChange = useCallback((field, value) => {
    setEditForm(prev => ({
      ...prev,
      portfolio: { ...prev.portfolio, [field]: value }
    }));
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        const data = await getUserData();
        setUserData(data);
        setEditForm({
          displayName: data?.displayName || currentUser.displayName || '',
          bio: data?.bio || '',
          location: data?.location || '',
          photoURL: data?.photoURL || currentUser.photoURL || '',
          portfolio: data?.portfolio || { github: '', linkedin: '', website: '' }
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
      photoURL: userData?.photoURL || currentUser.photoURL || '',
      portfolio: userData?.portfolio || { github: '', linkedin: '', website: '' }
    });
  };

  const handleProfilePictureUpdate = async (newImageUrl) => {
    try {
      await crewConnectService.updateUserProfile(currentUser.uid, { profilePicture: newImageUrl });
      setUserData(prev => ({ ...prev, profilePicture: newImageUrl, photoURL: newImageUrl }));
    } catch (error) {
      
    }
  };

  const handleAddSkill = async () => {
    if (!newSkill.name.trim()) return;
    setIsLoading(true);
    try {
      const result = await skillService.addSkill(newSkill);
      if (result.success) {
        const updatedData = await getUserData();
        setUserData(updatedData);
        setNewSkill({ name: '', level: 'intermediate', category: 'technical' });
        setShowAddSkill(false);
        setMessage('Skill added successfully!');
      }
    } catch (error) {
      setMessage('Failed to add skill');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveSkill = async (skillId) => {
    try {
      await skillService.removeSkill(skillId);
      const updatedData = await getUserData();
      setUserData(updatedData);
    } catch (error) {
      
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setResumeUploading(true);
    try {
      const result = await storageService.uploadResume(file);
      if (result?.url) {
        await crewConnectService.updateUserProfile(currentUser.uid, { resumeUrl: result.url });
        setMessage('Resume uploaded! Parsing with AI...');
        setResumeUploading(false);
        setResumeParsing(true);
        
        const text = await file.text();
        const parseResult = await geminiService.parseResume(text);
        
        if (parseResult.success) {
          const parsedData = parseResult.data;
          const skillsToAdd = parsedData.skills?.slice(0, 10) || [];
          
          for (const skill of skillsToAdd) {
            await skillService.addSkill(skill);
          }

          if (parsedData.personalInfo) {
            await crewConnectService.updateUserProfile(currentUser.uid, {
              resumeData: parsedData,
              portfolio: {
                github: parsedData.personalInfo.github || userData?.portfolio?.github || '',
                linkedin: parsedData.personalInfo.linkedin || userData?.portfolio?.linkedin || '',
                website: parsedData.personalInfo.portfolio || userData?.portfolio?.website || ''
              }
            });
          }

          const updatedData = await getUserData();
          setUserData(updatedData);
          setMessage(`Resume parsed! Added ${skillsToAdd.length} skills.`);
        }
      }
    } catch (error) {
      setMessage('Failed to upload resume');
    } finally {
      setResumeUploading(false);
      setResumeParsing(false);
    }
  };

  const stats = [
    { label: 'Groups Joined', value: userData?.joinedGroups?.length || 0, icon: Users, color: 'text-blue-400' },
    { label: 'Groups Created', value: userData?.createdGroups?.length || 0, icon: Shield, color: 'text-green-400' },
    { label: 'Skills', value: userData?.skills?.length || 0, icon: Star, color: 'text-purple-400' },
    { label: 'Endorsements', value: userData?.skills?.reduce((sum, s) => sum + (s.endorsementCount || 0), 0) || 0, icon: TrendingUp, color: 'text-orange-400' }
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
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-white" />
              </Link>
              <h1 className="text-2xl font-bold text-white">Profile</h1>
            </div>
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                <Edit2 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <div className="flex space-x-2">
                <button onClick={handleCancel} className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
                <button onClick={handleSave} disabled={isLoading} className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white px-4 py-2 rounded-lg transition-colors disabled:cursor-not-allowed">
                  {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save className="w-4 h-4" />}
                  <span>Save</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                    <input type="text" value={editForm.displayName} onChange={(e) => handleInputChange('displayName', e.target.value)}
                      className="text-2xl font-bold bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Display Name" />
                  ) : (
                    <h2 className="text-2xl font-bold text-white">{userData.displayName || currentUser.displayName || 'User'}</h2>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-gray-400 mb-4">
                  <div className="flex items-center"><Mail className="w-4 h-4 mr-2" /><span className="text-sm">{currentUser.email}</span></div>
                  {userData.location && <div className="flex items-center"><MapPin className="w-4 h-4 mr-2" /><span className="text-sm">{userData.location}</span></div>}
                </div>
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Bio</label>
                      <textarea value={editForm.bio} onChange={(e) => handleInputChange('bio', e.target.value)} rows={2}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none" placeholder="Tell us about yourself..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Location</label>
                      <input type="text" value={editForm.location} onChange={(e) => handleInputChange('location', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Where are you based?" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {userData.bio && <p className="text-gray-300">{userData.bio}</p>}
                    <div className="flex items-center gap-4 mt-3">
                      {userData.portfolio?.github && (
                        <a href={userData.portfolio.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors">
                          <Github className="w-4 h-4" /> GitHub
                        </a>
                      )}
                      {userData.portfolio?.linkedin && (
                        <a href={userData.portfolio.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-gray-400 hover:text-blue-400 transition-colors">
                          <Linkedin className="w-4 h-4" /> LinkedIn
                        </a>
                      )}
                      {userData.portfolio?.website && (
                        <a href={userData.portfolio.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-gray-400 hover:text-green-400 transition-colors">
                          <Globe className="w-4 h-4" /> Website
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4 text-center">
              <div className="flex justify-center mb-2">
                <div className="p-2 bg-white/10 rounded-full">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <p className="text-xl font-bold text-white">{stat.value}</p>
              <p className="text-gray-400 text-xs">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto">
          {['overview', 'skills', 'portfolio'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors whitespace-nowrap ${activeTab === tab ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-green-400" />
              Top Skills
            </h3>
            {userData.skills?.length > 0 ? (
              <SkillBadgeGroup skills={userData.skills} maxVisible={6} size="medium" showLevel={true} />
            ) : (
              <p className="text-gray-400">No skills added yet. Add skills in the Skills tab!</p>
            )}
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <Star className="w-5 h-5 mr-2 text-yellow-400" />
                  My Skills
                </h3>
                <div className="flex gap-2">
                  <label className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 rounded-lg text-white cursor-pointer hover:opacity-90 transition-opacity">
                    {resumeUploading || resumeParsing ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />{resumeParsing ? 'Parsing...' : 'Uploading...'}</>
                    ) : (
                      <><Sparkles className="w-4 h-4" />Import from Resume</>
                    )}
                    <input type="file" accept=".txt,.pdf,.doc,.docx" onChange={handleResumeUpload} className="hidden" disabled={resumeUploading || resumeParsing} />
                  </label>
                  <button onClick={() => setShowAddSkill(true)} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors">
                    <Plus className="w-4 h-4" /> Add Skill
                  </button>
                </div>
              </div>

              {showAddSkill && (
                <div className="bg-white/5 rounded-xl p-4 mb-4 border border-white/10">
                  <div className="grid md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Skill Name</label>
                      <input type="text" value={newSkill.name} onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })} list="skills-list"
                        className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50" placeholder="e.g. React" />
                      <datalist id="skills-list">{allSkills.map(s => <option key={s.name} value={s.name} />)}</datalist>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Category</label>
                      <select value={newSkill.category} onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
                        className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none">
                        <option value="technical">Technical</option>
                        <option value="design">Design</option>
                        <option value="soft">Soft Skills</option>
                        <option value="business">Business</option>
                        <option value="languages">Languages</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Level</label>
                      <select value={newSkill.level} onChange={(e) => setNewSkill({ ...newSkill, level: e.target.value })}
                        className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none">
                        {Object.entries(skillLevels).map(([key, val]) => <option key={key} value={key}>{val.label}</option>)}
                      </select>
                    </div>
                    <div className="flex items-end gap-2">
                      <button onClick={handleAddSkill} disabled={isLoading || !newSkill.name}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 rounded-lg transition-colors">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Add'}
                      </button>
                      <button onClick={() => setShowAddSkill(false)} className="px-3 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {userData.skills?.length > 0 ? userData.skills.map((skill) => (
                  <div key={skill.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <SkillBadge skill={skill} showEndorsements={true} showCategory={true} />
                      <SkillLevelIndicator level={skill.level} />
                    </div>
                    <button onClick={() => handleRemoveSkill(skill.id)} className="p-2 text-gray-400 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )) : (
                  <div className="text-center py-8 text-gray-400">
                    <Star className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No skills yet. Add skills or import from your resume!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Briefcase className="w-5 h-5 mr-2 text-blue-400" />
              Portfolio Links
            </h3>
            {isEditing ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Github className="w-5 h-5 text-gray-400" />
                  <input type="url" value={editForm.portfolio?.github || ''} onChange={(e) => handlePortfolioChange('github', e.target.value)}
                    className="flex-1 bg-white/10 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50" placeholder="https://github.com/username" />
                </div>
                <div className="flex items-center gap-3">
                  <Linkedin className="w-5 h-5 text-gray-400" />
                  <input type="url" value={editForm.portfolio?.linkedin || ''} onChange={(e) => handlePortfolioChange('linkedin', e.target.value)}
                    className="flex-1 bg-white/10 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50" placeholder="https://linkedin.com/in/username" />
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-gray-400" />
                  <input type="url" value={editForm.portfolio?.website || ''} onChange={(e) => handlePortfolioChange('website', e.target.value)}
                    className="flex-1 bg-white/10 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50" placeholder="https://yourwebsite.com" />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {userData.portfolio?.github || userData.portfolio?.linkedin || userData.portfolio?.website ? (
                  <>
                    {userData.portfolio?.github && (
                      <a href={userData.portfolio.github} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                        <Github className="w-5 h-5 text-white" />
                        <span className="text-gray-300">{userData.portfolio.github}</span>
                      </a>
                    )}
                    {userData.portfolio?.linkedin && (
                      <a href={userData.portfolio.linkedin} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                        <Linkedin className="w-5 h-5 text-blue-400" />
                        <span className="text-gray-300">{userData.portfolio.linkedin}</span>
                      </a>
                    )}
                    {userData.portfolio?.website && (
                      <a href={userData.portfolio.website} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                        <Globe className="w-5 h-5 text-green-400" />
                        <span className="text-gray-300">{userData.portfolio.website}</span>
                      </a>
                    )}
                  </>
                ) : (
                  <p className="text-gray-400 text-center py-4">No portfolio links added. Click Edit Profile to add them!</p>
                )}
              </div>
            )}
          </div>
        )}

        {message && (
          <div className={`mt-6 p-4 rounded-lg ${message.includes('success') || message.includes('Added') || message.includes('parsed') 
            ? 'bg-green-500/20 border border-green-500/30 text-green-400' 
            : 'bg-red-500/20 border border-red-500/30 text-red-400'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
