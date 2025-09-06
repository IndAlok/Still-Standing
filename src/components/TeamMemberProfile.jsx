import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Github, 
  Linkedin, 
  FileText, 
  Download, 
  Calendar, 
  Clock, 
  Star,
  TrendingUp,
  Battery,
  Zap,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import storageService from '../services/storageService';
import crewConnectService from '../services/crewConnectService';

const TeamMemberProfile = ({ memberId, onClose, isOpen }) => {
  const { userProfile } = useAuth();
  const [memberProfile, setMemberProfile] = useState(null);
  const [memberResume, setMemberResume] = useState(null);
  const [profilePictureURL, setProfilePictureURL] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && memberId) {
      loadMemberProfile();
    }
  }, [isOpen, memberId]);

  const loadMemberProfile = async () => {
    try {
      setLoading(true);
      setError('');

      // Load member profile data
      const profile = await crewConnectService.getUserProfile(memberId);
      if (profile) {
        setMemberProfile(profile);

        // Load profile picture
        try {
          const profilePicture = await storageService.getProfilePictureURL(memberId);
          setProfilePictureURL(profilePicture || profile.profilePicture);
        } catch (profilePictureError) {
          console.log('No profile picture found for member:', memberId);
        }

        // Load resume if available
        try {
          const resumeData = await storageService.getUserResume(memberId);
          if (resumeData) {
            setMemberResume({
              name: resumeData.originalName || 'Resume',
              size: resumeData.size || 'Unknown',
              uploadDate: resumeData.uploadDate ? new Date(resumeData.uploadDate).toLocaleDateString() : 'Unknown',
              type: resumeData.type || 'PDF',
              url: resumeData.downloadURL,
              status: resumeData.processingStatus || 'completed',
              extractedData: resumeData.extractedData
            });
          }
        } catch (resumeError) {
          console.log('No resume found for member:', memberId);
        }
      } else {
        setError('Profile not found');
      }
    } catch (err) {
      console.error('Error loading member profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleResumeDownload = async () => {
    if (memberResume?.url) {
      try {
        // Create a temporary link to download the file
        const link = document.createElement('a');
        link.href = memberResume.url;
        link.download = memberResume.name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error('Error downloading resume:', error);
      }
    }
  };

  const getExperienceColor = (level) => {
    const colors = {
      Beginner: "bg-green-500/20 text-green-300 border-green-500/30",
      Intermediate: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      Advanced: "bg-orange-500/20 text-orange-300 border-orange-500/30",
      Expert: "bg-red-500/20 text-red-300 border-red-500/30",
    };
    return colors[level] || colors.Beginner;
  };

  const getAvailabilityConfig = (level) => {
    const configs = {
      High: {
        color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        icon: Zap,
      },
      Medium: {
        color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        icon: Battery,
      },
      Low: {
        color: "bg-red-500/20 text-red-300 border-red-500/30",
        icon: Clock,
      },
    };
    return configs[level] || configs.Medium;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800/95 backdrop-blur-xl rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-700/50 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 px-8 py-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Team Member Profile</h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-white">Loading profile...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                Close
              </button>
            </div>
          ) : memberProfile ? (
            <div className="space-y-8">
              {/* Profile Header */}
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center overflow-hidden">
                  {profilePictureURL ? (
                    <img
                      src={profilePictureURL}
                      alt="Profile"
                      className="w-24 h-24 rounded-2xl object-cover"
                      onError={() => setProfilePictureURL(null)}
                    />
                  ) : (
                    <User size={36} className="text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {memberProfile.username || memberProfile.displayName || 'Team Member'}
                  </h3>
                  <p className="text-cyan-300 text-lg mb-4">{memberProfile.domain || 'Developer'}</p>
                  <div className="flex items-center gap-4 flex-wrap">
                    {memberProfile.availability && (
                      <span className={`px-3 py-1 rounded-xl text-sm font-medium border flex items-center gap-2 ${getAvailabilityConfig(memberProfile.availability).color}`}>
                        {React.createElement(getAvailabilityConfig(memberProfile.availability).icon, { size: 16 })}
                        {memberProfile.availability} Availability
                      </span>
                    )}
                    {memberProfile.experience && (
                      <span className={`px-3 py-1 rounded-xl text-sm font-medium border ${getExperienceColor(memberProfile.experience)}`}>
                        <TrendingUp size={16} className="inline mr-1" />
                        {memberProfile.experience} Level
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* Contact Information */}
                <div className="bg-slate-700/50 rounded-2xl p-6 border border-slate-600/30">
                  <h4 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                    <Mail className="text-cyan-400" size={24} />
                    Contact Information
                  </h4>
                  <div className="space-y-4">
                    {memberProfile.email && (
                      <div className="flex items-center gap-3 text-slate-300">
                        <Mail size={18} className="text-cyan-400" />
                        <span>{memberProfile.email}</span>
                      </div>
                    )}
                    {memberProfile.phone && (
                      <div className="flex items-center gap-3 text-slate-300">
                        <Phone size={18} className="text-emerald-400" />
                        <span>{memberProfile.phone}</span>
                      </div>
                    )}
                    {memberProfile.location && (
                      <div className="flex items-center gap-3 text-slate-300">
                        <MapPin size={18} className="text-purple-400" />
                        <span>{memberProfile.location}</span>
                      </div>
                    )}
                    {memberProfile.github && (
                      <div className="flex items-center gap-3 text-slate-300">
                        <Github size={18} className="text-orange-400" />
                        <a
                          href={memberProfile.github.startsWith('http') ? memberProfile.github : `https://github.com/${memberProfile.github}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-orange-300 transition-colors"
                        >
                          {memberProfile.github}
                        </a>
                      </div>
                    )}
                    {memberProfile.linkedin && (
                      <div className="flex items-center gap-3 text-slate-300">
                        <Linkedin size={18} className="text-blue-400" />
                        <a
                          href={memberProfile.linkedin.startsWith('http') ? memberProfile.linkedin : `https://linkedin.com/in/${memberProfile.linkedin}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-blue-300 transition-colors"
                        >
                          {memberProfile.linkedin}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Skills */}
                <div className="bg-slate-700/50 rounded-2xl p-6 border border-slate-600/30">
                  <h4 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                    <Star className="text-amber-400" size={24} />
                    Tech Stack
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(memberProfile.preferredSkills || []).map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 rounded-lg text-sm font-medium border border-amber-500/30"
                      >
                        {skill}
                      </span>
                    ))}
                    {(!memberProfile.preferredSkills || memberProfile.preferredSkills.length === 0) && (
                      <p className="text-slate-400 italic">No skills specified</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio */}
              {memberProfile.bio && (
                <div className="bg-slate-700/50 rounded-2xl p-6 border border-slate-600/30">
                  <h4 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
                    <User className="text-purple-400" size={24} />
                    About
                  </h4>
                  <p className="text-slate-300 leading-relaxed">{memberProfile.bio}</p>
                </div>
              )}

              {/* Resume Section */}
              {memberResume && (
                <div className="bg-slate-700/50 rounded-2xl p-6 border border-slate-600/30">
                  <h4 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                    <FileText className="text-blue-400" size={24} />
                    Resume
                  </h4>
                  <div className="flex items-center gap-4 p-4 bg-slate-600/30 rounded-xl border border-slate-500/30">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                      <FileText className="text-blue-400" size={24} />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{memberResume.name}</p>
                      <p className="text-slate-400 text-sm">
                        {memberResume.size} • Uploaded on {memberResume.uploadDate}
                      </p>
                    </div>
                    <button
                      onClick={handleResumeDownload}
                      className="text-cyan-400 hover:text-cyan-300 p-2 hover:bg-cyan-500/10 rounded-lg transition-colors flex items-center gap-2 font-medium"
                      title="Download Resume"
                    >
                      <Download size={18} />
                      Download
                    </button>
                  </div>

                  {/* Extracted Resume Data */}
                  {memberResume.extractedData && (
                    <div className="mt-6 space-y-4">
                      <h5 className="text-lg font-semibold text-white">Resume Summary</h5>
                      <div className="bg-slate-600/30 rounded-xl p-4 border border-slate-500/30">
                        <p className="text-slate-300 text-sm leading-relaxed">
                          {memberResume.extractedData.summary || 'No summary available from AI processing.'}
                        </p>
                      </div>
                      
                      {memberResume.extractedData.skills && memberResume.extractedData.skills.length > 0 && (
                        <div>
                          <h6 className="text-white font-medium mb-3">Skills from Resume</h6>
                          <div className="flex flex-wrap gap-2">
                            {memberResume.extractedData.skills.map((skill, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded text-sm border border-emerald-500/30"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Join Date */}
              <div className="bg-slate-700/50 rounded-2xl p-6 border border-slate-600/30">
                <h4 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
                  <Calendar className="text-indigo-400" size={24} />
                  Member Since
                </h4>
                <p className="text-slate-300">
                  {memberProfile.createdAt ? new Date(memberProfile.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'Unknown'}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700/50 bg-slate-800/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamMemberProfile;
