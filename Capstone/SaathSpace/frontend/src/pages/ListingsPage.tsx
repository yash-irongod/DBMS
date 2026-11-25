import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, Filter, X, ChevronLeft, ChevronRight, 
  Building2, SlidersHorizontal, ShieldCheck, AlertCircle 
} from 'lucide-react';
import { api } from '../services/api';
import { Listing, City, Locality, Amenity } from '../types';
import { ListingCard } from '../components/ListingCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';

export const ListingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Reference data
  const [cities, setCities] = useState<City[]>([]);
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);

  // Listings & pagination
  const [listings, setListings] = useState<Listing[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, per_page: 12, total_pages: 1 });
  const [loading, setLoading] = useState<boolean>(true);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState<boolean>(false);

  // Filter state
  const cityId = searchParams.get('city_id') || '';
  const localityId = searchParams.get('locality_id') || '';
  const minRent = searchParams.get('min_rent') || '';
  const maxRent = searchParams.get('max_rent') || '';
  const listingKind = searchParams.get('listing_kind') || 'all';
  const bedrooms = searchParams.get('bedrooms') || '';
  const furnishing = searchParams.get('furnishing_status') || 'all';
  const dataOrigin = searchParams.get('data_origin') || 'all';
  const sortBy = searchParams.get('sort_by') || 'price_asc';
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const selectedAmenities = searchParams.get('amenity_ids') 
    ? searchParams.get('amenity_ids')!.split(',').map(Number) 
    : [];

  // Load cities and amenities once
  useEffect(() => {
    Promise.all([
      api.getCities(),
      api.getAmenities()
    ]).then(([cityData, amenityData]) => {
      setCities(cityData.cities || []);
      setAmenities(amenityData.amenities || []);
    }).catch(console.error);
  }, []);

  // Load localities when city changes
  useEffect(() => {
    if (cityId) {
      api.getLocalities(parseInt(cityId, 10)).then(data => {
        setLocalities(data.localities || []);
      }).catch(console.error);
    } else {
      setLocalities([]);
    }
  }, [cityId]);

  // Fetch listings on query change
  useEffect(() => {
    setLoading(true);
    api.getListings({
      city_id: cityId ? parseInt(cityId, 10) : undefined,
      locality_id: localityId ? parseInt(localityId, 10) : undefined,
      min_rent: minRent ? parseFloat(minRent) : undefined,
      max_rent: maxRent ? parseFloat(maxRent) : undefined,
      listing_kind: listingKind !== 'all' ? listingKind : undefined,
      bedrooms: bedrooms !== '' ? parseInt(bedrooms, 10) : undefined,
      furnishing_status: furnishing !== 'all' ? furnishing : undefined,
      data_origin: dataOrigin !== 'all' ? dataOrigin : undefined,
      amenity_ids: selectedAmenities.length > 0 ? selectedAmenities.join(',') : undefined,
      search: search || undefined,
      sort_by: sortBy,
      page: page,
      per_page: 12,
    }).then(data => {
      setListings(data.listings || []);
      setPagination(data.pagination);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [searchParams]);

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.set('page', '1'); // Reset to page 1 on filter update
    setSearchParams(next);
  };

  const handleAmenityToggle = (id: number) => {
    const next = new URLSearchParams(searchParams);
    let updated: number[];
    if (selectedAmenities.includes(id)) {
      updated = selectedAmenities.filter(x => x !== id);
    } else {
      updated = [...selectedAmenities, id];
    }
    if (updated.length > 0) {
      next.set('amenity_ids', updated.join(','));
    } else {
      next.delete('amenity_ids');
    }
    next.set('page', '1');
    setSearchParams(next);
  };

  const resetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const activeFilterCount = [
    cityId, localityId, minRent, maxRent, 
    listingKind !== 'all' ? listingKind : '',
    bedrooms, furnishing !== 'all' ? furnishing : '',
    dataOrigin !== 'all' ? dataOrigin : '',
    selectedAmenities.length > 0 ? 'amenities' : '',
    search
  ].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Header & Search Input */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-cream-200">
        <div>
          <h1 className="text-3xl font-extrabold text-charcoal-900 font-serif">Room Discovery</h1>
          <p className="text-sm text-charcoal-500 mt-1">
            Browse through 12,847 verified and historical property listings in Delhi, Mumbai, and Pune.
          </p>
        </div>

        {/* Global Search Bar */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search locality, title, or area..."
              value={search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/20 focus:border-forest-700"
            />
            {search && (
              <button
                onClick={() => updateFilter('search', '')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => setFilterDrawerOpen(!filterDrawerOpen)}
            className="md:hidden flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-cream-300 text-sm font-semibold text-charcoal-700"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters {activeFilterCount > 0 && `(${activeFilterCount})`}</span>
          </button>
        </div>
      </div>

      {/* Main Content Layout: Sidebar Filters + Listings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Desktop Filters Sidebar */}
        <div className={`lg:block ${filterDrawerOpen ? 'block' : 'hidden'} bg-white border border-cream-200 rounded-2xl p-6 shadow-subtle space-y-6 lg:sticky lg:top-24`}>
          <div className="flex items-center justify-between pb-4 border-b border-cream-200">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-forest-700" />
              <h3 className="font-bold text-charcoal-900 text-sm">Refine Search</h3>
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
              >
                Clear all ({activeFilterCount})
              </button>
            )}
          </div>

          {/* City Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-charcoal-400">City</label>
            <select
              value={cityId}
              onChange={(e) => {
                updateFilter('city_id', e.target.value);
                updateFilter('locality_id', '');
              }}
              className="w-full px-3 py-2 bg-cream-50 border border-cream-200 rounded-xl text-sm font-medium text-charcoal-800 focus:outline-none focus:border-forest-600"
            >
              <option value="">All Supported Cities</option>
              {cities.map((c) => (
                <option key={c.city_id} value={c.city_id}>{c.city_name}</option>
              ))}
            </select>
          </div>

          {/* Locality Filter (if city selected) */}
          {cityId && localities.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-charcoal-400">Locality</label>
              <select
                value={localityId}
                onChange={(e) => updateFilter('locality_id', e.target.value)}
                className="w-full px-3 py-2 bg-cream-50 border border-cream-200 rounded-xl text-sm font-medium text-charcoal-800 focus:outline-none focus:border-forest-600"
              >
                <option value="">All Localities in City</option>
                {localities.map((l) => (
                  <option key={l.locality_id} value={l.locality_id}>{l.locality_name} ({l.listing_count})</option>
                ))}
              </select>
            </div>
          )}

          {/* Property Kind */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-charcoal-400">Room Type</label>
            <select
              value={listingKind}
              onChange={(e) => updateFilter('listing_kind', e.target.value)}
              className="w-full px-3 py-2 bg-cream-50 border border-cream-200 rounded-xl text-sm font-medium text-charcoal-800 focus:outline-none focus:border-forest-600"
            >
              <option value="all">Any Room Type</option>
              <option value="entire_unit">Entire Apartment</option>
              <option value="private_room">Private Room</option>
              <option value="shared_room">Shared Room</option>
              <option value="pg_hostel">PG / Hostel</option>
            </select>
          </div>

          {/* Monthly Budget Range */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-charcoal-400">Monthly Rent (₹)</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min ₹"
                value={minRent}
                onChange={(e) => updateFilter('min_rent', e.target.value)}
                className="w-full px-3 py-2 bg-cream-50 border border-cream-200 rounded-xl text-sm text-charcoal-800 focus:outline-none"
              />
              <input
                type="number"
                placeholder="Max ₹"
                value={maxRent}
                onChange={(e) => updateFilter('max_rent', e.target.value)}
                className="w-full px-3 py-2 bg-cream-50 border border-cream-200 rounded-xl text-sm text-charcoal-800 focus:outline-none"
              />
            </div>
          </div>

          {/* Bedrooms */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-charcoal-400">Bedrooms</label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: 'Any', val: '' },
                { label: '1 BHK', val: '1' },
                { label: '2 BHK', val: '2' },
                { label: '3+ BHK', val: '3' },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => updateFilter('bedrooms', opt.val)}
                  className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    bedrooms === opt.val
                      ? 'bg-forest-800 text-white border-forest-800'
                      : 'bg-cream-50 text-charcoal-700 border-cream-200 hover:bg-cream-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Furnishing */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-charcoal-400">Furnishing</label>
            <select
              value={furnishing}
              onChange={(e) => updateFilter('furnishing_status', e.target.value)}
              className="w-full px-3 py-2 bg-cream-50 border border-cream-200 rounded-xl text-sm font-medium text-charcoal-800 focus:outline-none focus:border-forest-600"
            >
              <option value="all">Any Furnishing</option>
              <option value="furnished">Furnished</option>
              <option value="semi_furnished">Semi-Furnished</option>
              <option value="unfurnished">Unfurnished</option>
            </select>
          </div>

          {/* Provenance: Verified vs Historical */}
          <div className="space-y-1.5 pt-2 border-t border-cream-200">
            <label className="text-xs font-bold uppercase tracking-wider text-charcoal-400">Inventory Origin</label>
            <div className="space-y-1">
              {[
                { label: 'All Listings', val: 'all' },
                { label: 'Verified Owner Listings', val: 'user_submitted' },
                { label: 'Historical Dataset Only', val: 'public_dataset' },
              ].map((originOpt) => (
                <label key={originOpt.val} className="flex items-center gap-2 text-xs font-medium text-charcoal-700 cursor-pointer py-1">
                  <input
                    type="radio"
                    name="data_origin"
                    checked={dataOrigin === originOpt.val}
                    onChange={() => updateFilter('data_origin', originOpt.val)}
                    className="accent-forest-700"
                  />
                  <span>{originOpt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Standard Amenities (for verified listings) */}
          <div className="space-y-2 pt-2 border-t border-cream-200">
            <label className="text-xs font-bold uppercase tracking-wider text-charcoal-400">Confirmed Amenities</label>
            <p className="text-[11px] text-charcoal-400">Applies to verified owner listings</p>
            <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1">
              {amenities.map((a) => (
                <label key={a.amenity_id} className="flex items-center gap-1.5 text-xs text-charcoal-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedAmenities.includes(a.amenity_id)}
                    onChange={() => handleAmenityToggle(a.amenity_id)}
                    className="rounded border-cream-300 text-forest-700 focus:ring-forest-600"
                  />
                  <span className="truncate">{a.amenity_name}</span>
                </label>
              ))}
            </div>
          </div>

        </div>

        {/* Listings Grid Area */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Controls Bar: Results Count + Sort By */}
          <div className="bg-white border border-cream-200 rounded-2xl px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-subtle">
            <p className="text-xs font-semibold text-charcoal-600">
              Showing <span className="text-forest-900 font-bold">{listings.length}</span> of <span className="text-charcoal-900 font-bold">{pagination.total.toLocaleString()}</span> properties
            </p>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal-400">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => updateFilter('sort_by', e.target.value)}
                className="px-3 py-1.5 bg-cream-50 border border-cream-200 rounded-xl text-xs font-semibold text-charcoal-800 focus:outline-none cursor-pointer"
              >
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="verified_first">Verified Owners First</option>
                <option value="size_desc">Property Size: Largest</option>
                <option value="newest">Newest Listed</option>
              </select>
            </div>
          </div>

          {/* Results Grid */}
          {loading ? (
            <LoadingSpinner message="Searching 12,847 listings..." />
          ) : listings.length === 0 ? (
            <EmptyState
              title="No properties matched your criteria"
              description="Try broadening your rent range, changing the city, or clearing the amenity filters to see more results."
              actionText="Reset All Filters"
              onAction={resetFilters}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {listings.map((item) => (
                <ListingCard key={item.listing_id} listing={item} />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {pagination.total_pages > 1 && (
            <div className="pt-6 flex items-center justify-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => updateFilter('page', (pagination.page - 1).toString())}
                className="p-2 rounded-xl border border-cream-200 bg-white text-charcoal-600 hover:bg-cream-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Previous page"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <span className="px-4 py-2 rounded-xl bg-white border border-cream-200 text-xs font-bold text-charcoal-800">
                Page {pagination.page} of {pagination.total_pages.toLocaleString()}
              </span>

              <button
                disabled={pagination.page >= pagination.total_pages}
                onClick={() => updateFilter('page', (pagination.page + 1).toString())}
                className="p-2 rounded-xl border border-cream-200 bg-white text-charcoal-600 hover:bg-cream-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Next page"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
