import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { matchingService } from '../../services/matchingService';
import { geminiService } from '../../services/geminiService';
import { skillService } from '../../services/skillService';
import crewConnectService from '../../services/crewConnectService';
import MatchCard from '../../components/MatchCard/MatchCard';
import AIChat from '../../components/AIChat/AIChat';
import {
  ArrowLeft,
  Users,
  Sparkles,
  Target,
  AlertTriangle,
  CheckCircle,
  Plus,
  X,
  Loader2,
  Zap,
  Brain,
  UserPlus,
  BarChart3,
  Bot
} from 'lucide-react';

const TeamBuilder = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [requiredSkills, setRequiredSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [teamSize, setTeamSize] = useState(4);
  const [suggestions, setSuggestions] = useState(null);
  const [matches, setMatches] = useState([]);
  const [skillGapAnalysis, setSkillGapAnalysis] = useState(null);
  const [showAIChat, setShowAIChat] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);

  const skillCategories = skillService.getSkillCategories();
  const allSkills = skillService.getAllSkills();

  const handleAddSkill = () => {
    if (skillInput.trim() && !requiredSkills.includes(skillInput.trim())) {
      setRequiredSkills([...requiredSkills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill) => {
    setRequiredSkills(requiredSkills.filter(s => s !== skill));
  };

  const handleFindMatches = async () => {
    setLoading(true);
    try {
      const matchResults = await matchingService.findBestMatches(currentUser.uid, {
        limit: 20,
        minScore: 30
      });
      setMatches(matchResults);
      setStep(2);
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeTeam = async () => {
    if (selectedMembers.length === 0) return;
    
    setLoading(true);
    try {
      const analysis = await matchingService.analyzeTeamSkillGaps(
        selectedMembers,
        requiredSkills
      );
      setSkillGapAnalysis(analysis);
      setStep(3);
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  const handleAISuggest = async () => {
    setLoading(true);
    try {
      const projectRequirements = {
        name: projectName,
        description: projectDescription,
        skills: requiredSkills,
        teamSize
      };

      const userIds = matches.map(m => m.user.id);
      const result = await matchingService.suggestOptimalTeam(
        projectRequirements,
        userIds,
        teamSize
      );
      
      setSuggestions(result);
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMember = (user) => {
    if (selectedMembers.find(m => m.id === user.id)) {
      setSelectedMembers(selectedMembers.filter(m => m.id !== user.id));
    } else if (selectedMembers.length < teamSize) {
      setSelectedMembers([...selectedMembers, user]);
    }
  };

  const handleInviteSelected = async () => {
    setLoading(true);
    try {
      const crew = await crewConnectService.createCrew(
        projectName || 'New Project Team',
        projectDescription || 'Team created via TeamBuilder',
        false
      );

      for (const member of selectedMembers) {
        await crewConnectService.sendInvitation(crew.id, member.email, 'member', 
          `You've been invited to join ${projectName || 'a new project team'}!`
        );
      }

      navigate(`/chat/${crew.id}`);
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="text-gray-400 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent flex items-center gap-2">
                <Brain className="w-6 h-6 text-purple-400" />
                AI Team Builder
              </h1>
            </div>
            <button
              onClick={() => setShowAIChat(!showAIChat)}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 rounded-lg text-white hover:opacity-90 transition-opacity"
            >
              <Bot className="w-4 h-4" />
              Ask CrewBot
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full ${
                step >= s ? 'bg-gradient-to-r from-purple-500 to-blue-500' : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-400" />
                Define Your Project
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Project Name</label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="My awesome project..."
                    className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Project Description</label>
                  <textarea
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="Describe what you're building..."
                    rows={3}
                    className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Required Skills</label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                      placeholder="Add a skill..."
                      className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      list="skill-suggestions"
                    />
                    <datalist id="skill-suggestions">
                      {allSkills.slice(0, 20).map(s => (
                        <option key={s.name} value={s.name} />
                      ))}
                    </datalist>
                    <button
                      onClick={handleAddSkill}
                      className="bg-purple-600 hover:bg-purple-500 text-white px-4 rounded-xl transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {requiredSkills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm"
                      >
                        {skill}
                        <button onClick={() => handleRemoveSkill(skill)}>
                          <X className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Team Size: {teamSize}</label>
                  <input
                    type="range"
                    min="2"
                    max="10"
                    value={teamSize}
                    onChange={(e) => setTeamSize(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleFindMatches}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
              Find Matching Teammates
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Select Team Members ({selectedMembers.length}/{teamSize})
              </h2>
              <button
                onClick={handleAISuggest}
                disabled={loading}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 rounded-lg text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                AI Suggest
              </button>
            </div>

            {suggestions && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                <h3 className="text-amber-400 font-semibold flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4" />
                  AI Recommendation (Score: {suggestions.overallFitScore}/100)
                </h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400 mb-1">Team Strengths:</p>
                    <ul className="text-green-400">
                      {suggestions.teamStrengths?.map((s, i) => (
                        <li key={i}>• {s}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Potential Challenges:</p>
                    <ul className="text-amber-400">
                      {suggestions.potentialChallenges?.map((c, i) => (
                        <li key={i}>• {c}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              {matches.map((match) => (
                <div
                  key={match.user.id}
                  className={`cursor-pointer transition-all ${
                    selectedMembers.find(m => m.id === match.user.id)
                      ? 'ring-2 ring-purple-500 rounded-2xl'
                      : ''
                  }`}
                  onClick={() => handleSelectMember(match.user)}
                >
                  <MatchCard
                    user={match.user}
                    score={match.score}
                    breakdown={match.breakdown}
                    details={match.details}
                    compact
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-white/10 text-white py-3 rounded-xl font-medium hover:bg-white/20 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleAnalyzeTeam}
                disabled={selectedMembers.length === 0 || loading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <BarChart3 className="w-5 h-5" />}
                Analyze Team
              </button>
            </div>
          </div>
        )}

        {step === 3 && skillGapAnalysis && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-400" />
              Team Analysis
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 text-center">
                <div className="text-4xl font-bold text-white mb-2">
                  {skillGapAnalysis.coveragePercentage}%
                </div>
                <p className="text-gray-400">Skill Coverage</p>
              </div>
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 text-center">
                <div className="text-4xl font-bold text-green-400 mb-2">
                  {requiredSkills.length - skillGapAnalysis.missingSkills.length}
                </div>
                <p className="text-gray-400">Skills Covered</p>
              </div>
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 text-center">
                <div className="text-4xl font-bold text-amber-400 mb-2">
                  {skillGapAnalysis.missingSkills.length}
                </div>
                <p className="text-gray-400">Gaps to Fill</p>
              </div>
            </div>

            {skillGapAnalysis.recommendations.map((rec, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl border ${
                  rec.type === 'critical' ? 'bg-red-500/10 border-red-500/30' :
                  rec.type === 'improvement' ? 'bg-amber-500/10 border-amber-500/30' :
                  'bg-green-500/10 border-green-500/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  {rec.type === 'critical' ? (
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  ) : rec.type === 'improvement' ? (
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  )}
                  <p className={`${
                    rec.type === 'critical' ? 'text-red-300' :
                    rec.type === 'improvement' ? 'text-amber-300' :
                    'text-green-300'
                  }`}>{rec.message}</p>
                </div>
              </div>
            ))}

            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Selected Team</h3>
              <div className="flex flex-wrap gap-3">
                {selectedMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
                    {member.profilePicture ? (
                      <img src={member.profilePicture} alt="" className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <span className="text-white">{member.displayName}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-white/10 text-white py-3 rounded-xl font-medium hover:bg-white/20 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleInviteSelected}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                Create Team & Invite
              </button>
            </div>
          </div>
        )}
      </div>

      {showAIChat && (
        <AIChat
          crewName="Team Builder"
          onClose={() => setShowAIChat(false)}
          isMinimized={false}
          onToggleMinimize={() => {}}
        />
      )}
    </div>
  );
};

export default TeamBuilder;
