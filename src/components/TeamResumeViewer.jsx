import React, { useState, useEffect } from 'react';
import { 
  User, 
  FileText, 
  Download, 
  Eye, 
  Calendar,
  HardDrive,
  CheckCircle,
  AlertCircle,
  Clock,
  Star,
  Award,
  TrendingUp,
  Zap,
  Search,
  Filter
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { useAuth } from '../contexts/AuthContext';

const TeamResumeViewer = ({ teamMembers = [], className = '' }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [teamResumes, setTeamResumes] = useState([]);
  const [filteredResumes, setFilteredResumes] = useState([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('');
  const [domainFilter, setDomainFilter] = useState('');

  // Load all team member resumes
  useEffect(() => {
    const loadTeamResumes = async () => {
      if (!user?.uid || !teamMembers.length) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const resumePromises = teamMembers.map(async (member) => {
          try {
            const resumes = await storageService.getTeamMemberResumes(member.uid);
            return resumes.map(resume => ({
              ...resume,
              memberName: member.displayName || member.username || 'Unknown',
              memberEmail: member.email,
              memberId: member.uid
            }));
          } catch (error) {
            
            return [];
          }
        });

        const allResumes = await Promise.all(resumePromises);
        const flattenedResumes = allResumes.flat();
        
        setTeamResumes(flattenedResumes);
        setFilteredResumes(flattenedResumes);
      } catch (error) {
        
        setError('Failed to load team resumes');
      } finally {
        setLoading(false);
      }
    };

    loadTeamResumes();
  }, [user?.uid, teamMembers]);

  // Filter resumes based on search and filters
  useEffect(() => {
    let filtered = teamResumes;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(resume => 
        resume.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resume.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (resume.parsedData?.skills || []).some(skill => 
          skill.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Experience filter
    if (experienceFilter) {
      filtered = filtered.filter(resume => 
        resume.parsedData?.experience_level === experienceFilter
      );
    }

    // Domain filter
    if (domainFilter) {
      filtered = filtered.filter(resume => 
        (resume.parsedData?.domains || []).includes(domainFilter)
      );
    }

    setFilteredResumes(filtered);
  }, [teamResumes, searchTerm, experienceFilter, domainFilter]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getExperienceColor = (level) => {
    const configs = {
      Beginner: 'bg-green-500/20 text-green-300 border-green-500/30',
      Intermediate: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      Advanced: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      Expert: 'bg-red-500/20 text-red-300 border-red-500/30'
    };
    return configs[level] || configs.Beginner;
  };

  const getExperienceIcon = (level) => {
    const icons = {
      Beginner: Star,
      Intermediate: TrendingUp,
      Advanced: Award,
      Expert: Zap
    };
    const IconComponent = icons[level] || Star;
    return <IconComponent size={14} />;
  };

  const getParseStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={16} className="text-green-400" />;
      case 'failed':
        return <AlertCircle size={16} className="text-red-400" />;
      case 'pending':
        return <Clock size={16} className="text-yellow-400" />;
      default:
        return <Clock size={16} className="text-gray-400" />;
    }
  };

  const getAllDomains = () => {
    const domains = new Set();
    teamResumes.forEach(resume => {
      (resume.parsedData?.domains || []).forEach(domain => domains.add(domain));
    });
    return Array.from(domains).sort();
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-slate-600 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-600/30 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Team Resumes</h2>
          <p className="text-slate-400">
            View and download resumes from your team members ({filteredResumes.length} found)
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-red-400" size={20} />
          <span className="text-red-300">{error}</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by name, file, or skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {/* Experience Filter */}
        <select
          value={experienceFilter}
          onChange={(e) => setExperienceFilter(e.target.value)}
          className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
        >
          <option value="">All Experience Levels</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
          <option value="Expert">Expert</option>
        </select>

        {/* Domain Filter */}
        <select
          value={domainFilter}
          onChange={(e) => setDomainFilter(e.target.value)}
          className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
        >
          <option value="">All Domains</option>
          {getAllDomains().map(domain => (
            <option key={domain} value={domain}>{domain}</option>
          ))}
        </select>

        {/* Clear Filters */}
        <button
          onClick={() => {
            setSearchTerm('');
            setExperienceFilter('');
            setDomainFilter('');
          }}
          className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <Filter size={16} />
          Clear Filters
        </button>
      </div>

      {/* Resume Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredResumes.map((resume) => (
          <div
            key={`${resume.memberId}-${resume.id}`}
            className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/50 hover:border-slate-500/50 transition-colors"
          >
            {/* Member Info */}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center">
                <User className="text-slate-300" size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-white">{resume.memberName}</h3>
                <p className="text-sm text-slate-400">{resume.memberEmail}</p>
              </div>
              <div className="ml-auto">
                {getParseStatusIcon(resume.parseStatus)}
              </div>
            </div>

            {/* File Info */}
            <div className="flex items-center gap-3 p-3 bg-slate-600/30 rounded-lg mb-4">
              <FileText className="text-blue-400" size={20} />
              <div className="flex-1">
                <h4 className="font-medium text-white text-sm">{resume.fileName}</h4>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar size={10} />
                    {new Date(resume.uploadedAt.seconds * 1000).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <HardDrive size={10} />
                    {formatFileSize(resume.fileSize)}
                  </span>
                </div>
              </div>
            </div>

            {/* Parsed Data Preview */}
            {resume.parsedData && (
              <div className="space-y-3 mb-4">
                {/* Experience Level */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">Experience:</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${getExperienceColor(resume.parsedData.experience_level)}`}>
                    {getExperienceIcon(resume.parsedData.experience_level)}
                    <span className="ml-1">{resume.parsedData.experience_level || 'Beginner'}</span>
                  </span>
                </div>

                {/* Top Skills */}
                {resume.parsedData.skills && resume.parsedData.skills.length > 0 && (
                  <div>
                    <span className="text-sm text-slate-400 block mb-2">
                      Top Skills ({resume.parsedData.skills.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {resume.parsedData.skills.slice(0, 6).map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                      {resume.parsedData.skills.length > 6 && (
                        <span className="px-2 py-1 bg-slate-500/20 text-slate-400 rounded text-xs">
                          +{resume.parsedData.skills.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Domains */}
                {resume.parsedData.domains && resume.parsedData.domains.length > 0 && (
                  <div>
                    <span className="text-sm text-slate-400 block mb-2">Domains:</span>
                    <div className="flex flex-wrap gap-1">
                      {resume.parsedData.domains.map((domain, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs"
                        >
                          {domain}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => window.open(resume.downloadURL, '_blank')}
                className="flex-1 px-4 py-2 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center justify-center gap-2"
              >
                <Eye size={14} />
                View
              </button>
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = resume.downloadURL;
                  link.download = resume.fileName;
                  link.click();
                }}
                className="flex-1 px-4 py-2 bg-green-500/20 text-green-300 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors flex items-center justify-center gap-2"
              >
                <Download size={14} />
                Download
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredResumes.length === 0 && !loading && (
        <div className="text-center py-12">
          <FileText className="text-slate-500 mx-auto mb-4" size={48} />
          <h3 className="text-lg font-medium text-slate-300 mb-2">
            {teamResumes.length === 0 ? 'No Team Resumes Found' : 'No Resumes Match Your Filters'}
          </h3>
          <p className="text-slate-500">
            {teamResumes.length === 0 
              ? 'Team members haven\'t uploaded any resumes yet.'
              : 'Try adjusting your search criteria or clearing filters.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default TeamResumeViewer;
