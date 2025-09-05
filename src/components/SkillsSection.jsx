import React, { useState, useMemo } from 'react';
import { Check, Plus, X, Code, Monitor, Server, Brain } from 'lucide-react';

const SkillsSection = ({ teamPreferences = {}, skillOptions = {}, onUpdate, updating = false }) => {
  const [selectedDomain, setSelectedDomain] = useState('frontend');
  const [customSkill, setCustomSkill] = useState('');
  const [showAddSkill, setShowAddSkill] = useState(false);

  // Domain configurations
  const domainConfigs = useMemo(() => ({
    frontend: { 
      color: 'blue', 
      icon: Monitor, 
      name: 'Frontend Development',
      description: 'UI/UX, frameworks, and client-side technologies'
    },
    backend: { 
      color: 'emerald', 
      icon: Server, 
      name: 'Backend Development',
      description: 'Server-side logic, databases, and APIs'
    },
    aiml: { 
      color: 'purple', 
      icon: Brain, 
      name: 'AI/ML & Data Science',
      description: 'Machine learning, AI, and data analysis'
    }
  }), []);

  const handleSkillToggle = (domain, skill) => {
    const currentSkills = teamPreferences[domain] || [];
    const updatedSkills = currentSkills.includes(skill)
      ? currentSkills.filter(s => s !== skill)
      : [...currentSkills, skill];
    
    const updatedPreferences = {
      ...teamPreferences,
      [domain]: updatedSkills
    };

    onUpdate(updatedPreferences);
  };

  const handleAddCustomSkill = (domain) => {
    if (!customSkill.trim()) return;

    const currentSkills = teamPreferences[domain] || [];
    if (currentSkills.includes(customSkill.trim())) {
      setCustomSkill('');
      return;
    }

    const updatedSkills = [...currentSkills, customSkill.trim()];
    const updatedPreferences = {
      ...teamPreferences,
      [domain]: updatedSkills
    };

    onUpdate(updatedPreferences);
    setCustomSkill('');
    setShowAddSkill(false);
  };

  const getColorClasses = (color, selected = false) => {
    const baseClasses = {
      blue: selected 
        ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' 
        : 'bg-slate-600/30 text-slate-300 border-slate-500/30 hover:bg-blue-500/10 hover:border-blue-500/20',
      emerald: selected 
        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
        : 'bg-slate-600/30 text-slate-300 border-slate-500/30 hover:bg-emerald-500/10 hover:border-emerald-500/20',
      purple: selected 
        ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' 
        : 'bg-slate-600/30 text-slate-300 border-slate-500/30 hover:bg-purple-500/10 hover:border-purple-500/20'
    };
    return baseClasses[color];
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Skills & Team Preferences</h2>
        <p className="text-slate-400">
          Select your preferred technologies and skills to help match you with relevant projects and teams.
        </p>
      </div>

      {/* Domain Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {Object.entries(domainConfigs).map(([domain, config]) => {
          const IconComponent = config.icon;
          const isSelected = selectedDomain === domain;
          
          return (
            <button
              key={domain}
              onClick={() => setSelectedDomain(domain)}
              className={`p-6 rounded-xl border transition-all duration-200 text-left ${
                isSelected 
                  ? getColorClasses(config.color, true)
                  : 'bg-slate-700/30 border-slate-600/50 text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <IconComponent size={24} />
                <h3 className="font-semibold text-lg">{config.name}</h3>
              </div>
              <p className="text-sm opacity-80">{config.description}</p>
              <div className="mt-3 text-xs">
                {(teamPreferences[domain] || []).length} skills selected
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Domain Skills */}
      <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/50">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            {React.createElement(domainConfigs[selectedDomain].icon, { size: 20 })}
            {domainConfigs[selectedDomain].name}
          </h3>
          <button
            onClick={() => setShowAddSkill(!showAddSkill)}
            className="text-cyan-400 hover:text-cyan-300 flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            Add Custom Skill
          </button>
        </div>

        {/* Add Custom Skill Input */}
        {showAddSkill && (
          <div className="mb-6 p-4 bg-slate-600/30 rounded-lg border border-slate-500/30">
            <div className="flex gap-2">
              <input
                type="text"
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                placeholder="Enter custom skill..."
                className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500/50"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddCustomSkill(selectedDomain);
                  }
                }}
              />
              <button
                onClick={() => handleAddCustomSkill(selectedDomain)}
                className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                disabled={!customSkill.trim() || updating}
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddSkill(false);
                  setCustomSkill('');
                }}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Skills Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* Predefined Skills */}
          {(skillOptions[selectedDomain] || []).map((skill) => {
            const isSelected = (teamPreferences[selectedDomain] || []).includes(skill);
            const config = domainConfigs[selectedDomain];
            
            return (
              <button
                key={skill}
                onClick={() => handleSkillToggle(selectedDomain, skill)}
                disabled={updating}
                className={`px-4 py-3 rounded-lg text-sm font-medium border transition-all duration-200 flex items-center justify-between ${
                  getColorClasses(config.color, isSelected)
                } ${updating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span>{skill}</span>
                {isSelected && <Check size={14} />}
              </button>
            );
          })}

          {/* Custom Skills */}
          {(teamPreferences[selectedDomain] || [])
            .filter(skill => !(skillOptions[selectedDomain] || []).includes(skill))
            .map((skill) => {
              const config = domainConfigs[selectedDomain];
              
              return (
                <button
                  key={skill}
                  onClick={() => handleSkillToggle(selectedDomain, skill)}
                  disabled={updating}
                  className={`px-4 py-3 rounded-lg text-sm font-medium border transition-all duration-200 flex items-center justify-between ${
                    getColorClasses(config.color, true)
                  } ${updating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ring-2 ring-cyan-500/30`}
                >
                  <span>{skill}</span>
                  <Check size={14} />
                </button>
              );
            })}
        </div>

        {/* Empty State */}
        {(!teamPreferences[selectedDomain] || teamPreferences[selectedDomain].length === 0) && (
          <div className="text-center py-12 text-slate-400">
            <Code size={48} className="mx-auto mb-4 opacity-50" />
            <p>No skills selected in {domainConfigs[selectedDomain].name}</p>
            <p className="text-sm mt-1">Click on skills above to add them to your preferences</p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/50">
        <h3 className="text-lg font-semibold text-white mb-4">Skills Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(domainConfigs).map(([domain, config]) => {
            const skills = teamPreferences[domain] || [];
            const IconComponent = config.icon;
            
            return (
              <div key={domain} className="p-4 bg-slate-600/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <IconComponent size={16} />
                  <span className="font-medium text-white">{config.name}</span>
                </div>
                <div className="text-sm text-slate-400">
                  {skills.length} skill{skills.length !== 1 ? 's' : ''} selected
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {skills.slice(0, 3).map(skill => (
                    <span key={skill} className="px-2 py-1 bg-slate-700/50 rounded text-xs text-slate-300">
                      {skill}
                    </span>
                  ))}
                  {skills.length > 3 && (
                    <span className="px-2 py-1 bg-slate-700/50 rounded text-xs text-slate-300">
                      +{skills.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SkillsSection;
