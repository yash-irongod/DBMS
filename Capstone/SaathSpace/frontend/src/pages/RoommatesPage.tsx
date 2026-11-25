import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, Sparkles, Filter, X, Send, AlertCircle, 
  CheckCircle2, SlidersHorizontal, MapPin, DollarSign 
} from 'lucide-react';
import { api } from '../services/api';
import { RoommateProfile, City } from '../types';
import { RoommateCard } from '../components/RoommateCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';

export const RoommatesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cities, setCities] = useState<City[]>([]);
  const [roommates, setRoommates] = useState<RoommateProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [cityId, setCityId] = useState<string>('');
  const [foodPref, setFoodPref] = useState<string>('no_preference');
  const [smokingPref, setSmokingPref] = useState<string>('no_preference');
  const [petsPref, setPetsPref] = useState<string>('no_preference');
  const [sleepPref, setSleepPref] = useState<string>('no_preference');
  const [cleanlinessPref, setCleanlinessPref] = useState<string>('no_preference');
  const [maxBudget, setMaxBudget] = useState<string>('');
  const [minScore, setMinScore] = useState<number>(0);

  // Connection modal state
  const [connectModalOpen, setConnectModalOpen] = useState<boolean>(false);
  const [targetCandidateId, setTargetCandidateId] = useState<number | null>(null);
  const [connectMessage, setConnectMessage] = useState<string>('');
  const [sendingRequest, setSendingRequest] = useState<boolean>(false);
  const [requestFeedback, setRequestFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    api.getCities().then(data => setCities(data.cities || [])).catch(console.error);
  }, []);

  const fetchRoommates = () => {
    setLoading(true);
    api.getRoommates({
      city_id: cityId ? parseInt(cityId, 10) : undefined,
      food_preference: foodPref !== 'no_preference' ? foodPref : undefined,
      smoking_preference: smokingPref !== 'no_preference' ? smokingPref : undefined,
      pets_preference: petsPref !== 'no_preference' ? petsPref : undefined,
      sleep_schedule: sleepPref !== 'no_preference' ? sleepPref : undefined,
      cleanliness_preference: cleanlinessPref !== 'no_preference' ? cleanlinessPref : undefined,
      max_budget: maxBudget ? parseFloat(maxBudget) : undefined,
      min_score: minScore > 0 ? minScore : undefined,
    }).then(data => {
      setRoommates(data.roommates || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRoommates();
  }, [cityId, foodPref, smokingPref, petsPref, sleepPref, cleanlinessPref, maxBudget, minScore, user]);

  const handleOpenConnectModal = (recipientId: number) => {
    if (!user) {
      alert('Please log in to send connection requests.');
      navigate('/login');
      return;
    }
    setTargetCandidateId(recipientId);
    setConnectMessage('Hi! I saw your roommate lifestyle profile on SaathSpace and would love to connect about shared housing.');
    setRequestFeedback(null);
    setConnectModalOpen(true);
  };

  const handleSubmitConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCandidateId) return;

    setSendingRequest(true);
    setRequestFeedback(null);
    try {
      await api.sendRoommateRequest(targetCandidateId, connectMessage);
      setRequestFeedback({
        type: 'success',
        text: 'Connection request sent successfully! You can track responses on your User Dashboard.'
      });
      // Refresh list to update badge
      setTimeout(() => {
        setConnectModalOpen(false);
        fetchRoommates();
      }, 1500);
    } catch (err: any) {
      setRequestFeedback({ type: 'error', text: err.message });
    } finally {
      setSendingRequest(false);
    }
  };

  const resetFilters = () => {
    setCityId('');
    setFoodPref('no_preference');
    setSmokingPref('no_preference');
    setPetsPref('no_preference');
    setSleepPref('no_preference');
    setCleanlinessPref('no_preference');
    setMaxBudget('');
    setMinScore(0);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-cream-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-forest-100 text-forest-800 border border-forest-200 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-forest-700" />
            <span>Rule-Based Lifestyle Compatibility</span>
          </div>
          <h1 className="text-3xl font-extrabold text-charcoal-900 font-serif">Roommate Finder</h1>
          <p className="text-sm text-charcoal-500 mt-1">
            Connect with verified prospective roommates based on shared habits, clean standards, and compatible budgets.
          </p>
        </div>

        {!user && (
          <div className="p-4 bg-forest-50 border border-forest-200 rounded-2xl flex items-center gap-3 text-xs text-forest-900">
            <Sparkles className="w-5 h-5 text-forest-700 flex-shrink-0" />
            <div>
              <span className="font-bold block">Log in for Personalized Match Scores</span>
              See your 100-point compatibility score calculated against each profile.
            </div>
            <Link to="/login" className="px-3 py-1.5 bg-forest-800 text-white rounded-xl font-bold whitespace-nowrap">
              Log in
            </Link>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-cream-200 rounded-2xl p-5 shadow-subtle space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-cream-200">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-forest-700" />
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal-700">Filter Lifestyle Preferences</span>
          </div>
          <button
            onClick={resetFilters}
            className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* City */}
          <div>
            <label className="block text-charcoal-400 font-bold uppercase tracking-wider mb-1">Preferred City</label>
            <select
              value={cityId}
              onChange={(e) => setCityId(e.target.value)}
              className="w-full p-2.5 bg-cream-50 border border-cream-200 rounded-xl font-medium text-charcoal-800"
            >
              <option value="">Any City</option>
              {cities.map((c) => (
                <option key={c.city_id} value={c.city_id}>{c.city_name}</option>
              ))}
            </select>
          </div>

          {/* Diet / Food */}
          <div>
            <label className="block text-charcoal-400 font-bold uppercase tracking-wider mb-1">Diet / Food</label>
            <select
              value={foodPref}
              onChange={(e) => setFoodPref(e.target.value)}
              className="w-full p-2.5 bg-cream-50 border border-cream-200 rounded-xl font-medium text-charcoal-800"
            >
              <option value="no_preference">Any Diet</option>
              <option value="vegetarian">Vegetarian Only</option>
              <option value="non_vegetarian">Non-Vegetarian</option>
              <option value="vegan">Vegan</option>
            </select>
          </div>

          {/* Smoking */}
          <div>
            <label className="block text-charcoal-400 font-bold uppercase tracking-wider mb-1">Smoking Policy</label>
            <select
              value={smokingPref}
              onChange={(e) => setSmokingPref(e.target.value)}
              className="w-full p-2.5 bg-cream-50 border border-cream-200 rounded-xl font-medium text-charcoal-800"
            >
              <option value="no_preference">Any Policy</option>
              <option value="non_smoker_only">Non-Smoker Only</option>
              <option value="okay_with_smoker">Okay with Smoker</option>
            </select>
          </div>

          {/* Cleanliness */}
          <div>
            <label className="block text-charcoal-400 font-bold uppercase tracking-wider mb-1">Cleanliness</label>
            <select
              value={cleanlinessPref}
              onChange={(e) => setCleanlinessPref(e.target.value)}
              className="w-full p-2.5 bg-cream-50 border border-cream-200 rounded-xl font-medium text-charcoal-800"
            >
              <option value="no_preference">Any Cleanliness</option>
              <option value="very_clean">Very Clean Only</option>
              <option value="average">Average</option>
              <option value="relaxed">Relaxed</option>
            </select>
          </div>
        </div>

        {user && (
          <div className="pt-3 border-t border-cream-200 flex items-center gap-4 text-xs">
            <span className="font-bold text-charcoal-600">Minimum Match Score:</span>
            <div className="flex gap-2">
              {[0, 50, 70, 85].map((thresh) => (
                <button
                  key={thresh}
                  type="button"
                  onClick={() => setMinScore(thresh)}
                  className={`px-3 py-1 rounded-full font-bold border transition-all ${
                    minScore === thresh
                      ? 'bg-forest-800 text-white border-forest-800'
                      : 'bg-cream-50 text-charcoal-700 border-cream-200 hover:bg-cream-100'
                  }`}
                >
                  {thresh === 0 ? 'All Matches' : `${thresh}%+ Match`}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Roommates Grid */}
      {loading ? (
        <LoadingSpinner message="Calculating compatibility scores..." />
      ) : roommates.length === 0 ? (
        <EmptyState
          title="No compatible roommates found"
          description="Try broadening your dietary, smoking, or budget filters to discover more candidate profiles."
          actionText="Reset Filters"
          onAction={resetFilters}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roommates.map((cand) => (
            <RoommateCard
              key={cand.user_id}
              profile={cand}
              onRequestConnect={handleOpenConnectModal}
            />
          ))}
        </div>
      )}

      {/* Send Connection Request Modal */}
      {connectModalOpen && (
        <div className="fixed inset-0 bg-charcoal-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-elevated border border-cream-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-cream-200">
              <h3 className="font-bold text-lg text-charcoal-900 font-serif">Request Roommate Connection</h3>
              <button
                onClick={() => setConnectModalOpen(false)}
                className="text-charcoal-400 hover:text-charcoal-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {requestFeedback ? (
              <div className={`p-4 rounded-2xl text-xs space-y-1 ${
                requestFeedback.type === 'success' 
                  ? 'bg-forest-50 text-forest-900 border border-forest-200' 
                  : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}>
                <p className="font-bold">{requestFeedback.type === 'success' ? 'Success!' : 'Request Error'}</p>
                <p>{requestFeedback.text}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitConnection} className="space-y-4">
                <p className="text-xs text-charcoal-600 leading-relaxed">
                  Introduce yourself! The recipient will receive this message and can accept or decline the request from their dashboard.
                </p>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-500 mb-1.5">
                    Introductory Message
                  </label>
                  <textarea
                    rows={4}
                    value={connectMessage}
                    onChange={(e) => setConnectMessage(e.target.value)}
                    required
                    className="w-full p-3 bg-cream-50 border border-cream-200 rounded-xl text-sm focus:outline-none focus:border-forest-600 resize-none text-charcoal-800"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setConnectModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-charcoal-600 hover:bg-cream-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingRequest}
                    className="px-5 py-2.5 bg-forest-800 hover:bg-forest-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{sendingRequest ? 'Sending...' : 'Send Request'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
