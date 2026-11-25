import React from 'react';

export const LoadingSpinner: React.FC<{ message?: string; className?: string }> = ({ 
  message = 'Loading properties and matches...', 
  className = '' 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}>
      <div className="relative w-12 h-12 mb-4">
        <div className="absolute inset-0 rounded-full border-3 border-cream-200"></div>
        <div className="absolute inset-0 rounded-full border-3 border-forest-600 border-t-transparent animate-spin"></div>
      </div>
      <p className="text-sm font-medium text-charcoal-600">{message}</p>
    </div>
  );
};
