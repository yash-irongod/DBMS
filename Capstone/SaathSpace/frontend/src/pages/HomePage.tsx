import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Search, Building2, Users, ShieldCheck, MapPin, 
  ArrowRight, Sparkles, Database, CheckCircle2, SlidersHorizontal 
} from 'lucide-react';
import { api } from '../services/api';
import { City, Listing } from '../types';
import { ListingCard } from '../components/ListingCard';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [cities, setCities] = useState<City[]>([]);
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Search form state
  const [selectedCityId, setSelectedCityId] = useState<string>('');
  const [selectedKind, setSelectedKind] = useState<string>('all');
  const [maxRent, setMaxRent] = useState<string>('');

  useEffect(() => {
    Promise.all([
      api.getCities(),
      api.getFeaturedListings()
    ]).then(([cityData, listingData]) => {
      setCities(cityData.cities || []);
      setFeaturedListings(listingData.featured_listings || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedCityId) params.append('city_id', selectedCityId);
    if (selectedKind && selectedKind !== 'all') params.append('listing_kind', selectedKind);
    if (maxRent) params.append('max_rent', maxRent);
    navigate(`/listings?${params.toString()}`);
  };

  return (
    <div className="space-y-20 pb-16">
      
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-32 overflow-hidden border-b border-cream-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-forest-100 text-forest-800 border border-forest-200">
              <Sparkles className="w-3.5 h-3.5 text-forest-700" />
              <span>Smart Room & Roommate Discovery</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-charcoal-900 font-serif tracking-tight leading-[1.15]">
              Find your space. <br />
              <span className="text-forest-800 italic font-normal">Find your people.</span>
            </h1>

            <p className="text-base sm:text-lg text-charcoal-600 max-w-2xl mx-auto leading-relaxed">
              Explore 12,847 rental properties across Delhi, Mumbai, and Pune. Discover verified rooms and connect with compatible roommates using lifestyle-driven matching.
            </p>

            {/* Room Search Form */}
            <div className="pt-4">
              <form 
                onSubmit={handleSearchSubmit}
                className="bg-white rounded-3xl p-3 sm:p-4 shadow-elevated border border-cream-200 grid grid-cols-1 sm:grid-cols-4 gap-3 text-left"
              >
                {/* City Picker */}
                <div className="p-2 sm:border-r border-cream-200">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-charcoal-400 mb-1">
                    City
                  </label>
                  <select
                    value={selectedCityId}
                    onChange={(e) => setSelectedCityId(e.target.value)}
                    className="w-full text-sm font-semibold text-charcoal-900 bg-transparent focus:outline-none cursor-pointer"
                  >
                    <option value="">All Metros</option>
                    {cities.map((c) => (
                      <option key={c.city_id} value={c.city_id}>
                        {c.city_name} ({c.total_listings.toLocaleString()} rooms)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Room Type */}
                <div className="p-2 sm:border-r border-cream-200">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-charcoal-400 mb-1">
                    Property Type
                  </label>
                  <select
                    value={selectedKind}
                    onChange={(e) => setSelectedKind(e.target.value)}
                    className="w-full text-sm font-semibold text-charcoal-900 bg-transparent focus:outline-none cursor-pointer"
                  >
                    <option value="all">Any Type</option>
                    <option value="entire_unit">Entire Apartment</option>
                    <option value="private_room">Private Room</option>
                    <option value="shared_room">Shared Room</option>
                    <option value="pg_hostel">PG / Hostel</option>
                  </select>
                </div>

                {/* Maximum Budget */}
                <div className="p-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-charcoal-400 mb-1">
                    Max Monthly Rent
                  </label>
                  <select
                    value={maxRent}
                    onChange={(e) => setMaxRent(e.target.value)}
                    className="w-full text-sm font-semibold text-charcoal-900 bg-transparent focus:outline-none cursor-pointer"
                  >
                    <option value="">Any Budget</option>
                    <option value="10000">Up to ₹10,000</option>
                    <option value="15000">Up to ₹15,000</option>
                    <option value="25000">Up to ₹25,000</option>
                    <option value="40000">Up to ₹40,000</option>
                    <option value="60000">Up to ₹60,000</option>
                  </select>
                </div>

                {/* Submit Action */}
                <div className="flex items-center">
                  <button
                    type="submit"
                    className="w-full h-full min-h-[46px] bg-forest-800 hover:bg-forest-900 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                    <span>Search Rooms</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Quick stats badges */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-xs text-charcoal-500 font-medium">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-forest-700" />
                12,847 Cleaned PostgreSQL Records
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-forest-700" />
                Transparent Availability Governance
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-forest-700" />
                100-Point Roommate Match Algorithm
              </span>
            </div>

          </div>
        </div>
      </section>

      {/* Browse by City Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-forest-800">Metropolitan Coverage</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 font-serif">Explore by City</h2>
          </div>
          <p className="text-sm text-charcoal-500 max-w-md">
            Normalized localities, price statistics, and room inventory across the 3 core supported cities.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {cities.map((city) => (
            <Link
              key={city.city_id}
              to={`/listings?city_id=${city.city_id}`}
              className="group bg-white rounded-3xl p-6 border border-cream-200 shadow-subtle hover:shadow-premium transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-2xl bg-forest-50 text-forest-800 flex items-center justify-center mb-5 group-hover:bg-forest-800 group-hover:text-white transition-colors">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-charcoal-900 font-serif mb-1 group-hover:text-forest-800 transition-colors">
                {city.city_name}
              </h3>
              <p className="text-xs text-charcoal-500 mb-4">
                {city.total_listings.toLocaleString()} rental listings catalogued
              </p>
              
              <div className="pt-4 border-t border-cream-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-charcoal-400 block text-[10px] uppercase font-bold tracking-wider">Average Rent</span>
                  <span className="text-forest-900 font-bold text-sm">
                    {city.avg_rent ? `₹${Math.round(city.avg_rent).toLocaleString('en-IN')}` : 'N/A'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-charcoal-400 block text-[10px] uppercase font-bold tracking-wider">Price Range</span>
                  <span className="text-charcoal-700 font-medium">
                    {city.min_rent && city.max_rent ? `₹${Math.round(city.min_rent).toLocaleString()}–₹${Math.round(city.max_rent).toLocaleString()}` : 'Live'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Listings Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-forest-800">Curated Inventory</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 font-serif">Featured Listings</h2>
          </div>
          <Link
            to="/listings"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-forest-800 hover:text-forest-900 group"
          >
            <span>View all 12,847 listings</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredListings.map((listing) => (
              <ListingCard key={listing.listing_id} listing={listing} />
            ))}
          </div>
        )}
      </section>

      {/* Roommate Compatibility Feature Callout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-forest-900 to-charcoal-900 rounded-3xl p-8 sm:p-12 lg:p-16 text-white shadow-elevated relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-10 translate-y-10 pointer-events-none">
            <Users className="w-96 h-96 text-white" />
          </div>

          <div className="max-w-2xl relative z-10 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-forest-800/80 text-forest-200 border border-forest-700">
              <Sparkles className="w-3.5 h-3.5 text-forest-300" />
              <span>Transparent Matching Algorithm</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold font-serif tracking-tight leading-tight">
              Looking for a room? <br />
              <span className="text-forest-200">Match with someone who lives like you.</span>
            </h2>

            <p className="text-sm sm:text-base text-forest-100/90 leading-relaxed">
              No black-box recommendations. SaathSpace evaluates lifestyle compatibility across 7 concrete dimensions: city, budget overlap, food/diet, smoking habits, pets, sleep patterns, and cleanliness preferences.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 text-xs">
              <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs border border-white/10">
                <span className="font-bold block text-sm text-forest-200">25 Pts</span>
                <span>City & Location</span>
              </div>
              <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs border border-white/10">
                <span className="font-bold block text-sm text-forest-200">25 Pts</span>
                <span>Budget Overlap</span>
              </div>
              <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs border border-white/10">
                <span className="font-bold block text-sm text-forest-200">50 Pts</span>
                <span>Lifestyle Habits</span>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap gap-4">
              <Link
                to="/roommates"
                className="px-6 py-3.5 rounded-2xl bg-white text-forest-950 font-bold text-sm hover:bg-forest-100 transition-colors shadow-sm"
              >
                Find Compatible Roommates
              </Link>
              <Link
                to="/dashboard"
                className="px-6 py-3.5 rounded-2xl bg-forest-800/80 hover:bg-forest-800 text-white font-bold text-sm border border-forest-700 transition-colors"
              >
                Set Your Preferences
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Governance & Academic Transparency Card */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-amber-50/60 border border-amber-200 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-amber-700" />
              <span>Strict Data Integrity & Historical Transparency Notice</span>
            </div>
            <p className="text-xs sm:text-sm text-amber-800/90 leading-relaxed">
              Imported public listings (12,847 records) are explicitly designated as historical and unverified. SaathSpace strictly forbids fabricated bookings or claiming unverified listings as currently available. Only owner-created listings managed through the Property Owner Portal are eligible for verified availability.
            </p>
          </div>
          <Link
            to="/owner"
            className="flex-shrink-0 px-4 py-2.5 rounded-xl bg-amber-900 hover:bg-amber-950 text-white font-bold text-xs transition-colors shadow-xs"
          >
            Owner Portal & Verification
          </Link>
        </div>
      </section>

    </div>
  );
};
