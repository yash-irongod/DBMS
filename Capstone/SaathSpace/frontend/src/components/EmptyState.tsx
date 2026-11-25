import React from 'react';
import { SearchX } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  icon = <SearchX className="w-10 h-10 text-charcoal-400 stroke-[1.5]" />
}) => {
  return (
    <div className="bg-white border border-cream-200 rounded-2xl p-10 text-center max-w-md mx-auto my-8 shadow-subtle">
      <div className="w-16 h-16 bg-cream-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-cream-200">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-charcoal-900 mb-2">{title}</h3>
      <p className="text-sm text-charcoal-600 mb-6 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center justify-center px-4 py-2 bg-forest-800 hover:bg-forest-900 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
