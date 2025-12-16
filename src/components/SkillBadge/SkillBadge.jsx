import React from 'react';
import { Award, Star, CheckCircle, TrendingUp } from 'lucide-react';

const LEVEL_COLORS = {
  beginner: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' },
  intermediate: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  advanced: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  expert: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' }
};

const CATEGORY_COLORS = {
  technical: 'from-blue-500 to-cyan-500',
  design: 'from-pink-500 to-rose-500',
  soft: 'from-green-500 to-emerald-500',
  business: 'from-amber-500 to-orange-500',
  languages: 'from-purple-500 to-indigo-500'
};

const SkillBadge = ({ 
  skill, 
  size = 'medium', 
  showLevel = true, 
  showEndorsements = true,
  showCategory = false,
  onClick,
  onEndorse,
  canEndorse = false,
  isOwn = false
}) => {
  const { name, level = 'intermediate', category = 'technical', endorsementCount = 0, verified = false } = skill;
  const colors = LEVEL_COLORS[level] || LEVEL_COLORS.intermediate;
  const gradient = CATEGORY_COLORS[category] || CATEGORY_COLORS.technical;

  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-1.5 text-sm',
    large: 'px-4 py-2 text-base'
  };

  return (
    <div
      onClick={onClick}
      className={`
        inline-flex items-center gap-2 rounded-full border
        ${colors.bg} ${colors.border} ${colors.text}
        ${sizeClasses[size]}
        ${onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''}
      `}
    >
      {showCategory && (
        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${gradient}`} />
      )}
      
      <span className="font-medium">{name}</span>
      
      {verified && (
        <CheckCircle className="w-3.5 h-3.5 text-blue-400" title="Verified skill" />
      )}
      
      {showLevel && (
        <span className={`text-xs opacity-70 capitalize`}>
          {level}
        </span>
      )}
      
      {showEndorsements && endorsementCount > 0 && (
        <div className="flex items-center gap-1 bg-white/10 rounded-full px-1.5 py-0.5">
          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
          <span className="text-xs">{endorsementCount}</span>
        </div>
      )}
      
      {canEndorse && !isOwn && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEndorse?.(skill);
          }}
          className="ml-1 p-1 hover:bg-white/20 rounded-full transition-colors"
          title="Endorse this skill"
        >
          <TrendingUp className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

export const SkillBadgeGroup = ({ skills, maxVisible = 5, size = 'medium', ...props }) => {
  const visibleSkills = skills?.slice(0, maxVisible) || [];
  const remainingCount = (skills?.length || 0) - maxVisible;

  return (
    <div className="flex flex-wrap gap-2">
      {visibleSkills.map((skill, idx) => (
        <SkillBadge key={skill.id || idx} skill={skill} size={size} {...props} />
      ))}
      {remainingCount > 0 && (
        <span className={`
          inline-flex items-center rounded-full bg-white/10 text-gray-400
          ${size === 'small' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'}
        `}>
          +{remainingCount} more
        </span>
      )}
    </div>
  );
};

export const SkillLevelIndicator = ({ level }) => {
  const levels = ['beginner', 'intermediate', 'advanced', 'expert'];
  const currentIndex = levels.indexOf(level);

  return (
    <div className="flex gap-1">
      {levels.map((l, idx) => (
        <div
          key={l}
          className={`w-2 h-2 rounded-full ${
            idx <= currentIndex ? 'bg-purple-500' : 'bg-gray-600'
          }`}
          title={l}
        />
      ))}
    </div>
  );
};

export default SkillBadge;
