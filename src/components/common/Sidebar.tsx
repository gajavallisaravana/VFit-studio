import React, { useState } from 'react';
import {
  Home,
  Glasses,
  Shirt,
  Image as ImageIcon,
  Heart,
  Layers,
  Sparkles,
  Upload,
  Menu,
  X,
  User,
  Edit2,
  Check,
} from 'lucide-react';

export type NavTab = 'home' | 'eyewear' | 'clothing' | 'photos' | 'looks' | 'studio';

interface Props {
  activeTab: NavTab;
  onNavigate: (tab: NavTab) => void;
  userName: string;
  onUpdateName: (newName: string) => void;
  onOpenImporter?: () => void;
  savedLooksCount?: number;
}

export const Sidebar: React.FC<Props> = ({
  activeTab,
  onNavigate,
  userName,
  onUpdateName,
  onOpenImporter,
  savedLooksCount = 0,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName);

  const navItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'eyewear', label: 'Eyewear', icon: Glasses },
    { id: 'clothing', label: 'Clothing', icon: Shirt },
    { id: 'photos', label: 'My Photos', icon: ImageIcon },
    { id: 'looks', label: 'My Looks', icon: Heart },
  ];

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      onUpdateName(tempName.trim());
      setIsEditingName(false);
    }
  };

  return (
    <>
      {/* Mobile Top Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              onNavigate('home');
              setMobileOpen(false);
            }}
            className="flex items-center gap-1.5"
          >
            <span className="text-xl font-display font-extrabold text-slate-900 tracking-tight">
              VFit
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
              Studio
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-600 hidden sm:inline">
            Hi, <strong className="text-slate-900">{userName}</strong>
          </span>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm"
        />
      )}

      {/* Sidebar Panel (Desktop: Fixed left sidebar; Mobile: Slide-out drawer) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Top: Logo & Main Navigation */}
        <div className="p-5 space-y-6 flex-1 overflow-y-auto">
          {/* Brand Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <button
              onClick={() => {
                onNavigate('home');
                setMobileOpen(false);
              }}
              className="text-left group"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl font-display font-extrabold tracking-tight text-slate-900 group-hover:text-sky-600 transition-colors">
                  VFit
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider text-sky-600 bg-sky-50 rounded-full border border-sky-100 uppercase">
                  Studio
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                Your Style, Your Vision.
              </p>
            </button>

            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Primary Navigation Links */}
          <nav className="space-y-1">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Fitting Studio
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setMobileOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-sky-50 text-sky-700 font-bold border border-sky-200/80 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-sky-600' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.id === 'looks' && savedLooksCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-100 text-sky-700">
                      {savedLooksCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Secondary Tools: Outfit Studio & Import Product */}
          <div className="pt-4 border-t border-slate-100 space-y-1">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Advanced Studio
            </div>
            <button
              onClick={() => {
                onNavigate('studio');
                setMobileOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'studio'
                  ? 'bg-sky-50 text-sky-700 font-bold border border-sky-200/80 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Layers
                className={`w-4 h-4 ${activeTab === 'studio' ? 'text-sky-600' : 'text-slate-400'}`}
              />
              <span>Full Outfit Studio</span>
            </button>

            {onOpenImporter && (
              <button
                onClick={() => {
                  onOpenImporter();
                  setMobileOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
              >
                <Upload className="w-4 h-4 text-slate-400" />
                <span>Import Any Product</span>
              </button>
            )}
          </div>
        </div>

        {/* Bottom Section: User Profile & Name Greeting */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/70">
          {isEditingName ? (
            <form onSubmit={handleSaveName} className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Update Your Name
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  autoFocus
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-sky-500"
                />
                <button
                  type="submit"
                  className="p-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg shadow-sm"
                  title="Save name"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingName(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-slate-200/80 shadow-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-xs shrink-0">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">{userName}</div>
                  <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Fitting Room Active</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setTempName(userName);
                  setIsEditingName(true);
                }}
                className="p-1.5 text-slate-400 hover:text-sky-600 rounded-lg hover:bg-slate-100 transition-colors"
                title="Change name"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
