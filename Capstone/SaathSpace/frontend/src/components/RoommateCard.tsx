import React, { useState } from 'react';
import { 
  Users, MapPin, DollarSign, Utensils, Cigarette, 
  Dog, Moon, Sparkles, Check, Clock, ChevronDown, ChevronUp, Send
} from 'lucide-react';
import { RoommateProfile } from '../types';
import { Badge } from './Badge';
import { useAuth } from '../context/AuthContext';

interface RoommateCardProps {
  profile: RoommateProfile;
  onRequestConnect: (userId: number) => void;
}

export const RoommateCard: React.FC<RoommateCardProps> = ({ profile, onRequestConnect }) => {
  const { user } = useAuth();
  const [showScoreBreakdown, setShowScoreBreakdown] = useState<boolean>(false);

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-forest-100 text-forest-900 border-forest-300';
    if (score >= 60) return 'bg-emerald-50 text-emerald-800 border-emerald-300';
    if (score >= 40) return 'bg-amber-50 text-amber-800 border-amber-300';
    return 'bg-cream-200 text-charcoal-700 border-cream-300';
  };

  const formatPreference = (val: string) => {
    return val.replace(/_/g, ' ');
  };

  return (
    <div className="bg-white rounded-2xl border border-cream-200 p-6 shadow-subtle hover:shadow-premium transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Header: Avatar, Name & Match Score */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-forest-800 text-white font-bold text-lg flex items-center justify-center font-serif shadow-xs">
              {profile.full_name.charAt(0)}
            </div>
            <div>
              <h3 className="text-base font-bold text-charcoal-900">{profile.full_name}</h3>
              <p className="text-xs text-charcoal-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-forest-600" />
                <span>{profile.preferred_city_name || 'Open to Multiple Cities'}</span>
              </p>
            </div>
          </div>

          {/* Compatibility Score */}
          {profile.match_score !== null && profile.match_score !== undefined && (
            <div className="flex flex-col items-end">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${getScoreBadgeColor(profile.match_score)}`}>
                <Sparkles className="w-3 h-3 text-forest-700" />
                {profile.match_score}% Match
              </span>
              <button
                onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}
                className="text-[11px] font-semibold text-charcoal-500 hover:text-forest-700 flex items-center gap-0.5 mt-1 cursor-pointer"
              >
                <span>Breakdown</span>
                {showScoreBreakdown ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
          )}
        </div>

        {/* Detailed 100-Point Score Breakdown Drawer */}
        {showScoreBreakdown && profile.match_score !== null && profile.match_score !== undefined && (
          <div className="mb-4 p-3.5 bg-forest-50/60 rounded-xl border border-forest-200/80 text-xs space-y-2 animate-in fade-in duration-200">
            <p className="font-bold text-forest-900 flex items-center justify-between">
              <span>Rule-Based Compatibility Breakdown</span>
              <span className="text-forest-700">{profile.match_score}/100 Pts</span>
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-charcoal-600">
              <div className="flex justify-between">
                <span>City Match:</span>
                <span className="font-semibold">{profile.city_score ?? 0}/25</span>
              </div>
              <div className="flex justify-between">
                <span>Budget Overlap:</span>
                <span className="font-semibold">{profile.budget_score ?? 0}/25</span>
              </div>
              <div className="flex justify-between">
                <span>Diet / Food:</span>
                <span className="font-semibold">{profile.food_score ?? 0}/15</span>
              </div>
              <div className="flex justify-between">
                <span>Smoking Habit:</span>
                <span className="font-semibold">{profile.smoking_score ?? 0}/10</span>
              </div>
              <div className="flex justify-between">
                <span>Pet Policy:</span>
                <span className="font-semibold">{profile.pets_score ?? 0}/10</span>
              </div>
              <div className="flex justify-between">
                <span>Sleep Schedule:</span>
                <span className="font-semibold">{profile.sleep_score ?? 0}/10</span>
              </div>
              <div className="flex justify-between col-span-2">
                <span>Cleanliness Standard:</span>
                <span className="font-semibold">{profile.cleanliness_score ?? 0}/5</span>
              </div>
            </div>
          </div>
        )}

        {/* Budget Pill */}
        <div className="mb-4 bg-cream-100 rounded-xl p-3 border border-cream-200 flex items-center justify-between text-xs">
          <span className="text-charcoal-500 font-medium">Monthly Budget</span>
          <span className="font-bold text-forest-900 text-sm">
            ₹{Number(profile.budget_min).toLocaleString('en-IN')} – ₹{Number(profile.budget_max).toLocaleString('en-IN')}
          </span>
        </div>

        {/* Lifestyle Attributes Pills */}
        <div className="space-y-2 mb-6">
          <p className="text-[11px] font-bold uppercase tracking-wider text-charcoal-400">Lifestyle Profile</p>
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-white border border-cream-200 text-charcoal-700">
              <Utensils className="w-3 h-3 text-forest-600" />
              <span className="capitalize">{formatPreference(profile.food_preference)}</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-white border border-cream-200 text-charcoal-700">
              <Cigarette className="w-3 h-3 text-amber-600" />
              <span className="capitalize">{formatPreference(profile.smoking_preference)}</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-white border border-cream-200 text-charcoal-700">
              <Dog className="w-3 h-3 text-emerald-600" />
              <span className="capitalize">{formatPreference(profile.pets_preference)}</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-white border border-cream-200 text-charcoal-700">
              <Moon className="w-3 h-3 text-indigo-600" />
              <span className="capitalize">{formatPreference(profile.sleep_schedule)} sleep</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-white border border-cream-200 text-charcoal-700">
              <Sparkles className="w-3 h-3 text-teal-600" />
              <span className="capitalize">{formatPreference(profile.cleanliness_preference)} clean</span>
            </span>
          </div>
        </div>
      </div>

      {/* Action / Connection Status Footer */}
      <div className="pt-4 border-t border-cream-200">
        {user?.user_id === profile.user_id ? (
          <span className="block text-center py-2 text-xs font-semibold text-charcoal-400 bg-cream-100 rounded-xl">
            This is your profile
          </span>
        ) : profile.connection_direction === 'outgoing' ? (
          <div className="flex items-center justify-center gap-2 py-2 text-xs font-semibold text-blue-800 bg-blue-50 border border-blue-200 rounded-xl">
            <Clock className="w-3.5 h-3.5" />
            <span>Connection Request Sent ({profile.request_status || 'Pending'})</span>
          </div>
        ) : profile.connection_direction === 'incoming' ? (
          <div className="flex items-center justify-center gap-2 py-2 text-xs font-semibold text-forest-800 bg-forest-50 border border-forest-200 rounded-xl">
            <Check className="w-3.5 h-3.5" />
            <span>Sent You a Connection Request</span>
          </div>
        ) : (
          <button
            onClick={() => onRequestConnect(profile.user_id)}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-forest-800 hover:bg-forest-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Request Connection</span>
          </button>
        )}
      </div>
    </div>
  );
};
