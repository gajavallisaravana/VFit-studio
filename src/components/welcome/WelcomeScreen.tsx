import React, { useState } from 'react';
import { Welcome3DCanvas } from './Welcome3DCanvas';
import { WelcomeClothing3DCanvas } from './WelcomeClothing3DCanvas';
import { ArrowRight, Sparkles, Glasses, Shirt } from 'lucide-react';

interface Props {
  onGetStarted: (userName: string) => void;
}

export const WelcomeScreen: React.FC<Props> = ({ onGetStarted }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Please enter your name to step inside your fitting room.');
      return;
    }
    setError('');
    onGetStarted(cleanName);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-50 flex items-center justify-center p-4 selection:bg-sky-500 selection:text-white">
      {/* Background Soft Lighting Gradients */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[550px] bg-sky-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[450px] bg-slate-200/60 rounded-full blur-3xl pointer-events-none" />

      {/* Main Split Container: 3D Animation (Desktop left/center) + Glass Entry Card */}
      <div className="relative w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10 py-8">
        {/* Interactive 3D Stage (Column 7) */}
        <div className="lg:col-span-7 h-[380px] sm:h-[480px] lg:h-[560px] relative rounded-3xl glass-panel border border-white/80 shadow-2xl overflow-hidden flex items-center justify-center">
          {/* Real-time 3D Three.js Eyewear + Garment Model */}
          <Welcome3DCanvas />

          {/* Floating Subtle Quality Badges */}
          <div className="absolute bottom-5 left-5 right-5 p-3.5 rounded-2xl bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-sm flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              <span className="text-xs font-semibold text-slate-800">Interactive 3D Preview</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <Glasses className="w-3.5 h-3.5 text-sky-600" />
                3D Eyewear
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Shirt className="w-3.5 h-3.5 text-sky-600" />
                Apparel Fit
              </span>
            </div>
          </div>
        </div>

        {/* Welcome & Name Input Card (Column 5) */}
        <div className="lg:col-span-5 p-8 sm:p-10 rounded-3xl bg-white/95 backdrop-blur-xl border border-white shadow-xl space-y-6">
          {/* Logo & Brand Identity */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200/70 text-sky-700 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-sky-500" />
              <span>Next-Gen Virtual Fitting</span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight text-slate-900">
                VFit
              </span>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Studio
              </span>
            </div>

            <p className="text-sm font-medium text-slate-600 leading-snug">
              Your Virtual Fitting Room — Try It Before You Choose It.
            </p>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Simple Name Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="userNameInput"
                className="block text-xs font-semibold text-slate-700 tracking-wide"
              >
                Enter your name to begin
              </label>
              <input
                id="userNameInput"
                type="text"
                autoFocus
                placeholder="e.g. Elena, Liam, or Jordan"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError('');
                }}
                className={`w-full px-4 py-3 text-sm bg-slate-50 border rounded-xl focus:bg-white focus:outline-none transition-all ${
                  error
                    ? 'border-rose-400 focus:ring-2 focus:ring-rose-300'
                    : 'border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100'
                }`}
              />
              {error && (
                <p className="text-xs text-rose-500 font-medium pl-1 pt-0.5">{error}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-sky-600/20 hover:shadow-sky-600/30 transition-all transform active:scale-95"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Matching 3D Clothing Animation Preview */}
          <div className="pt-2">
            <div className="w-full h-36 sm:h-40 relative rounded-2xl bg-gradient-to-b from-slate-100/90 to-sky-50/50 border border-slate-200/80 shadow-sm overflow-hidden flex items-center justify-center">
              <WelcomeClothing3DCanvas />

              {/* Quality Label Badge */}
              <div className="absolute bottom-2.5 left-3 px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-md border border-slate-200 text-[10px] font-semibold text-slate-700 flex items-center gap-1.5 pointer-events-none shadow-sm">
                <Shirt className="w-3 h-3 text-sky-600" />
                <span>3D Atelier Apparel</span>
              </div>
            </div>
          </div>

          {/* Name-based entry clarity note */}
          <div className="text-center">
            <p className="text-[11px] text-slate-400">
              Instant access · No passwords or email required
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
