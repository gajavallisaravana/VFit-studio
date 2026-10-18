import React, { useState } from 'react';
import { SavedLook, UserProfile } from '../../types';
import {
  Heart,
  Trash2,
  Share2,
  Calendar,
  Layers,
  ArrowRight,
  User,
  LogIn,
  LogOut,
  ShieldCheck,
  Check,
  AlertCircle,
} from 'lucide-react';

interface Props {
  savedLooks: SavedLook[];
  currentUser: UserProfile | null;
  onDeleteLook: (id: string) => void;
  onLoadLookIntoStudio: (look: SavedLook) => void;
  onLogin: (user: UserProfile) => void;
  onLogout: () => void;
}

export const SavedLooksView: React.FC<Props> = ({
  savedLooks,
  currentUser,
  onDeleteLook,
  onLoadLookIntoStudio,
  onLogin,
  onLogout,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [emailInput, setEmailInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [nameInput, setNameInput] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoadingAuth(true);

    try {
      const endpoint = authMode === 'signup' ? '/api/auth/register' : '/api/auth/login';
      const body =
        authMode === 'signup'
          ? { name: nameInput, email: emailInput, password: passwordInput }
          : { email: emailInput, password: passwordInput };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication request failed.');
      }

      onLogin(data.user);
      setEmailInput('');
      setPasswordInput('');
      setNameInput('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Auth service error';
      setAuthError(msg);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleQuickDemoGuest = () => {
    const guestUser: UserProfile = {
      id: 'demo-guest-user',
      name: 'Studio Guest',
      email: 'guest@vfit.studio',
      isDemo: true,
    };
    onLogin(guestUser);
  };

  const handleShareLook = (look: SavedLook) => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedId(look.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="text-xs font-semibold text-sky-600 tracking-wider uppercase mb-1">
            Personal Lookbook & Wardrobe
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">
            Saved Ensembles & Wishlist
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">
            Review your custom styling combinations, compare saved fits, and access your profile configurations.
          </p>
        </div>

        {/* User Account Bar */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center font-bold text-xs">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <span>{currentUser.name}</span>
                  {currentUser.isDemo && (
                    <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                      Demo Mode
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500">{currentUser.email}</div>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors ml-2"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleQuickDemoGuest}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-xl transition-all"
              >
                Continue as Demo Guest
              </button>
            </div>
          )}
        </div>
      </div>

      {/* If not authenticated and no looks yet, offer login / signup */}
      {!currentUser && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm max-w-md mx-auto space-y-4">
          <div className="text-center">
            <h3 className="font-display font-bold text-lg text-slate-900">
              {authMode === 'login' ? 'Sign In to VFit' : 'Create VFit Account'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Store your custom fits, eyewear selections, and AI try-on history across devices.
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-3">
            {authMode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Elena Rostova"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="you@domain.com"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {authError && (
              <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoadingAuth}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
            >
              {isLoadingAuth
                ? 'Processing...'
                : authMode === 'login'
                ? 'Sign In'
                : 'Create Account'}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'signup' : 'login');
                setAuthError(null);
              }}
              className="text-sky-600 hover:underline"
            >
              {authMode === 'login' ? "Don't have an account? Sign up" : 'Already registered? Sign in'}
            </button>
            <button onClick={handleQuickDemoGuest} className="text-slate-500 hover:text-slate-800">
              Skip (Guest Mode)
            </button>
          </div>
        </div>
      )}

      {/* Saved Looks List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900">
            My Saved Looks ({savedLooks.length})
          </h2>
        </div>

        {savedLooks.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-slate-200">
            <Heart className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-900">No saved looks yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Combine 3D eyewear and tailored apparel in the Virtual Outfit Studio and tap “Save Look” to build your collection.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedLooks.map((look) => (
              <div
                key={look.id}
                className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between"
              >
                {/* Look Preview Image */}
                <div className="relative aspect-[4/3] bg-slate-950 overflow-hidden flex items-center justify-center">
                  <img
                    src={look.resultImage || look.userPhoto}
                    alt={look.title}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-semibold text-white/90">
                    {new Date(look.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                </div>

                {/* Look Info */}
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display font-bold text-base text-slate-900">{look.title}</h3>
                    {look.notes && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{look.notes}</p>
                    )}
                  </div>

                  {/* Components */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    {look.eyewearProduct && (
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="text-slate-500">Eyewear:</span>
                        <span className="font-medium text-slate-900">{look.eyewearProduct.name}</span>
                      </div>
                    )}
                    {look.frameColor && (
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="text-slate-500">Frame Finish:</span>
                        <span className="font-medium">{look.frameColor}</span>
                      </div>
                    )}
                    {look.clothingProduct && (
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="text-slate-500">Apparel:</span>
                        <span className="font-medium text-slate-900">{look.clothingProduct.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                    <button
                      onClick={() => onLoadLookIntoStudio(look)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all"
                    >
                      <span>Open in Studio</span>
                      <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
                    </button>

                    <button
                      onClick={() => handleShareLook(look)}
                      className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
                      title="Share look link"
                    >
                      {copiedId === look.id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Share2 className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => onDeleteLook(look.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                      title="Delete look"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
