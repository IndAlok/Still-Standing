import React, { memo } from 'react';
import { Users, MessageCircle, Activity, TrendingUp } from 'lucide-react';

const iconMap = {
  'text-blue-500': Users,
  'text-green-500': MessageCircle,
  'text-purple-500': Activity,
  'text-orange-500': TrendingUp
};

const StatCard = memo(({ title, value, color, trend }) => {
  const IconComponent = iconMap[color] || Users;
  
  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <div className="flex items-center space-x-2 mt-2">
            <p className="text-2xl font-bold text-white">{value}</p>
          </div>
          {trend && (
            <p className="text-gray-400 text-xs mt-1">{trend}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl bg-opacity-10 ${color.replace('text-', 'bg-').replace('-500', '-500/10')}`}>
          <IconComponent className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );
});

StatCard.displayName = 'StatCard';

export default StatCard;
