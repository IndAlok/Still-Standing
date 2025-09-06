import React, { memo } from 'react';
import { Plus, UserPlus, Mail, User } from 'lucide-react';

const iconMap = {
  "Create Group": Plus,
  "Join Group": UserPlus,
  "Invitations": Mail,
  "View Profile": User
};

const QuickActionsGrid = memo(({ actions }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((action, index) => {
        const IconComponent = iconMap[action.title] || Plus;
        
        return (
          <button
            key={index}
            onClick={action.onClick}
            className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6 text-left hover:bg-white/10 transition-all duration-200 hover:scale-[1.02] group"
          >
            <div
              className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}
            >
              <IconComponent className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-white font-semibold mb-2">
              {action.title}
            </h4>
            <p className="text-gray-400 text-sm">{action.description}</p>
          </button>
        );
      })}
    </div>
  );
});

QuickActionsGrid.displayName = 'QuickActionsGrid';

export default QuickActionsGrid;
