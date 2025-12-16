import React from 'react';
import { User, Sparkles, ArrowRight, MapPin, Clock, CheckCircle2 } from 'lucide-react';
import SkillBadge, { SkillBadgeGroup } from '../SkillBadge/SkillBadge';

const MatchCard = ({ 
  user, 
  score, 
  breakdown, 
  details,
  onViewProfile, 
  onConnect,
  compact = false 
}) => {
  const getScoreColor = (score) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-blue-500 to-cyan-500';
    if (score >= 40) return 'from-yellow-500 to-amber-500';
    return 'from-gray-500 to-gray-600';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Great Match';
    if (score >= 40) return 'Good Match';
    return 'Potential Match';
  };

  if (compact) {
    return (
      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all cursor-pointer group"
        onClick={() => onViewProfile?.(user.id)}
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            {user.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user.displayName}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
            )}
            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-r ${getScoreColor(score)} flex items-center justify-center`}>
              <span className="text-white text-xs font-bold">{score}</span>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-medium truncate">{user.displayName}</h4>
            <p className="text-gray-400 text-sm truncate">{user.bio || 'No bio'}</p>
          </div>
          
          <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/30 transition-all">
      <div className={`h-2 bg-gradient-to-r ${getScoreColor(score)}`} />
      
      <div className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="relative">
            {user.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user.displayName}
                className="w-16 h-16 rounded-xl object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-white">{user.displayName}</h3>
              {user.verified && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
            </div>
            <p className="text-gray-400 text-sm line-clamp-2">{user.bio || 'No bio available'}</p>
            
            <div className="flex items-center gap-4 mt-2 text-gray-500 text-xs">
              {user.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {user.location}
                </span>
              )}
              {user.availability?.status && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {user.availability.status}
                </span>
              )}
            </div>
          </div>
          
          <div className="text-center">
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${getScoreColor(score)} flex items-center justify-center`}>
              <span className="text-2xl font-bold text-white">{score}</span>
            </div>
            <span className="text-xs text-gray-400 mt-1 block">{getScoreLabel(score)}</span>
          </div>
        </div>

        {breakdown && (
          <div className="mb-4 p-3 bg-white/5 rounded-xl">
            <h4 className="text-xs text-gray-500 uppercase tracking-wide mb-2">Match Breakdown</h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-purple-400 font-semibold">{breakdown.complementary}</span>
                <p className="text-xs text-gray-500">Complementary</p>
              </div>
              <div>
                <span className="text-blue-400 font-semibold">{breakdown.overlap}</span>
                <p className="text-xs text-gray-500">Overlap</p>
              </div>
              <div>
                <span className="text-green-400 font-semibold">{breakdown.diversity}</span>
                <p className="text-xs text-gray-500">Diversity</p>
              </div>
            </div>
          </div>
        )}

        {user.skills?.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs text-gray-500 uppercase tracking-wide mb-2">Skills</h4>
            <SkillBadgeGroup skills={user.skills} maxVisible={4} size="small" showLevel={false} />
          </div>
        )}

        {details?.complementarySkills?.length > 0 && (
          <div className="mb-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300">Complementary Skills</span>
            </div>
            <p className="text-xs text-gray-400">
              {details.complementarySkills.slice(0, 3).join(', ')}
              {details.complementarySkills.length > 3 && ` +${details.complementarySkills.length - 3} more`}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => onViewProfile?.(user.id)}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-xl font-medium transition-colors"
          >
            View Profile
          </button>
          <button
            onClick={() => onConnect?.(user.id)}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white py-2.5 rounded-xl font-medium transition-opacity"
          >
            Connect
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchCard;
