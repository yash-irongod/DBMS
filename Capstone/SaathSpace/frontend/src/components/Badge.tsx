import React from 'react';
import { ShieldCheck, AlertCircle, Clock, CheckCircle2, XCircle } from 'lucide-react';

interface BadgeProps {
  variant?: 'verified' | 'unverified' | 'pending' | 'accepted' | 'declined' | 'neutral' | 'accent';
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ 
  variant = 'neutral', 
  children, 
  className = '', 
  size = 'md' 
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  const variantStyles = {
    verified: 'bg-forest-100 text-forest-800 border border-forest-300',
    unverified: 'bg-amber-50 text-amber-900 border border-amber-300',
    pending: 'bg-blue-50 text-blue-800 border border-blue-200',
    accepted: 'bg-emerald-50 text-emerald-800 border border-emerald-300',
    declined: 'bg-rose-50 text-rose-800 border border-rose-200',
    neutral: 'bg-cream-200 text-charcoal-700 border border-cream-300',
    accent: 'bg-forest-800 text-white border border-forest-900',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ${sizeClasses} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};

export const ListingStatusBadge: React.FC<{ 
  dataOrigin: string; 
  availabilityStatus: string;
  className?: string;
}> = ({ dataOrigin, availabilityStatus, className = '' }) => {
  if (dataOrigin === 'public_dataset') {
    return (
      <Badge variant="unverified" className={className}>
        <AlertCircle className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
        <span>Historical listing — availability not verified</span>
      </Badge>
    );
  }

  if (availabilityStatus === 'available') {
    return (
      <Badge variant="verified" className={className}>
        <ShieldCheck className="w-3.5 h-3.5 text-forest-700 flex-shrink-0" />
        <span>Verified & Available</span>
      </Badge>
    );
  }

  if (availabilityStatus === 'reserved') {
    return (
      <Badge variant="pending" className={className}>
        <Clock className="w-3.5 h-3.5 text-blue-700 flex-shrink-0" />
        <span>Reserved</span>
      </Badge>
    );
  }

  return (
    <Badge variant="neutral" className={className}>
      <XCircle className="w-3.5 h-3.5 text-charcoal-500 flex-shrink-0" />
      <span className="capitalize">{availabilityStatus}</span>
    </Badge>
  );
};
