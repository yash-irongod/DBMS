import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building2, PlusCircle, ShieldCheck, CheckCircle2, 
  MessageSquare, SlidersHorizontal, MapPin, DollarSign, 
  Bed, Bath, Maximize2, AlertCircle, Sparkles, Check, Edit 
} from 'lucide-react';
import { api } from '../services/api';
import { Listing, City, Locality, Amenity, Enquiry } from '../types';
import { ListingStatusBadge } from '../components/Badge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';

export const OwnerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'listings' | 'post' | 'inbox'>('listings');
  const [loading, setLoading] = useState<boolean>(true);

  // Reference data
  const [cities, setCities] = useState<City[]>([]);
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);

  // Owner data
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [hostEnquiries, setHostEnquiries] = useState<Enquiry[]>([]);

  // Post new listing form state
  const [postCityId, setPostCityId] = useState<number>(1);
  const [postLocalityId, setPostLocalityId] = useState<number | ''>('');
  const [postTitle, setPostTitle] = useState<string>('');
  const [postKind, setPostKind] = useState<string>('private_room');
  const [postRent, setPostRent] = useState<string>('');
  const [postDeposit, setPostDeposit] = useState<string>('');
  const [postSize, setPostSize] = useState<string>('');
  const [postBedrooms, setPostBedrooms] = useState<string>('1');
  const [postBathrooms, setPostBathrooms] = useState<string>('1');
  const [postBalconies, setPostBalconies] = useState<string>('1');
  const [postFurnishing, setPostFurnishing] = useState<string>('furnished');
  const [postDescription, setPostDescription] = useState<string>('');
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [postSuccess, setPostSuccess] = useState<string | null>(null);
  const [postError, setPostError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    Promise.all([
      api.getCities(),
      api.getAmenities()
    ]).then(([cityData, amenityData]) => {
      setCities(cityData.cities || []);
      setAmenities(amenityData.amenities || []);
    }).catch(console.error);

    loadOwnerData();
  }, [user]);

  // Load localities for selected post city
  useEffect(() => {
    if (postCityId) {
      api.getLocalities(postCityId).then(data => {
        setLocalities(data.localities || []);
        if (data.localities?.length > 0) {
          setPostLocalityId(data.localities[0].locality_id);
        }
      }).catch(console.error);
    }
  }, [postCityId]);

  const loadOwnerData = () => {
    setLoading(true);
    Promise.all([
      api.getOwnerListings(),
      api.getOwnerEnquiries()
    ]).then(([listingData, enquiryData]) => {
      setMyListings(listingData.listings || []);
      setHostEnquiries(enquiryData.enquiries || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleAmenityToggle = (id: number) => {
    if (selectedAmenityIds.includes(id)) {
      setSelectedAmenityIds(prev => prev.filter(x => x !== id));
    } else {
      setSelectedAmenityIds(prev => [...prev, id]);
    }
  };

  const handlePostListingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postLocalityId || !postTitle || !postRent) {
      setPostError('Please fill in title, locality, and rent amount.');
      return;
    }

    setSubmitting(true);
    setPostError(null);
    setPostSuccess(null);

    try {
      const payload = {
        title: postTitle.trim(),
        locality_id: postLocalityId,
        listing_kind: postKind,
        rent_amount: parseFloat(postRent),
        rent_period: 'monthly',
        security_deposit: postDeposit ? parseFloat(postDeposit) : null,
        size_sqft: postSize ? parseFloat(postSize) : null,
        bedrooms: postBedrooms ? parseInt(postBedrooms, 10) : null,
        bathrooms: postBathrooms ? parseInt(postBathrooms, 10) : null,
        balconies: postBalconies ? parseInt(postBalconies, 10) : null,
        furnishing_status: postFurnishing,
        description: postDescription.trim(),
        availability_status: 'available',
        amenity_ids: selectedAmenityIds
      };

      const res = await api.createListing(payload);
      setPostSuccess(`Listing created successfully with Verified Available status! ID: #${res.listing_id}`);
      
      // Reset form
      setPostTitle('');
      setPostRent('');
      setPostDeposit('');
      setPostSize('');
      setPostDescription('');
      setSelectedAmenityIds([]);
      
      loadOwnerData();
      setTimeout(() => setActiveTab('listings'), 1500);
    } catch (err: any) {
      setPostError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateAvailability = async (listingId: number, status: string) => {
    try {
      await api.updateListingAvailability(listingId, status);
      loadOwnerData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateEnquiryStatus = async (enquiryId: number, status: string) => {
    try {
      await api.updateEnquiryStatus(enquiryId, status);
      loadOwnerData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-cream-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-forest-100 text-forest-800 border border-forest-200 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-forest-700" />
            <span>Verified Owner Portal</span>
          </div>
          <h1 className="text-3xl font-extrabold text-charcoal-900 font-serif">Property Host Dashboard</h1>
          <p className="text-sm text-charcoal-500 mt-1">
            Publish rental rooms, confirm standard amenities, and manage availability for prospective tenants.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('post')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-sm shadow-sm transition-colors cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Publish New Listing</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-cream-200 gap-6">
        <button
          onClick={() => setActiveTab('listings')}
          className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'listings'
              ? 'border-forest-800 text-forest-900'
              : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>My Published Rooms ({myListings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('post')}
          className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'post'
              ? 'border-forest-800 text-forest-900'
              : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post a Room</span>
        </button>

        <button
          onClick={() => setActiveTab('inbox')}
          className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'inbox'
              ? 'border-forest-800 text-forest-900'
              : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Host Inbox ({hostEnquiries.length})</span>
        </button>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading owner inventory..." />
      ) : (
        <div>
          {/* TAB 1: MY LISTINGS */}
          {activeTab === 'listings' && (
            <div className="space-y-6">
              {myListings.length === 0 ? (
                <EmptyState
                  title="No published listings yet"
                  description="You haven't posted any rental spaces yet. Create a listing to appear in search results with confirmed amenities and verified availability."
                  actionText="Publish Your First Listing"
                  onAction={() => setActiveTab('post')}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myListings.map((item) => (
                    <div key={item.listing_id} className="bg-white rounded-3xl border border-cream-200 p-6 shadow-subtle flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-forest-100 text-forest-800">
                            {item.listing_kind.replace(/_/g, ' ')}
                          </span>
                          <span className="text-sm font-extrabold text-forest-900">
                            ₹{Number(item.rent_amount).toLocaleString('en-IN')}/mo
                          </span>
                        </div>

                        <Link to={`/listings/${item.listing_id}`} className="font-bold text-base text-charcoal-900 hover:text-forest-800 block line-clamp-1">
                          {item.title}
                        </Link>
                        <p className="text-xs text-charcoal-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-forest-600" />
                          <span>{item.locality_name}, {item.city_name}</span>
                        </p>

                        <div className="flex items-center gap-4 text-xs text-charcoal-600 pt-2 border-t border-cream-200">
                          <span>{item.bedrooms !== null ? `${item.bedrooms} BHK` : '1 Unit'}</span>
                          <span>•</span>
                          <span>{item.bathrooms || 1} Bath</span>
                          <span>•</span>
                          <span>{item.size_sqft ? `${Math.round(item.size_sqft)} sqft` : 'N/A'}</span>
                        </div>

                        {/* Confirmed Amenities tags */}
                        {Array.isArray(item.amenities) && item.amenities.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {item.amenities.slice(0, 3).map((a: any, i) => (
                              <span key={i} className="px-2 py-0.5 bg-forest-50 text-[10px] font-semibold text-forest-800 rounded">
                                {typeof a === 'string' ? a : a.amenity_name}
                              </span>
                            ))}
                            {item.amenities.length > 3 && (
                              <span className="text-[10px] text-charcoal-400 self-center">
                                +{item.amenities.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Availability status dropdown & analytics */}
                      <div className="pt-3 border-t border-cream-200 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-charcoal-500">Availability:</span>
                          <select
                            value={item.availability_status}
                            onChange={(e) => handleUpdateAvailability(item.listing_id, e.target.value)}
                            className="px-2.5 py-1 bg-cream-50 border border-cream-300 rounded-lg text-xs font-bold text-charcoal-800 cursor-pointer"
                          >
                            <option value="available">Available</option>
                            <option value="reserved">Reserved</option>
                            <option value="unavailable">Unavailable</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-charcoal-500 pt-1">
                          <span>Enquiries: {item.total_enquiries || 0}</span>
                          <span>Saved by: {item.total_saves || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: POST A NEW LISTING FORM */}
          {activeTab === 'post' && (
            <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 border border-cream-200 shadow-subtle space-y-6">
              <div>
                <h3 className="text-xl font-bold text-charcoal-900 font-serif">Publish a Real Rental Space</h3>
                <p className="text-xs text-charcoal-500 mt-1">
                  Listings created here are assigned your user account ID (`owner_user_id`), labelled as `user_submitted`, and published with verified availability.
                </p>
              </div>

              {postSuccess && (
                <div className="p-4 bg-forest-50 border border-forest-200 rounded-2xl text-xs text-forest-900 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-forest-700 flex-shrink-0" />
                  <span>{postSuccess}</span>
                </div>
              )}
              {postError && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 font-bold flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                  <span>{postError}</span>
                </div>
              )}

              <form onSubmit={handlePostListingSubmit} className="space-y-6 text-xs">
                {/* City & Locality */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold uppercase tracking-wider text-charcoal-500 mb-1">
                      City *
                    </label>
                    <select
                      value={postCityId}
                      onChange={(e) => setPostCityId(parseInt(e.target.value, 10))}
                      className="w-full p-2.5 bg-cream-50 border border-cream-200 rounded-xl font-medium text-charcoal-800"
                    >
                      {cities.map((c) => (
                        <option key={c.city_id} value={c.city_id}>{c.city_name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold uppercase tracking-wider text-charcoal-500 mb-1">
                      Locality *
                    </label>
                    <select
                      value={postLocalityId}
                      onChange={(e) => setPostLocalityId(parseInt(e.target.value, 10))}
                      required
                      className="w-full p-2.5 bg-cream-50 border border-cream-200 rounded-xl font-medium text-charcoal-800"
                    >
                      {localities.map((l) => (
                        <option key={l.locality_id} value={l.locality_id}>{l.locality_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block font-bold uppercase tracking-wider text-charcoal-500 mb-1">
                    Listing Headline *
                  </label>
                  <input
                    type="text"
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    placeholder="e.g. Spacious 2 BHK with Balcony near Metro Station"
                    required
                    className="w-full p-3 bg-cream-50 border border-cream-200 rounded-xl text-sm font-medium text-charcoal-800 focus:outline-none focus:border-forest-600"
                  />
                </div>

                {/* Kind & Rent */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold uppercase tracking-wider text-charcoal-500 mb-1">
                      Room / Unit Kind *
                    </label>
                    <select
                      value={postKind}
                      onChange={(e) => setPostKind(e.target.value)}
                      className="w-full p-2.5 bg-cream-50 border border-cream-200 rounded-xl font-medium text-charcoal-800"
                    >
                      <option value="entire_unit">Entire Apartment</option>
                      <option value="private_room">Private Room</option>
                      <option value="shared_room">Shared Room</option>
                      <option value="pg_hostel">PG / Hostel</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold uppercase tracking-wider text-charcoal-500 mb-1">
                      Monthly Rent (₹) *
                    </label>
                    <input
                      type="number"
                      value={postRent}
                      onChange={(e) => setPostRent(e.target.value)}
                      placeholder="15000"
                      required
                      min={1}
                      className="w-full p-2.5 bg-cream-50 border border-cream-200 rounded-xl font-medium text-charcoal-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold uppercase tracking-wider text-charcoal-500 mb-1">
                      Security Deposit (₹)
                    </label>
                    <input
                      type="number"
                      value={postDeposit}
                      onChange={(e) => setPostDeposit(e.target.value)}
                      placeholder="30000"
                      min={0}
                      className="w-full p-2.5 bg-cream-50 border border-cream-200 rounded-xl font-medium text-charcoal-800"
                    />
                  </div>
                </div>

                {/* Size, Beds, Baths, Balconies */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold uppercase tracking-wider text-charcoal-500 mb-1">Size (sqft)</label>
                    <input
                      type="number"
                      value={postSize}
                      onChange={(e) => setPostSize(e.target.value)}
                      placeholder="850"
                      className="w-full p-2 bg-cream-50 border border-cream-200 rounded-xl text-charcoal-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold uppercase tracking-wider text-charcoal-500 mb-1">Bedrooms</label>
                    <input
                      type="number"
                      value={postBedrooms}
                      onChange={(e) => setPostBedrooms(e.target.value)}
                      min={0}
                      className="w-full p-2 bg-cream-50 border border-cream-200 rounded-xl text-charcoal-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold uppercase tracking-wider text-charcoal-500 mb-1">Bathrooms</label>
                    <input
                      type="number"
                      value={postBathrooms}
                      onChange={(e) => setPostBathrooms(e.target.value)}
                      min={0}
                      className="w-full p-2 bg-cream-50 border border-cream-200 rounded-xl text-charcoal-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold uppercase tracking-wider text-charcoal-500 mb-1">Furnishing</label>
                    <select
                      value={postFurnishing}
                      onChange={(e) => setPostFurnishing(e.target.value)}
                      className="w-full p-2 bg-cream-50 border border-cream-200 rounded-xl text-charcoal-800"
                    >
                      <option value="furnished">Furnished</option>
                      <option value="semi_furnished">Semi-Furnished</option>
                      <option value="unfurnished">Unfurnished</option>
                    </select>
                  </div>
                </div>

                {/* Confirmed Amenities (Populates app.listing_amenity) */}
                <div className="space-y-2 pt-2 border-t border-cream-200">
                  <label className="block font-bold uppercase tracking-wider text-charcoal-600">
                    Confirmed Property Amenities (stored in app.listing_amenity)
                  </label>
                  <p className="text-[11px] text-charcoal-400">Select all amenities available at this property:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {amenities.map((a) => (
                      <label key={a.amenity_id} className="flex items-center gap-2 p-2.5 rounded-xl border border-cream-200 hover:bg-forest-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedAmenityIds.includes(a.amenity_id)}
                          onChange={() => handleAmenityToggle(a.amenity_id)}
                          className="accent-forest-700"
                        />
                        <span className="text-xs font-medium text-charcoal-800 truncate">{a.amenity_name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block font-bold uppercase tracking-wider text-charcoal-500 mb-1">
                    Detailed Description
                  </label>
                  <textarea
                    rows={4}
                    value={postDescription}
                    onChange={(e) => setPostDescription(e.target.value)}
                    placeholder="Provide details about the neighborhood, public transit, house rules, and room specifications..."
                    className="w-full p-3 bg-cream-50 border border-cream-200 rounded-xl text-sm focus:outline-none focus:border-forest-600 resize-none text-charcoal-800"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-forest-800 hover:bg-forest-900 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{submitting ? 'Publishing Listing...' : 'Publish Listing'}</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: HOST INBOX */}
          {activeTab === 'inbox' && (
            <div className="space-y-4">
              {hostEnquiries.length === 0 ? (
                <EmptyState
                  title="No enquiries received yet"
                  description="When prospective tenants message about your published listings, their inquiries will appear here."
                />
              ) : (
                <div className="bg-white rounded-3xl border border-cream-200 shadow-subtle overflow-hidden divide-y divide-cream-200">
                  {hostEnquiries.map((enq) => (
                    <div key={enq.enquiry_id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-cream-50/50 transition-colors">
                      <div className="space-y-1.5 max-w-xl">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-charcoal-900">{enq.enquirer_name}</span>
                          <span className="text-xs text-charcoal-400">({enq.enquirer_email})</span>
                        </div>
                        <p className="text-xs text-charcoal-600">
                          Re: <Link to={`/listings/${enq.listing_id}`} className="font-semibold text-forest-800 underline">{enq.listing_title}</Link>
                        </p>
                        <p className="text-xs text-charcoal-700 bg-cream-100 p-2.5 rounded-xl border border-cream-200 italic mt-2">
                          &ldquo;{enq.message}&rdquo;
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={enq.enquiry_status}
                          onChange={(e) => handleUpdateEnquiryStatus(enq.enquiry_id, e.target.value)}
                          className="px-3 py-1.5 bg-cream-50 border border-cream-300 rounded-xl text-xs font-bold text-charcoal-800 cursor-pointer"
                        >
                          <option value="new">New</option>
                          <option value="responded">Responded</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
