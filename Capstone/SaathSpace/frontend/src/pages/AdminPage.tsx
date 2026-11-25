import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, CartesianGrid 
} from 'recharts';
import { 
  Database, Building2, Users, ShieldCheck, 
  BarChart3, Activity, Layers, ArrowUpRight 
} from 'lucide-react';
import { api } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const AdminPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.getAdminAnalytics()
      .then(data => setAnalytics(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-20"><LoadingSpinner message="Calculating database analytics..." /></div>;
  if (!analytics) return <div className="py-20 text-center">Failed to load analytics.</div>;

  const { totals, city_stats, status_distribution, kind_distribution, recent_users } = analytics;

  const COLORS = ['#1B4332', '#2D6A4F', '#40916C', '#52B788', '#D8EDE3', '#A89F91'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-cream-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-forest-100 text-forest-800 border border-forest-200 mb-2">
            <Database className="w-3.5 h-3.5 text-forest-700" />
            <span>PostgreSQL 18 Relational Intelligence</span>
          </div>
          <h1 className="text-3xl font-extrabold text-charcoal-900 font-serif">DBMS Analytics & Auditing</h1>
          <p className="text-sm text-charcoal-500 mt-1">
            Real-time analytics querying `app` and `staging` schemas. Clearly distinguishing historical dataset records from live owner inventory.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-white border border-cream-300 rounded-xl text-charcoal-600">
          <Activity className="w-4 h-4 text-emerald-600" />
          <span>Live Database Connected</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-6 border border-cream-200 shadow-subtle space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal-400">Total Listings</span>
            <Building2 className="w-4 h-4 text-forest-700" />
          </div>
          <p className="text-3xl font-extrabold text-charcoal-900 font-serif">
            {Number(totals.total_listings).toLocaleString()}
          </p>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-cream-200">
            <span className="text-charcoal-500">Historical: {Number(totals.historical_listings).toLocaleString()}</span>
            <span className="text-forest-800 font-bold">Live: {Number(totals.live_owner_listings).toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-cream-200 shadow-subtle space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal-400">Total Users</span>
            <Users className="w-4 h-4 text-forest-700" />
          </div>
          <p className="text-3xl font-extrabold text-charcoal-900 font-serif">
            {totals.total_users}
          </p>
          <p className="text-xs text-charcoal-500 pt-1 border-t border-cream-200">
            {totals.total_roommate_profiles} Roommate Lifestyle Profiles
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-cream-200 shadow-subtle space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal-400">Tenant Enquiries</span>
            <Activity className="w-4 h-4 text-forest-700" />
          </div>
          <p className="text-3xl font-extrabold text-charcoal-900 font-serif">
            {totals.total_enquiries}
          </p>
          <p className="text-xs text-charcoal-500 pt-1 border-t border-cream-200">
            Across {totals.total_saved_listings} Saved Bookmarks
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-cream-200 shadow-subtle space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal-400">Roommate Requests</span>
            <ShieldCheck className="w-4 h-4 text-forest-700" />
          </div>
          <p className="text-3xl font-extrabold text-charcoal-900 font-serif">
            {totals.total_roommate_requests}
          </p>
          <p className="text-xs text-charcoal-500 pt-1 border-t border-cream-200">
            Evaluated by 100-pt algorithm
          </p>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Chart 1: Average Listed Rent by City */}
        <div className="bg-white rounded-3xl p-6 border border-cream-200 shadow-subtle space-y-4">
          <div>
            <h3 className="text-base font-bold text-charcoal-900 font-serif">Average Listed Rent by City (₹)</h3>
            <p className="text-xs text-charcoal-500">Comparing rental distributions across supported metropolitan centers</p>
          </div>
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={city_stats} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EFEAE0" vertical={false} />
                <XAxis dataKey="city_name" stroke="#5A6360" fontSize={12} tickLine={false} />
                <YAxis stroke="#5A6360" fontSize={12} tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip 
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Average Rent']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #EFEAE0' }}
                />
                <Bar dataKey="combined_avg_rent" name="Combined Avg Rent" fill="#1B4332" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Property Kind Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-cream-200 shadow-subtle space-y-4">
          <div>
            <h3 className="text-base font-bold text-charcoal-900 font-serif">Listing Kind Distribution</h3>
            <p className="text-xs text-charcoal-500">Breakdown of apartments, private rooms, and shared hostel units</p>
          </div>
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={kind_distribution}
                  dataKey="count"
                  nameKey="listing_kind"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  paddingAngle={3}
                >
                  {kind_distribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val: any, name: any) => [`${Number(val).toLocaleString()} listings`, name.replace(/_/g, ' ')]}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #EFEAE0' }}
                />
                <Legend 
                  formatter={(val: string) => <span className="text-xs text-charcoal-700 capitalize">{val.replace(/_/g, ' ')}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Schema Provenance & Pipeline Summary */}
      <div className="bg-white rounded-3xl p-8 border border-cream-200 shadow-subtle space-y-6">
        <div>
          <h3 className="text-lg font-bold text-charcoal-900 font-serif">PostgreSQL Architecture & Schemas Audit</h3>
          <p className="text-xs text-charcoal-500 mt-1">
            Overview of the 3 schemas and 10 core application tables running on this local database instance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-cream-50 rounded-2xl border border-cream-200 space-y-2">
            <span className="font-bold text-forest-900 block text-sm">Schema: `staging`</span>
            <p className="text-charcoal-600">Preserves original raw CSV text rows without mutations.</p>
            <ul className="space-y-1 font-mono text-[11px] text-charcoal-700">
              <li>• rental_listings_raw (13,910 rows)</li>
              <li>• v_rental_listings_cleaned (12,847 rows)</li>
            </ul>
          </div>

          <div className="p-4 bg-cream-50 rounded-2xl border border-cream-200 space-y-2">
            <span className="font-bold text-forest-900 block text-sm">Schema: `app` (Core 3NF)</span>
            <p className="text-charcoal-600">10 normalized operational tables with strict FKs & checks.</p>
            <ul className="space-y-1 font-mono text-[11px] text-charcoal-700">
              <li>• city, locality, app_user</li>
              <li>• listing, amenity, listing_amenity</li>
              <li>• roommate_profile, saved_listing</li>
              <li>• enquiry, roommate_request</li>
            </ul>
          </div>

          <div className="p-4 bg-cream-50 rounded-2xl border border-cream-200 space-y-2">
            <span className="font-bold text-forest-900 block text-sm">Data Origin Governance</span>
            <p className="text-charcoal-600">Strict database segregation rules prevent false claims:</p>
            <ul className="space-y-1 text-charcoal-700">
              <li>• `public_dataset`: unverified; direct booking blocked</li>
              <li>• `user_submitted`: verified availability managed by owner</li>
              <li>• `synthetic_demo`: clearly labeled test personas</li>
            </ul>
          </div>
        </div>
      </div>

      {/* User Directory Overview */}
      <div className="bg-white rounded-3xl p-8 border border-cream-200 shadow-subtle space-y-4">
        <h3 className="text-lg font-bold text-charcoal-900 font-serif">Registered Users & Test Personas</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-charcoal-700">
            <thead className="bg-cream-100 text-charcoal-400 uppercase font-bold tracking-wider">
              <tr>
                <th className="p-3 rounded-l-xl">User ID</th>
                <th className="p-3">Full Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Target City</th>
                <th className="p-3">Listings Posted</th>
                <th className="p-3 rounded-r-xl">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200">
              {recent_users.map((u: any) => (
                <tr key={u.user_id} className="hover:bg-cream-50/60">
                  <td className="p-3 font-mono font-bold text-forest-900">#{u.user_id}</td>
                  <td className="p-3 font-semibold text-charcoal-900">{u.full_name}</td>
                  <td className="p-3 text-charcoal-500">{u.email}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-forest-100 text-forest-800">
                      {u.account_role}
                    </span>
                  </td>
                  <td className="p-3">{u.preferred_city || 'Not set'}</td>
                  <td className="p-3 font-bold text-charcoal-900">{u.listings_posted}</td>
                  <td className="p-3 text-charcoal-400">{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
