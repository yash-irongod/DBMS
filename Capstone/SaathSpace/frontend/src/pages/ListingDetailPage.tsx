import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Heart, Bed, Bath, Maximize2, ShieldCheck, 
  AlertCircle, Sparkles, Send, CheckCircle2, User, Database, Building2
} from 'lucide-react';
import { api } from '../services/api';
import { Listing } from '../types';
import { ListingStatusBadge } from '../components/Badge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

export const ListingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Save state
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [saveCount, setSaveCount] = useState<number>(0);

  // Enquiry state
  const [enquiryMessage, setEnquiryMessage] = useState<string>('');
  const [enquirySubmitting, setEnquirySubmitting] = useState<boolean>(false);
  const [enquirySuccess, setEnquirySuccess] = useState<boolean>(false);
  const [enquiryError, setEnquiryError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.getListingDetails(parseInt(id, 10))
      .then((data) => {
        setListing(data.listing);
        setIsSaved(Boolean(data.listing.is_saved));
        setSaveCount(data.listing.save_count || 0);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleToggleSave = async () => {
    if (!user) {
      alert('Please log in to save listings.');
      return;
    }
    if (!listing) return;

    try {
      const res = await api.toggleSaveListing(listing.listing_id);
      setIsSaved(res.is_saved);
      setSaveCount(prev => res.is_saved ? prev + 1 : Math.max(0, prev - 1));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please log in to submit an enquiry.');
      navigate('/login');
      return;
    }
    if (!listing || !enquiryMessage.trim()) return;

    setEnquirySubmitting(true);
    setEnquiryError(null);
    try {
      await api.submitEnquiry(listing.listing_id, enquiryMessage.trim());
      setEnquirySuccess(true);
      setEnquiryMessage('');
    } catch (err: any) {
      setEnquiryError(err.message);
    } finally {
      setEnquirySubmitting(false);
    }
  };

  if (loading) return <div className="py-20"><LoadingSpinner message="Loading listing details..." /></div>;
  if (error || !listing) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-charcoal-900 mb-2">Listing Not Found</h2>
        <p className="text-sm text-charcoal-600 mb-6">{error || 'The requested listing does not exist in the database.'}</p>
        <Link to="/listings" className="px-5 py-2.5 bg-forest-800 text-white rounded-xl text-sm font-bold">
          Back to Listings
        </Link>
      </div>
    );
  }

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
      default: return 'Unspecified';
    }
  };

  const amenitiesList = Array.isArray(listing.amenities)
    ? listing.amenities.map(a => typeof a === 'string' ? a : a.amenity_name)
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Back button & Action row */}
      <div className="flex items-center justify-between">
        <Link
          to="/listings"
          className="inline-flex items-center gap-2 text-sm font-bold text-charcoal-600 hover:text-forest-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Discovery</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleSave}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              isSaved
                ? 'bg-rose-50 text-rose-700 border-rose-300'
                : 'bg-white text-charcoal-700 border-cream-300 hover:bg-cream-100'
            }`}
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-600 text-rose-600' : ''}`} />
            <span>{isSaved ? 'Saved to Bookmarks' : 'Save Property'}</span>
            <span className="text-charcoal-400 font-normal">({saveCount})</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Details + Enquiry Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (2 Cols): Photo Hero & Property Information */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Architectural Banner */}
          <div className="bg-gradient-to-br from-forest-900 to-charcoal-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-elevated">
            <div className="absolute right-0 top-0 opacity-10 translate-x-10 -translate-y-10 pointer-events-none">
              <Building2 className="w-72 h-72 text-white" />
            </div>

            <div className="relative z-10 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 text-white backdrop-blur-xs">
                  {formatKind(listing.listing_kind)}
                </span>
                <ListingStatusBadge
                  dataOrigin={listing.data_origin}
                  availabilityStatus={listing.availability_status}
                  className="bg-white/90 text-charcoal-900 shadow-xs"
                />
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold font-serif tracking-tight leading-tight">
                {listing.title}
              </h1>

              <p className="text-sm text-cream-200/90 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-forest-300 flex-shrink-0" />
                <span>{listing.locality_name}, {listing.city_name}</span>
              </p>

              <div className="pt-4 border-t border-white/10 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold text-white">
                  ₹{Number(listing.rent_amount).toLocaleString('en-IN')}
                </span>
                <span className="text-sm font-medium text-cream-200/80">/ {listing.rent_period || 'month'}</span>
                {listing.security_deposit && (
                  <span className="text-xs text-cream-200/70 ml-3">
                    (Security Deposit: ₹{Number(listing.security_deposit).toLocaleString('en-IN')})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Key Specifications Grid */}
          <div className="bg-white rounded-3xl p-6 border border-cream-200 shadow-subtle grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-cream-50 rounded-2xl border border-cream-200/60">
              <Bed className="w-5 h-5 text-forest-700 mx-auto mb-1.5" />
              <span className="block text-[11px] font-bold uppercase tracking-wider text-charcoal-400">Bedrooms</span>
              <span className="text-sm font-bold text-charcoal-900">{listing.bedrooms !== null ? `${listing.bedrooms} BHK` : '1 Unit'}</span>
            </div>
            <div className="p-3 bg-cream-50 rounded-2xl border border-cream-200/60">
              <Bath className="w-5 h-5 text-forest-700 mx-auto mb-1.5" />
              <span className="block text-[11px] font-bold uppercase tracking-wider text-charcoal-400">Bathrooms</span>
              <span className="text-sm font-bold text-charcoal-900">{listing.bathrooms ? `${listing.bathrooms} Bath` : 'Shared'}</span>
            </div>
            <div className="p-3 bg-cream-50 rounded-2xl border border-cream-200/60">
              <Maximize2 className="w-5 h-5 text-forest-700 mx-auto mb-1.5" />
              <span className="block text-[11px] font-bold uppercase tracking-wider text-charcoal-400">Area</span>
              <span className="text-sm font-bold text-charcoal-900">{listing.size_sqft ? `${Math.round(listing.size_sqft)} sqft` : 'N/A'}</span>
            </div>
            <div className="p-3 bg-cream-50 rounded-2xl border border-cream-200/60">
              <Sparkles className="w-5 h-5 text-forest-700 mx-auto mb-1.5" />
              <span className="block text-[11px] font-bold uppercase tracking-wider text-charcoal-400">Furnishing</span>
              <span className="text-sm font-bold text-charcoal-900 truncate">{formatFurnishing(listing.furnishing_status)}</span>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-3xl p-8 border border-cream-200 shadow-subtle space-y-4">
            <h2 className="text-lg font-bold text-charcoal-900 font-serif">Property Description</h2>
            <div className="text-sm text-charcoal-700 leading-relaxed whitespace-pre-line">
              {listing.description || 'No detailed description provided for this listing.'}
            </div>
          </div>

          {/* Confirmed Amenities */}
          <div className="bg-white rounded-3xl p-8 border border-cream-200 shadow-subtle space-y-4">
            <h2 className="text-lg font-bold text-charcoal-900 font-serif">Confirmed Amenities</h2>
            {amenitiesList.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {amenitiesList.map((amenityName, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-forest-50 border border-forest-200 text-xs font-semibold text-forest-900">
                    <CheckCircle2 className="w-4 h-4 text-forest-700 flex-shrink-0" />
                    <span>{amenityName}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-cream-100 rounded-2xl border border-cream-200 text-xs text-charcoal-600 leading-relaxed">
                <p className="font-semibold text-charcoal-800 mb-1">Amenities Unconfirmed for Historical Public Record</p>
                As part of SaathSpace&apos;s data integrity rules, unverified amenities are never fabricated for historical dataset records. Amenities are verified only on owner-submitted properties.
              </div>
            )}
          </div>

          {/* Academic & Data Governance Provenance Box */}
          <div className="bg-cream-100 border border-cream-300 rounded-3xl p-6 text-xs text-charcoal-600 space-y-3">
            <div className="flex items-center gap-2 font-bold text-charcoal-900 text-sm">
              <Database className="w-4 h-4 text-forest-700" />
              <span>Database Provenance & Origin Details</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div>
                <span className="text-charcoal-400 block font-semibold">Data Origin</span>
                <span className="font-bold text-charcoal-800">{listing.data_origin}</span>
              </div>
              <div>
                <span className="text-charcoal-400 block font-semibold">Availability Status</span>
                <span className="font-bold text-charcoal-800 capitalize">{listing.availability_status}</span>
              </div>
              <div>
                <span className="text-charcoal-400 block font-semibold">Locality Ref</span>
                <span className="font-bold text-charcoal-800">Locality #{listing.locality_id}</span>
              </div>
            </div>
            <p className="pt-2 text-[11px] text-charcoal-500 border-t border-cream-200 leading-relaxed">
              {listing.data_origin === 'public_dataset'
                ? 'This record originated from historical public housing datasets. To maintain database truthfulness, online booking is disabled for unverified records.'
                : `Published and managed by verified platform member: ${listing.owner_name || 'Registered Owner'}.`}
            </p>
          </div>

        </div>

        {/* Right Column (1 Col): Enquiry & Owner Contact Box */}
        <div className="space-y-6 lg:sticky lg:top-24">
          
          <div className="bg-white rounded-3xl p-6 border border-cream-200 shadow-premium space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-forest-800">Inquire About This Space</span>
              <h3 className="text-xl font-extrabold text-charcoal-900 font-serif mt-1">Send an Enquiry</h3>
              <p className="text-xs text-charcoal-500 mt-1">
                Reach out to discuss room availability, move-in dates, or request a visit.
              </p>
            </div>

            {enquirySuccess ? (
              <div className="p-4 bg-forest-50 border border-forest-200 rounded-2xl text-xs text-forest-900 space-y-2 text-center animate-in fade-in">
                <CheckCircle2 className="w-8 h-8 text-forest-700 mx-auto" />
                <p className="font-bold text-sm">Enquiry Submitted Successfully!</p>
                <p className="text-charcoal-600">
                  Your enquiry has been logged in the database. Track status updates in your User Dashboard.
                </p>
                <button
                  onClick={() => setEnquirySuccess(false)}
                  className="mt-2 text-xs font-bold text-forest-800 underline cursor-pointer"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleEnquirySubmit} className="space-y-4">
                {enquiryError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                    {enquiryError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-500 mb-1.5">
                    Your Message
                  </label>
                  <textarea
                    rows={4}
                    value={enquiryMessage}
                    onChange={(e) => setEnquiryMessage(e.target.value)}
                    placeholder="Hi! I am interested in this space. Is it still available for move-in next month?"
                    required
                    className="w-full p-3 bg-cream-50 border border-cream-200 rounded-xl text-sm focus:outline-none focus:border-forest-600 resize-none text-charcoal-800"
                  />
                </div>

                <button
                  type="submit"
                  disabled={enquirySubmitting}
                  className="w-full py-3 bg-forest-800 hover:bg-forest-900 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{enquirySubmitting ? 'Sending Enquiry...' : 'Submit Enquiry'}</span>
                </button>

                {!user && (
                  <p className="text-[11px] text-charcoal-400 text-center">
                    You will be prompted to log in or sign up before sending.
                  </p>
                )}
              </form>
            )}

            {/* Owner Info if available */}
            {listing.owner_name && (
              <div className="pt-4 border-t border-cream-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-forest-100 text-forest-800 flex items-center justify-center font-bold">
                  <User className="w-5 h-5 text-forest-700" />
                </div>
                <div>
                  <p className="text-xs font-bold text-charcoal-900">{listing.owner_name}</p>
                  <p className="text-[11px] text-charcoal-500">Verified Listing Host</p>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
