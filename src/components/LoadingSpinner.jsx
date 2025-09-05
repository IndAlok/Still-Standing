import React from 'react';

const LoadingSpinner = ({ size = 'default', message = 'Loading...' }) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    default: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className={`${sizeClasses[size]} border-4 border-white/20 border-t-purple-500 rounded-full animate-spin`}></div>
        </div>
        <p className="text-white/70 text-lg">{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
