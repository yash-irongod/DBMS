import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Bed, Bath, Maximize2, ShieldCheck, Sparkles } from 'lucide-react';
import { Listing } from '../types';
import { ListingStatusBadge } from './Badge';
import { useAuth } from '../context/AuthContext';

interface ListingCardProps {
  listing: Listing;
  onToggleSave?: (id: number) => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing, onToggleSave }) => {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState<boolean>(Boolean(listing.is_saved));
  const [saving, setSaving] = useState<boolean>(false);

  const handleSaveClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      alert('Please log in to save listings.');
      return;
    }
    setSaving(true);
    try {
      setIsSaved(!isSaved);
      if (onToggleSave) {
        onToggleSave(listing.listing_id);
      }
    } finally {
      setSaving(false);
    }
  };

  // Curated architectural style gradient based on city / listing kind
  const getCardBg = () => {
    if (listing.city_name === 'Mumbai') return 'from-teal-900 to-emerald-950';
    if (listing.city_name === 'Pune') return 'from-amber-950 to-stone-900';
    return 'from-forest-900 to-charcoal-900';
  };

  const formatKind = (kind: string) => {
    switch (kind) {
      case 'entire_unit': return 'Entire Apartment';
      case 'private_room': return 'Private Room';
      case 'shared_room': return 'Shared Room';
      case 'pg_hostel': return 'PG / Hostel';
      default: return 'Rental Unit';
    }
  };

  const formatFurnishing = (status: string) => {
    switch (status) {
      case 'furnished': return 'Furnished';
      case 'semi_furnished': return 'Semi-Furnished';
      case 'unfurnished': return 'Unfurnished';
      default: return 'Furnishing Unspecified';
    }
  };

  return (
    <Link
      to={`/listings/${listing.listing_id}`}
      className="group bg-white rounded-2xl border border-cream-200 overflow-hidden shadow-subtle hover:shadow-premium transition-all duration-300 flex flex-col hover:-translate-y-1"
    >
      {/* Visual Header / Image Placeholder */}
      <div className={`relative h-48 bg-gradient-to-br ${getCardBg()} p-5 flex flex-col justify-between overflow-hidden`}>
        {/* Subtle architectural geometric pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="flex items-start justify-between z-10">
          <div className="flex flex-wrap gap-1.5 max-w-[80%]">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/90 text-charcoal-800 backdrop-blur-xs shadow-xs">
              {formatKind(listing.listing_kind)}
            </span>
            {listing.data_origin === 'user_submitted' && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-forest-500 text-white flex items-center gap-1 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified
              </span>
            )}
          </div>

          {/* Bookmark Button */}
          <button
            onClick={handleSaveClick}
            disabled={saving}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              isSaved
                ? 'bg-rose-50 text-rose-600 shadow-sm'
                : 'bg-white/80 hover:bg-white text-charcoal-700 hover:text-rose-600 backdrop-blur-xs'
            }`}
            title={isSaved ? 'Remove from saved' : 'Save listing'}
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-600 text-rose-600' : ''}`} />
          </button>
        </div>

        {/* Price Tag in Image Banner */}
        <div className="z-10">
          <div className="text-white drop-shadow-sm">
            <span className="text-2xl font-extrabold tracking-tight">₹{Number(listing.rent_amount).toLocaleString('en-IN')}</span>
            <span className="text-xs font-medium text-cream-200/90 ml-1">/ month</span>
          </div>
          <p className="text-xs text-cream-200/80 font-medium truncate mt-0.5">{listing.locality_name}, {listing.city_name}</p>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* Status Badge */}
          <div className="mb-2.5">
            <ListingStatusBadge
              dataOrigin={listing.data_origin}
              availabilityStatus={listing.availability_status}
            />
          </div>

          {/* Title */}
          <h3 className="font-bold text-charcoal-900 group-hover:text-forest-800 transition-colors line-clamp-1 text-base">
            {listing.title}
          </h3>

          {/* Location */}
          <p className="text-xs text-charcoal-500 flex items-center gap-1 mt-1 truncate">
            <MapPin className="w-3.5 h-3.5 text-forest-600 flex-shrink-0" />
            <span>{listing.locality_name}, {listing.city_name}</span>
          </p>
        </div>

        {/* Property Specs Pill Bar */}
        <div className="pt-3 border-t border-cream-200 grid grid-cols-3 gap-2 text-charcoal-600 text-xs">
          <div className="flex items-center gap-1.5" title="Bedrooms">
            <Bed className="w-3.5 h-3.5 text-charcoal-400" />
            <span className="font-medium">{listing.bedrooms !== null ? `${listing.bedrooms} BHK` : 'Studio/Room'}</span>
          </div>
          <div className="flex items-center gap-1.5" title="Bathrooms">
            <Bath className="w-3.5 h-3.5 text-charcoal-400" />
            <span className="font-medium">{listing.bathrooms ? `${listing.bathrooms} Bath` : 'Shared'}</span>
          </div>
          <div className="flex items-center gap-1.5" title="Size">
            <Maximize2 className="w-3.5 h-3.5 text-charcoal-400" />
            <span className="font-medium truncate">{listing.size_sqft ? `${Math.round(listing.size_sqft)} sqft` : formatFurnishing(listing.furnishing_status)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};
