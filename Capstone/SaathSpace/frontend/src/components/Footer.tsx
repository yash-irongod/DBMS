import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Database, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-forest-900 text-cream-100 border-t border-forest-800 pt-16 pb-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-forest-800">
          
          {/* Brand Column */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-forest-700 flex items-center justify-center text-forest-100">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold font-serif tracking-tight text-white">SaathSpace</span>
            </div>
            <p className="text-sm text-forest-200/80 leading-relaxed">
              Find your space. Find your people. A database-first platform for discovering verified rooms and compatible roommates.
            </p>
            <div className="flex items-center gap-2 text-xs text-forest-300 font-medium">
              <Database className="w-3.5 h-3.5 text-forest-400" />
              <span>PostgreSQL 18 • 12,847 Cleaned Records</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-forest-300 mb-4">Discovery</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/listings?city_id=1" className="text-forest-100/80 hover:text-white transition-colors">
                  Rooms in Delhi
                </Link>
              </li>
              <li>
                <Link to="/listings?city_id=2" className="text-forest-100/80 hover:text-white transition-colors">
                  Rooms in Mumbai
                </Link>
              </li>
              <li>
                <Link to="/listings?city_id=3" className="text-forest-100/80 hover:text-white transition-colors">
                  Rooms in Pune
                </Link>
              </li>
              <li>
                <Link to="/listings?data_origin=user_submitted" className="text-forest-100/80 hover:text-white transition-colors flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-forest-400" />
                  Verified Owner Listings
                </Link>
              </li>
            </ul>
          </div>

          {/* Roommates */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-forest-300 mb-4">Roommates</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/roommates" className="text-forest-100/80 hover:text-white transition-colors">
                  Find Roommates
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-forest-100/80 hover:text-white transition-colors">
                  Lifestyle Compatibility
                </Link>
              </li>
              <li>
                <Link to="/owner" className="text-forest-100/80 hover:text-white transition-colors">
                  Property Owner Portal
                </Link>
              </li>
              <li>
                <Link to="/admin" className="text-forest-100/80 hover:text-white transition-colors">
                  DBMS Analytics & Schema
                </Link>
              </li>
            </ul>
          </div>

          {/* Data Provenance & Academic note */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-forest-300 mb-4">Data Governance</h4>
            <div className="bg-forest-800/60 border border-forest-700/60 rounded-xl p-4 text-xs text-forest-200/90 space-y-2">
              <p className="font-semibold text-white">Historical Data Integrity</p>
              <p className="leading-relaxed">
                Imported properties are classified as historical dataset records (`data_origin='public_dataset'`). Availability is unverified unless explicitly published and managed by an owner.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-forest-300/80 gap-4">
          <p>© {new Date().getFullYear()} SaathSpace DBMS Project. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Built with relational rigor &</span>
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400 inline" />
            <span>in PostgreSQL 18</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
