import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Heart, MessageSquare, Users, Sliders, Check, 
  X, Clock, Building2, MapPin, Sparkles, AlertCircle, Save 
} from 'lucide-react';
import { api } from '../services/api';
import { Listing, Enquiry, RoommateRequest, RoommateProfile, City } from '../types';
import { ListingCard } from '../components/ListingCard';
import { RoommateCard } from '../components/RoommateCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { Badge } from '../components/Badge';
import { useAuth } from '../context/AuthContext';

export const DashboardPage: React.FC = () => {
  const { user, profile: authProfile, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'saved' | 'enquiries' | 'requests' | 'preferences'>('saved');
  const [loading, setLoading] = useState<boolean>(true);
  const [cities, setCities] = useState<City[]>([]);

  // Dashboard summary data
  const [savedListings, setSavedListings] = useState<Listing[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<RoommateRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<RoommateRequest[]>([]);
  const [recommendations, setRecommendations] = useState<RoommateProfile[]>([]);

  // Preference edit form
  const [prefCityId, setPrefCityId] = useState<number>(1);
  const [budgetMin, setBudgetMin] = useState<number>(5000);
  const [budgetMax, setBudgetMax] = useState<number>(20000);
  const [moveInDate, setMoveInDate] = useState<string>('');
  const [foodPref, setFoodPref] = useState<string>('no_preference');
  const [smokingPref, setSmokingPref] = useState<string>('no_preference');
  const [petsPref, setPetsPref] = useState<string>('no_preference');
  const [sleepPref, setSleepPref] = useState<string>('no_preference');
  const [cleanlinessPref, setCleanlinessPref] = useState<string>('no_preference');
  const [savingPrefs, setSavingPrefs] = useState<boolean>(false);
  const [prefSaveSuccess, setPrefSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadDashboardData();
    api.getCities().then(res => setCities(res.cities || [])).catch(console.error);
  }, [user]);

  const loadDashboardData = () => {
    setLoading(true);
    api.getDashboardSummary()
      .then((data) => {
        setSavedListings(data.saved_listings || []);
        setEnquiries(data.enquiries || []);
        setIncomingRequests(data.incoming_requests || []);
        setOutgoingRequests(data.outgoing_requests || []);
        setRecommendations(data.recommended_roommates || []);

        // Sync preference state if profile exists
        if (data.profile) {
          setPrefCityId(data.profile.preferred_city_id || 1);
          setBudgetMin(Number(data.profile.budget_min) || 5000);
          setBudgetMax(Number(data.profile.budget_max) || 20000);
          setMoveInDate(data.profile.move_in_date || '');
          setFoodPref(data.profile.food_preference || 'no_preference');
          setSmokingPref(data.profile.smoking_preference || 'no_preference');
          setPetsPref(data.profile.pets_preference || 'no_preference');
          setSleepPref(data.profile.sleep_schedule || 'no_preference');
          setCleanlinessPref(data.profile.cleanliness_preference || 'no_preference');
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPrefs(true);
    setPrefSaveSuccess(false);
    try {
      await api.updateOwnRoommatePreferences({
        preferred_city_id: prefCityId,
        budget_min: budgetMin,
        budget_max: budgetMax,
        move_in_date: moveInDate || null,
        food_preference: foodPref as any,
        smoking_preference: smokingPref as any,
        pets_preference: petsPref as any,
        sleep_schedule: sleepPref as any,
        cleanliness_preference: cleanlinessPref as any,
      });
      setPrefSaveSuccess(true);
      await refreshUser();
      loadDashboardData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleRespondRequest = async (requestId: number, status: 'accepted' | 'declined' | 'cancelled') => {
    try {
      await api.updateRoommateRequestStatus(requestId, status);
      loadDashboardData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUnsaveListing = async (listingId: number) => {
    try {
      await api.toggleSaveListing(listingId);
      setSavedListings(prev => prev.filter(l => l.listing_id !== listingId));
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Welcome Hero Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-cream-200 shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-forest-800 text-white font-serif font-bold text-2xl flex items-center justify-center shadow-xs">
            {user.full_name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-charcoal-900 font-serif">{user.full_name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-forest-100 text-forest-800">
                {user.account_role}
              </span>
            </div>
            <p className="text-xs text-charcoal-500 mt-1">{user.email}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/owner"
            className="px-4 py-2 bg-cream-100 hover:bg-cream-200 text-charcoal-800 rounded-xl text-xs font-bold border border-cream-200 transition-colors"
          >
            Owner Portal
          </Link>
          <Link
            to="/roommates"
            className="px-4 py-2 bg-forest-800 hover:bg-forest-900 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            Find Roommates
          </Link>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-cream-200 gap-2 sm:gap-6 overflow-x-auto">
        {[
          { key: 'saved', label: 'Saved Properties', count: savedListings.length, icon: Heart },
          { key: 'enquiries', label: 'My Enquiries', count: enquiries.length, icon: MessageSquare },
          { key: 'requests', label: 'Roommate Connections', count: incomingRequests.length + outgoingRequests.length, icon: Users },
          { key: 'preferences', label: 'Lifestyle Preferences', icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`pb-4 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-forest-800 text-forest-900'
                  : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === tab.key ? 'bg-forest-100 text-forest-800' : 'bg-cream-200 text-charcoal-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <LoadingSpinner message="Loading your dashboard data..." />
      ) : (
        <div>
          {/* TAB 1: SAVED LISTINGS */}
          {activeTab === 'saved' && (
            <div className="space-y-6">
              {savedListings.length === 0 ? (
                <EmptyState
                  title="No saved properties yet"
                  description="Explore rental listings in Delhi, Mumbai, or Pune and bookmark your favorites."
                  actionText="Discover Rooms"
                  onAction={() => navigate('/listings')}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedListings.map((item) => (
                    <ListingCard
                      key={item.listing_id}
                      listing={item}
                      onToggleSave={handleUnsaveListing}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MY ENQUIRIES */}
          {activeTab === 'enquiries' && (
            <div className="space-y-4">
              {enquiries.length === 0 ? (
                <EmptyState
                  title="No enquiries submitted yet"
                  description="When you reach out to a property host, your enquiries and responses will be tracked here."
                  actionText="Browse Listings"
                  onAction={() => navigate('/listings')}
                />
              ) : (
                <div className="bg-white rounded-3xl border border-cream-200 shadow-subtle overflow-hidden divide-y divide-cream-200">
                  {enquiries.map((enq) => (
                    <div key={enq.enquiry_id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-cream-50/50 transition-colors">
                      <div className="space-y-1 max-w-xl">
                        <div className="flex items-center gap-2">
                          <Link to={`/listings/${enq.listing_id}`} className="font-bold text-sm text-charcoal-900 hover:text-forest-800 underline">
                            {enq.listing_title}
                          </Link>
                          <span className="text-xs font-bold text-forest-900">₹{Number(enq.rent_amount).toLocaleString('en-IN')}/mo</span>
                        </div>
                        <p className="text-xs text-charcoal-500">{enq.locality_name}, {enq.city_name} • Sent on {new Date(enq.created_at).toLocaleDateString()}</p>
                        <p className="text-xs text-charcoal-700 bg-cream-100 p-2.5 rounded-xl border border-cream-200 italic mt-2">
                          &ldquo;{enq.message}&rdquo;
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                          enq.enquiry_status === 'responded'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                            : enq.enquiry_status === 'closed'
                            ? 'bg-charcoal-100 text-charcoal-700'
                            : 'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}>
                          Status: {enq.enquiry_status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ROOMMATE CONNECTIONS */}
          {activeTab === 'requests' && (
            <div className="space-y-8">
              {/* Incoming Requests */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-charcoal-900 font-serif flex items-center gap-2">
                  <span>Incoming Connection Requests</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-forest-100 text-forest-800">{incomingRequests.length}</span>
                </h3>

                {incomingRequests.length === 0 ? (
                  <p className="text-xs text-charcoal-500 bg-white p-6 rounded-2xl border border-cream-200">
                    No incoming connection requests currently pending.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {incomingRequests.map((req) => (
                      <div key={req.request_id} className="bg-white rounded-2xl p-5 border border-cream-200 shadow-subtle space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-sm text-charcoal-900">{req.requester_name}</h4>
                            <p className="text-xs text-charcoal-500">{req.preferred_city} • Budget: ₹{req.budget_min?.toLocaleString()}–₹{req.budget_max?.toLocaleString()}</p>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold capitalize bg-blue-50 text-blue-800 border border-blue-200">
                            {req.request_status}
                          </span>
                        </div>

                        {req.message && (
                          <p className="text-xs text-charcoal-700 bg-cream-50 p-2.5 rounded-xl border border-cream-200 italic">
                            &ldquo;{req.message}&rdquo;
                          </p>
                        )}

                        {req.request_status === 'pending' && (
                          <div className="flex items-center gap-2 pt-2">
                            <button
                              onClick={() => handleRespondRequest(req.request_id, 'accepted')}
                              className="flex-1 py-1.5 rounded-xl text-xs font-bold bg-forest-800 hover:bg-forest-900 text-white flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Accept</span>
                            </button>
                            <button
                              onClick={() => handleRespondRequest(req.request_id, 'declined')}
                              className="flex-1 py-1.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Decline</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Outgoing Requests */}
              <div className="space-y-4 pt-4 border-t border-cream-200">
                <h3 className="text-base font-bold text-charcoal-900 font-serif flex items-center gap-2">
                  <span>Sent Connection Requests</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cream-200 text-charcoal-700">{outgoingRequests.length}</span>
                </h3>

                {outgoingRequests.length === 0 ? (
                  <p className="text-xs text-charcoal-500 bg-white p-6 rounded-2xl border border-cream-200">
                    You haven&apos;t sent any roommate connection requests yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {outgoingRequests.map((req) => (
                      <div key={req.request_id} className="bg-white rounded-2xl p-5 border border-cream-200 shadow-subtle space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-sm text-charcoal-900">{req.recipient_name}</h4>
                            <p className="text-xs text-charcoal-500">{req.preferred_city} • Sent on {new Date(req.created_at).toLocaleDateString()}</p>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                            req.request_status === 'accepted'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                              : req.request_status === 'declined'
                              ? 'bg-rose-50 text-rose-800'
                              : 'bg-blue-50 text-blue-800'
                          }`}>
                            {req.request_status}
                          </span>
                        </div>

                        {req.request_status === 'pending' && (
                          <button
                            onClick={() => handleRespondRequest(req.request_id, 'cancelled')}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-800 cursor-pointer"
                          >
                            Cancel Request
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: LIFESTYLE PREFERENCES */}
          {activeTab === 'preferences' && (
            <div className="max-w-2xl bg-white rounded-3xl p-8 border border-cream-200 shadow-subtle space-y-6">
              <div>
                <h3 className="text-lg font-bold text-charcoal-900 font-serif">Manage Roommate Lifestyle Preferences</h3>
                <p className="text-xs text-charcoal-500 mt-1">
                  These attributes drive the 100-point compatibility score when prospective roommates search for matches.
                </p>
              </div>

              {prefSaveSuccess && (
                <div className="p-3.5 bg-forest-50 border border-forest-200 rounded-xl text-xs text-forest-900 font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-forest-700" />
                  <span>Preferences saved successfully to database!</span>
                </div>
              )}

              <form onSubmit={handleSavePreferences} className="space-y-5 text-xs">
                {/* Preferred City */}
                <div>
                  <label className="block font-bold uppercase tracking-wider text-charcoal-500 mb-1">
                    Target City
                  </label>
                  <select
                    value={prefCityId}
                    onChange={(e) => setPrefCityId(parseInt(e.target.value, 10))}
                    className="w-full p-2.5 bg-cream-50 border border-cream-200 rounded-xl font-medium text-charcoal-800"
                  >
                    {cities.map((c) => (
                      <option key={c.city_id} value={c.city_id}>{c.city_name}</option>
                    ))}
                  </select>
                </div>

                {/* Budget Range */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold uppercase tracking-wider text-charcoal-500 mb-1">
                      Minimum Budget (₹)
                    </label>
                    <input
                      type="number"
                      value={budgetMin}
                      onChange={(e) => setBudgetMin(parseFloat(e.target.value))}
                      required
                      min={0}
                      className="w-full p-2.5 bg-cream-50 border border-cream-200 rounded-xl font-medium text-charcoal-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold uppercase tracking-wider text-charcoal-500 mb-1">
                      Maximum Budget (₹)
                    </label>
                    <input
                      type="number"
                      value={budgetMax}
                      onChange={(e) => setBudgetMax(parseFloat(e.target.value))}
                      required
                      min={budgetMin}
                      className="w-full p-2.5 bg-cream-50 border border-cream-200 rounded-xl font-medium text-charcoal-800"
                    />
                  </div>
                </div>

                {/* Move-in Date */}
                <div>
                  <label className="block font-bold uppercase tracking-wider text-charcoal-500 mb-1">
                    Target Move-in Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={moveInDate}
                    onChange={(e) => setMoveInDate(e.target.value)}
                    className="w-full p-2.5 bg-cream-50 border border-cream-200 rounded-xl font-medium text-charcoal-800"
                  />
                </div>

                {/* Lifestyle Questions Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-cream-200">
                  <div>
                    <label className="block font-bold uppercase tracking-wider text-charcoal-500 mb-1">Food / Diet</label>
                    <select
                      value={foodPref}
                      onChange={(e) => setFoodPref(e.target.value)}
                      className="w-full p-2.5 bg-cream-50 border border-cream-200 rounded-xl font-medium text-charcoal-800"
                    >
                      <option value="no_preference">No Preference</option>
                      <option value="vegetarian">Vegetarian</option>
                      <option value="non_vegetarian">Non-Vegetarian</option>
                      <option value="vegan">Vegan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold uppercase tracking-wider text-charcoal-500 mb-1">Smoking Policy</label>
                    <select
                      value={smokingPref}
                      onChange={(e) => setSmokingPref(e.target.value)}
                      className="w-full p-2.5 bg-cream-50 border border-cream-200 rounded-xl font-medium text-charcoal-800"
                    >
                      <option value="no_preference">No Preference</option>
                      <option value="non_smoker_only">Non-Smoker Only</option>
                      <option value="okay_with_smoker">Okay with Smoker</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold uppercase tracking-wider text-charcoal-500 mb-1">Pets Preference</label>
                    <select
                      value={petsPref}
                      onChange={(e) => setPetsPref(e.target.value)}
                      className="w-full p-2.5 bg-cream-50 border border-cream-200 rounded-xl font-medium text-charcoal-800"
                    >
                      <option value="no_preference">No Preference</option>
                      <option value="no_pets">No Pets</option>
                      <option value="pets_ok">Pets OK</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold uppercase tracking-wider text-charcoal-500 mb-1">Sleep Schedule</label>
                    <select
                      value={sleepPref}
                      onChange={(e) => setSleepPref(e.target.value)}
                      className="w-full p-2.5 bg-cream-50 border border-cream-200 rounded-xl font-medium text-charcoal-800"
                    >
                      <option value="no_preference">No Preference</option>
                      <option value="early">Early Riser</option>
                      <option value="regular">Regular</option>
                      <option value="late">Night Owl</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold uppercase tracking-wider text-charcoal-500 mb-1">Cleanliness Standard</label>
                    <select
                      value={cleanlinessPref}
                      onChange={(e) => setCleanlinessPref(e.target.value)}
                      className="w-full p-2.5 bg-cream-50 border border-cream-200 rounded-xl font-medium text-charcoal-800"
                    >
                      <option value="no_preference">No Preference</option>
                      <option value="very_clean">Very Clean (Strict tidy)</option>
                      <option value="average">Average (Standard living)</option>
                      <option value="relaxed">Relaxed (Easygoing)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingPrefs}
                  className="w-full py-3 bg-forest-800 hover:bg-forest-900 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingPrefs ? 'Saving Preferences...' : 'Save Lifestyle Preferences'}</span>
                </button>
              </form>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
