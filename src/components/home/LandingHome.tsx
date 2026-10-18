import React, { useState } from 'react';
import { Hero3DCanvas } from './Hero3DCanvas';
import { HeroClothing3DCanvas } from './HeroClothing3DCanvas';
import { DEMO_PRODUCTS } from '../../data/products';
import { Product } from '../../types';
import {
  Sparkles,
  ArrowRight,
  Glasses,
  Shirt,
  Image as ImageIcon,
  Heart,
  Rotate3d,
  Camera,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface Props {
  userName?: string;
  onNavigate: (tab: 'home' | 'eyewear' | 'clothing' | 'photos' | 'looks' | 'studio') => void;
  onSelectEyewear: (product: Product, mode: 'inspect' | 'tryon') => void;
  onSelectClothing: (product: Product) => void;
}

export const LandingHome: React.FC<Props> = ({
  userName = 'Guest',
  onNavigate,
  onSelectEyewear,
  onSelectClothing,
}) => {
  const featuredEyewear = DEMO_PRODUCTS.filter((p) => p.category === 'eyewear').slice(0, 3);
  const featuredClothing = DEMO_PRODUCTS.filter((p) => p.category === 'clothing').slice(0, 3);

  const [activeHero3D, setActiveHero3D] = useState<'eyewear' | 'clothing'>('eyewear');

  return (
    <div className="space-y-16 pb-16">
      {/* 1. Hero Section with Balanced Dual 3D Previews (Eyewear & Clothing) */}
      <section className="relative overflow-hidden pt-8 pb-12 lg:pt-12 lg:pb-16">
        {/* Ambient background soft glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-sky-200/40 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-slate-200/50 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Hero Copy (Column 7) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-200/80 text-sky-700 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                <span>Welcome back, {userName}! Your Studio is Ready</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-slate-900 tracking-tight leading-[1.08] text-balance">
                Find Your Perfect Look.
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 max-w-xl font-normal leading-relaxed">
                Try eyewear and outfits virtually before you buy. Experience real-time 3D face tracking, AI garment fitting, and custom wardrobe coordination.
              </p>

              {/* Primary Actions */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => onNavigate('eyewear')}
                  className="flex items-center gap-2 px-6 py-3.5 bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 transition-all transform active:scale-95"
                >
                  <Glasses className="w-4 h-4" />
                  <span>Start Eyewear Try-On</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onNavigate('clothing')}
                  className="flex items-center gap-2 px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold rounded-xl border border-slate-200 shadow-sm transition-all"
                >
                  <Shirt className="w-4 h-4 text-sky-600" />
                  <span>Try Outfits</span>
                </button>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-3">
                <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                  <Rotate3d className="w-3.5 h-3.5 text-sky-600" />
                  Dual 3D Studio Previews
                </span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                  <Camera className="w-3.5 h-3.5 text-sky-600" />
                  Real Landmark Alignment
                </span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Private Local Storage
                </span>
              </div>
            </div>

            {/* Hero Balanced Dual 3D Interactive Viewer (Column 5) */}
            <div className="lg:col-span-5 relative">
              <div className="relative w-full h-[400px] sm:h-[460px] rounded-3xl glass-panel shadow-2xl border border-white/80 overflow-hidden flex flex-col justify-between">
                {/* Dual 3D Mode Selector Header */}
                <div className="relative z-10 p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-1 p-1 bg-white/80 backdrop-blur-md rounded-xl border border-slate-200/80 shadow-sm">
                    <button
                      onClick={() => setActiveHero3D('eyewear')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        activeHero3D === 'eyewear'
                          ? 'bg-sky-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Glasses className="w-3.5 h-3.5" />
                      <span>3D Eyewear</span>
                    </button>
                    <button
                      onClick={() => setActiveHero3D('clothing')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        activeHero3D === 'clothing'
                          ? 'bg-sky-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Shirt className="w-3.5 h-3.5" />
                      <span>3D Apparel</span>
                    </button>
                  </div>

                  <span className="text-[10px] font-semibold text-slate-500 bg-white/70 backdrop-blur-sm px-2.5 py-1 rounded-full border border-slate-200/60 hidden sm:inline-flex items-center gap-1">
                    <Rotate3d className="w-3 h-3 text-sky-600 animate-spin-slow" />
                    3D PBR Engine
                  </span>
                </div>

                {/* 3D Canvas Stage */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {activeHero3D === 'eyewear' ? <Hero3DCanvas /> : <HeroClothing3DCanvas />}
                </div>

                {/* Dynamic Spec Details Bar */}
                <div className="relative z-10 m-4 p-3.5 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-md flex items-center justify-between">
                  {activeHero3D === 'eyewear' ? (
                    <div>
                      <div className="text-xs font-bold text-slate-900">Aether Aero Titanium</div>
                      <div className="text-[11px] text-slate-500">Real-time 3D PBR Shader · Ice Blue Lens</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-xs font-bold text-slate-900">Sartorial Atelier Blazer</div>
                      <div className="text-[11px] text-slate-500">Procedural 3D Garment · Titanium Lapel Trims</div>
                    </div>
                  )}

                  <button
                    onClick={() => onNavigate(activeHero3D === 'eyewear' ? 'eyewear' : 'clothing')}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                  >
                    <span>{activeHero3D === 'eyewear' ? 'Try Frames' : 'Try Apparel'}</span>
                    <ArrowRight className="w-3 h-3 text-sky-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Three Main Navigation Cards (Core Requirement Section 4) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900 tracking-tight">
              Virtual Fitting Studios
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose your studio to try frames on your face, preview outfits, or manage saved photos.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Eyewear Try-On */}
          <div
            onClick={() => onNavigate('eyewear')}
            className="group p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:border-sky-300 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Glasses className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="text-[11px] font-semibold text-sky-600 uppercase tracking-wider">
                  3D & Face Tracking
                </div>
                <h3 className="text-xl font-display font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                  Eyewear Try-On
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Upload your portrait or enable your camera. Track face landmarks to fit round, rectangular, cat-eye, and aviator frames with real 3D geometry.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <span className="text-xs font-semibold text-sky-600 group-hover:underline">
                Enter Eyewear Studio
              </span>
              <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-sky-50 flex items-center justify-center text-slate-600 group-hover:text-sky-600 transition-colors">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Card 2: Clothing Try-On */}
          <div
            onClick={() => onNavigate('clothing')}
            className="group p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:border-sky-300 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Shirt className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="text-[11px] font-semibold text-sky-600 uppercase tracking-wider">
                  Wardrobe & Sizing
                </div>
                <h3 className="text-xl font-display font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                  Clothing Try-On
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Preview tailored blazers, dresses, trench coats, knitwear, and trousers. Adjust size and fit preferences with interactive before-and-after comparisons.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <span className="text-xs font-semibold text-sky-600 group-hover:underline">
                Enter Clothing Studio
              </span>
              <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-sky-50 flex items-center justify-center text-slate-600 group-hover:text-sky-600 transition-colors">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Card 3: My Photos */}
          <div
            onClick={() => onNavigate('photos')}
            className="group p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:border-sky-300 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ImageIcon className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="text-[11px] font-semibold text-sky-600 uppercase tracking-wider">
                  Local-First Storage
                </div>
                <h3 className="text-xl font-display font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                  My Photos
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Manage your saved portraits and full-body fitting photos stored safely in your browser's IndexedDB. Reuse them anytime with one click.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <span className="text-xs font-semibold text-sky-600 group-hover:underline">
                Open Photo Library
              </span>
              <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-sky-50 flex items-center justify-center text-slate-600 group-hover:text-sky-600 transition-colors">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* My Looks Shortcut Banner */}
        <div className="mt-8 p-6 rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-sky-400 shrink-0">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-display font-bold">My Saved Looks</h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Compare alternate styling options side by side and export your favourite looks.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('looks')}
            className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold rounded-xl shadow-md transition-all self-stretch sm:self-auto justify-center"
          >
            <span>View Saved Looks</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 3. Featured Eyewear Collection */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="text-xs font-semibold text-sky-600 tracking-wider uppercase mb-1">
              Curated Optical
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900 tracking-tight">
              Featured 3D Frames
            </h2>
          </div>
          <button
            onClick={() => onNavigate('eyewear')}
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
          >
            <span>Explore All Frames</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredEyewear.map((item) => (
            <div
              key={item.id}
              className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow"
            >
              <div className="w-full h-44 rounded-xl bg-slate-100 overflow-hidden relative">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-950/80 text-white backdrop-blur-sm">
                  3D PBR Model
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <h3 className="font-display font-bold text-base text-slate-900">{item.name}</h3>
                <span className="text-sm font-bold text-slate-900 tabular-nums">${item.priceSample}</span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => onSelectEyewear(item, 'inspect')}
                  className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl text-center"
                >
                  Inspect 3D
                </button>
                <button
                  onClick={() => onSelectEyewear(item, 'tryon')}
                  className="flex-1 py-2 px-3 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold rounded-xl border border-sky-200 text-center"
                >
                  Try On
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Featured Tailored Wardrobe */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="text-xs font-semibold text-sky-600 tracking-wider uppercase mb-1">
              Atelier Wardrobe
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900 tracking-tight">
              Featured Garments
            </h2>
          </div>
          <button
            onClick={() => onNavigate('clothing')}
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
          >
            <span>Explore All Outfits</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredClothing.map((item) => (
            <div
              key={item.id}
              className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow"
            >
              <div className="w-full h-44 rounded-xl bg-slate-100 overflow-hidden relative">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-semibold bg-white/90 text-slate-800 shadow-sm">
                  {item.subcategory}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <h3 className="font-display font-bold text-base text-slate-900">{item.name}</h3>
                <span className="text-sm font-bold text-slate-900 tabular-nums">${item.priceSample}</span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
              <button
                onClick={() => onSelectClothing(item)}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl text-center"
              >
                Virtual Try-On
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
