import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { Sparkles, Menu, X, User, Heart } from 'lucide-react';

interface Props {
  activeTab: 'home' | 'eyewear' | 'clothing' | 'studio' | 'saved';
  onNavigate: (tab: 'home' | 'eyewear' | 'clothing' | 'studio' | 'saved') => void;
  currentUser: UserProfile | null;
  savedLooksCount: number;
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  onNavigate,
  currentUser,
  savedLooksCount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks: { id: 'home' | 'eyewear' | 'clothing' | 'studio' | 'saved'; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'eyewear', label: 'Eyewear' },
    { id: 'clothing', label: 'Clothing' },
    { id: 'studio', label: 'Virtual Studio' },
    { id: 'saved', label: 'Saved Looks' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <button
            onClick={() => {
              onNavigate('home');
              setMobileMenuOpen(false);
            }}
            className="text-xl font-display font-black tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:text-sky-600 transition-colors flex items-center gap-2"
          >
            <span>VFit</span>
            <span className="text-xs font-normal text-slate-400 font-sans tracking-normal hidden sm:inline">
              Studio
            </span>
          </button>

          {/* Zone 2: 4–5 clean single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-600">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => onNavigate(link.id)}
                className={`whitespace-nowrap shrink-0 transition-colors py-1 relative ${
                  activeTab === link.id
                    ? 'text-sky-600 font-bold'
                    : 'hover:text-slate-900'
                }`}
              >
                {link.label}
                {link.id === 'saved' && savedLooksCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-sky-100 text-sky-700 font-mono tabular-nums">
                    {savedLooksCount}
                  </span>
                )}
                {activeTab === link.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-600 rounded-full" />
                )}
              </button>
            ))}
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('saved')}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-sm whitespace-nowrap shrink-0"
            >
              <User className="w-3.5 h-3.5 text-sky-400" />
              <span>{currentUser ? currentUser.name.split(' ')[0] : 'My Studio'}</span>
            </button>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg md:hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-lg px-4 pt-3 pb-5 space-y-2">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                onNavigate(link.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-between ${
                activeTab === link.id
                  ? 'bg-sky-50 text-sky-700'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>{link.label}</span>
              {link.id === 'saved' && savedLooksCount > 0 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-sky-100 text-sky-800 font-mono">
                  {savedLooksCount}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
