import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Building2, Users, LayoutDashboard, PlusCircle, 
  BarChart3, LogIn, LogOut, Menu, X, Sparkles, User as UserIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const Navbar: React.FC = () => {
  const { user, logout, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);
  const [demoUsers, setDemoUsers] = useState<any[]>([]);

  useEffect(() => {
    api.getDemoUsers().then(data => {
      setDemoUsers(data.demo_accounts || []);
    }).catch(() => {});
  }, []);

  const handleDemoLogin = async (email: string) => {
    try {
      await login(email, 'Demo@123');
      setDemoMenuOpen(false);
      setMobileMenuOpen(false);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    }
  };

  const navLinks = [
    { label: 'Discover Rooms', path: '/listings', icon: Building2 },
    { label: 'Find Roommates', path: '/roommates', icon: Users },
    { label: 'Admin & Analytics', path: '/admin', icon: BarChart3 },
    { label: 'Post a Room', path: '/owner', icon: PlusCircle },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-cream-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-forest-800 flex items-center justify-center text-white shadow-sm group-hover:bg-forest-900 transition-colors">
              <Building2 className="w-5 h-5 text-forest-100" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-forest-900 font-serif">SaathSpace</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-forest-100 text-forest-800">DBMS</span>
              </div>
              <p className="text-[11px] font-medium text-charcoal-500 tracking-tight hidden sm:block">Find your space. Find your people.</p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive(link.path)
                      ? 'bg-forest-50 text-forest-800 font-bold border border-forest-200/60 shadow-xs'
                      : 'text-charcoal-600 hover:text-charcoal-900 hover:bg-cream-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive(link.path) ? 'text-forest-700' : 'text-charcoal-400'}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            
            {/* Quick Demo Personas Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDemoMenuOpen(!demoMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-forest-50 text-forest-800 border border-forest-200 hover:bg-forest-100 transition-colors cursor-pointer"
                title="Switch between the 4 Phase 1 Demo Personas"
              >
                <Sparkles className="w-3.5 h-3.5 text-forest-600" />
                <span>Demo Personas</span>
              </button>

              {demoMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-elevated border border-cream-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3.5 py-2 border-b border-cream-200 text-xs text-charcoal-500">
                    <span className="font-bold text-charcoal-800 block">Instant 1-Click Demo Login</span>
                    Switch testing profiles on the live database
                  </div>
                  {demoUsers.map((u) => (
                    <button
                      key={u.user_id}
                      onClick={() => handleDemoLogin(u.email)}
                      className="w-full text-left px-3.5 py-2 hover:bg-forest-50 flex items-center justify-between transition-colors group cursor-pointer"
                    >
                      <div>
                        <p className="text-sm font-semibold text-charcoal-900 group-hover:text-forest-900">{u.full_name}</p>
                        <p className="text-xs text-charcoal-500">{u.preferred_city || 'Delhi'} • ₹{u.budget_min?.toLocaleString()}–₹{u.budget_max?.toLocaleString()}</p>
                      </div>
                      <span className="text-[10px] font-bold text-forest-700 uppercase bg-forest-100 px-1.5 py-0.5 rounded">Login</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Profile or Auth Buttons */}
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold text-forest-900 bg-cream-100 hover:bg-cream-200 border border-cream-200 transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-forest-700" />
                  <span>{user.full_name.split(' ')[0]}</span>
                </Link>
                <button
                  onClick={() => logout()}
                  className="p-2 text-charcoal-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-charcoal-700 hover:text-charcoal-900 hover:bg-cream-100 transition-colors"
                >
                  <LogIn className="w-4 h-4 text-charcoal-400" />
                  <span>Log in</span>
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-forest-800 hover:bg-forest-900 text-white shadow-sm transition-colors"
                >
                  <span>Sign up</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-charcoal-600 hover:bg-cream-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-cream-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <nav className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${
                    isActive(link.path)
                      ? 'bg-forest-50 text-forest-800 font-bold'
                      : 'text-charcoal-600 hover:bg-cream-100'
                  }`}
                >
                  <Icon className="w-5 h-5 text-forest-700" />
                  {link.label}
                </Link>
              );
            })}
            {user && (
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-charcoal-600 hover:bg-cream-100"
              >
                <LayoutDashboard className="w-5 h-5 text-forest-700" />
                My Dashboard
              </Link>
            )}
          </nav>

          <div className="pt-3 border-t border-cream-200 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-charcoal-400 px-3">Demo Personas</p>
            <div className="grid grid-cols-2 gap-2 px-1">
              {demoUsers.map((u) => (
                <button
                  key={u.user_id}
                  onClick={() => handleDemoLogin(u.email)}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-cream-100 hover:bg-forest-50 text-charcoal-800 text-left border border-cream-200"
                >
                  {u.full_name}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            {user ? (
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-700 bg-rose-50 border border-rose-200"
              >
                <LogOut className="w-4 h-4" />
                Logout ({user.full_name})
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center py-2.5 rounded-xl text-sm font-semibold bg-cream-100 text-charcoal-800 text-center"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center py-2.5 rounded-xl text-sm font-semibold bg-forest-800 text-white text-center"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
