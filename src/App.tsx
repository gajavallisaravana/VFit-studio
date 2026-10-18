import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/common/Sidebar';
import { WelcomeScreen } from './components/welcome/WelcomeScreen';
import { LandingHome } from './components/home/LandingHome';
import { EyewearStudio } from './components/eyewear/EyewearStudio';
import { ClothingStudio } from './components/clothing/ClothingStudio';
import { OutfitStudio } from './components/studio/OutfitStudio';
import { MyPhotosPage } from './components/photos/MyPhotosPage';
import { MyLooksPage } from './components/looks/MyLooksPage';
import { ProductImporterModal } from './components/studio/ProductImporterModal';
import { Product, FrameColor, LensTint, SavedLook, UserProfile } from './types';
import { DEMO_PRODUCTS, DEMO_MODEL_IMAGE } from './data/products';
import { getAllLooks, StoredLookItem } from './utils/indexedDb';

export default function App() {
  // Name-only entry state: initialize from localStorage if available
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('vfit_user_name') || '';
  });

  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [activeFittingPhoto, setActiveFittingPhoto] = useState<string | null>(null);

  // Active items passed into the Outfit Studio
  const [studioEyewear, setStudioEyewear] = useState<Product | undefined>(
    DEMO_PRODUCTS.find((p) => p.category === 'eyewear')
  );
  const [studioClothing, setStudioClothing] = useState<Product | undefined>(
    DEMO_PRODUCTS.find((p) => p.category === 'clothing')
  );
  const [studioFrameColor, setStudioFrameColor] = useState<FrameColor | undefined>();
  const [studioLensTint, setStudioLensTint] = useState<LensTint | undefined>();
  const [studioTryonResult, setStudioTryonResult] = useState<string | undefined>();

  // Global Product Importer Modal state
  const [isImporterOpen, setIsImporterOpen] = useState(false);

  // Saved Looks count for sidebar badge
  const [savedLooksCount, setSavedLooksCount] = useState<number>(0);

  // Saved Looks state
  const [savedLooks, setSavedLooks] = useState<SavedLook[]>([
    {
      id: 'look-seed-1',
      title: 'Monochrome Sartorial Silhouette',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      userPhoto: DEMO_MODEL_IMAGE,
      resultImage: '/src/assets/images/clothing_tailored_blazer_1792303433944.jpg',
      eyewearProduct: DEMO_PRODUCTS[0],
      clothingProduct: DEMO_PRODUCTS[5],
      frameColor: 'Brushed Silver Titanium',
      lensTint: 'Gradient Ice Blue',
      clothingSize: '40 / M',
      notes: 'Tailored merino blazer paired with aerospace titanium aviators.',
    },
    {
      id: 'look-seed-2',
      title: 'Avant-Garde Architectural Trench',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      userPhoto: DEMO_MODEL_IMAGE,
      resultImage: '/src/assets/images/clothing_minimal_trench_1792303434143.jpg',
      eyewearProduct: DEMO_PRODUCTS[1],
      clothingProduct: DEMO_PRODUCTS[6],
      frameColor: 'Onyx Obsidian',
      lensTint: 'Charcoal Smoke',
      clothingSize: 'L',
      notes: 'Waterproof cocoon coat styled with Italian bio-acetate hexagonal frames.',
    },
  ]);

  // Sync look count from IndexedDB on load and tab change
  const refreshLookCount = async () => {
    try {
      const dbLooks = await getAllLooks();
      setSavedLooksCount(dbLooks.length);
    } catch {
      setSavedLooksCount(savedLooks.length);
    }
  };

  useEffect(() => {
    refreshLookCount();
  }, [activeTab]);

  // Sync saved looks with backend API on mount
  useEffect(() => {
    fetch('/api/saved-looks')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.looks && data.looks.length > 0) {
          setSavedLooks(data.looks);
          setSavedLooksCount((c) => Math.max(c, data.looks.length));
        }
      })
      .catch((err) => console.log('Loaded default client looks:', err));
  }, []);

  // Name submit handler from WelcomeScreen
  const handleGetStarted = (name: string) => {
    const clean = name.trim();
    if (!clean) return;
    setUserName(clean);
    localStorage.setItem('vfit_user_name', clean);
    setActiveTab('home');
  };

  const handleUpdateName = (newName: string) => {
    const clean = newName.trim();
    if (!clean) return;
    setUserName(clean);
    localStorage.setItem('vfit_user_name', clean);
  };

  // Handlers for seamless navigation flows
  const handleSelectEyewearFromCatalogue = (product: Product, mode: 'inspect' | 'tryon') => {
    setStudioEyewear(product);
    setStudioFrameColor(product.frameColors?.[0]);
    setStudioLensTint(product.lensTints?.[0]);
    setActiveTab('eyewear');
  };

  const handleSelectClothingFromCatalogue = (product: Product) => {
    setStudioClothing(product);
    setActiveTab('clothing');
  };

  const handleSendEyewearToOutfitStudio = (
    eyewear: Product,
    frameColor?: FrameColor,
    lensTint?: LensTint,
    faceSnapshot?: string
  ) => {
    setStudioEyewear(eyewear);
    setStudioFrameColor(frameColor);
    setStudioLensTint(lensTint);
    if (faceSnapshot) {
      setStudioTryonResult(faceSnapshot);
    }
    setActiveTab('studio');
  };

  const handleSendClothingToOutfitStudio = (clothing: Product, generatedTryonImage?: string) => {
    setStudioClothing(clothing);
    if (generatedTryonImage) {
      setStudioTryonResult(generatedTryonImage);
    }
    setActiveTab('studio');
  };

  const handleSaveLook = async (look: SavedLook) => {
    setSavedLooks((prev) => [look, ...prev]);
    setSavedLooksCount((c) => c + 1);

    // Persist to backend
    try {
      await fetch('/api/saved-looks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(look),
      });
    } catch (err) {
      console.warn('Saved look saved locally in memory:', err);
    }
  };

  const handleLoadLookIntoStudio = (look: StoredLookItem | SavedLook) => {
    if ('eyewearProduct' in look && look.eyewearProduct) setStudioEyewear(look.eyewearProduct);
    if ('clothingProduct' in look && look.clothingProduct) setStudioClothing(look.clothingProduct);
    if (look.resultImage) setStudioTryonResult(look.resultImage);
    setActiveTab('studio');
  };

  const handleProductImported = (imported: Product) => {
    if (imported.category === 'eyewear') {
      setStudioEyewear(imported);
      setActiveTab('eyewear');
    } else {
      setStudioClothing(imported);
      setActiveTab('clothing');
    }
  };

  // If no name has been entered yet, render the name-only Welcome Page
  if (!userName) {
    return <WelcomeScreen onGetStarted={handleGetStarted} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-sky-500 selection:text-white">
      {/* Responsive Sidebar Navigation (Desktop Fixed Sidebar + Mobile Header) */}
      <Sidebar
        activeTab={activeTab}
        onNavigate={setActiveTab}
        userName={userName}
        onUpdateName={handleUpdateName}
        onOpenImporter={() => setIsImporterOpen(true)}
        savedLooksCount={savedLooksCount}
      />

      {/* Main Content Area (Offset for desktop fixed sidebar) */}
      <div className="lg:pl-64 flex-1 flex flex-col min-w-0">
        <main className="flex-1">
          {activeTab === 'home' && (
            <LandingHome
              userName={userName}
              onNavigate={setActiveTab}
              onSelectEyewear={handleSelectEyewearFromCatalogue}
              onSelectClothing={handleSelectClothingFromCatalogue}
            />
          )}

          {activeTab === 'eyewear' && (
            <EyewearStudio
              initialPhotoUrl={activeFittingPhoto}
              onSendToOutfitStudio={handleSendEyewearToOutfitStudio}
            />
          )}

          {activeTab === 'clothing' && (
            <ClothingStudio
              initialPhotoUrl={activeFittingPhoto}
              onSendToOutfitStudio={handleSendClothingToOutfitStudio}
              onOpenProductImporter={() => setIsImporterOpen(true)}
            />
          )}

          {activeTab === 'photos' && (
            <MyPhotosPage
              onSelectPhotoForEyewear={(photo) => {
                setActiveFittingPhoto(photo);
                setActiveTab('eyewear');
              }}
              onSelectPhotoForClothing={(photo) => {
                setActiveFittingPhoto(photo);
                setActiveTab('clothing');
              }}
            />
          )}

          {activeTab === 'looks' && (
            <MyLooksPage onOpenInStudio={handleLoadLookIntoStudio} />
          )}

          {activeTab === 'studio' && (
            <OutfitStudio
              initialEyewear={studioEyewear}
              initialClothing={studioClothing}
              initialFrameColor={studioFrameColor}
              initialLensTint={studioLensTint}
              initialTryonResult={studioTryonResult}
              onSaveLook={handleSaveLook}
              onOpenProductImporter={() => setIsImporterOpen(true)}
            />
          )}
        </main>

        {/* Global Product Importer Modal */}
        <ProductImporterModal
          isOpen={isImporterOpen}
          onClose={() => setIsImporterOpen(false)}
          onProductImported={handleProductImported}
        />

        {/* Site Footer */}
        <footer className="border-t border-slate-200 bg-white/80 py-8 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-slate-900">VFit</span>
              <span>·</span>
              <span>Your Virtual Fitting Room — Try It Before You Choose It.</span>
            </div>
            <div className="flex items-center gap-5 text-slate-600">
              <button
                onClick={() => setActiveTab('home')}
                className="hover:text-slate-900 transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => setActiveTab('eyewear')}
                className="hover:text-slate-900 transition-colors"
              >
                Eyewear
              </button>
              <button
                onClick={() => setActiveTab('clothing')}
                className="hover:text-slate-900 transition-colors"
              >
                Clothing
              </button>
              <button
                onClick={() => setActiveTab('photos')}
                className="hover:text-slate-900 transition-colors"
              >
                My Photos
              </button>
              <button
                onClick={() => setActiveTab('looks')}
                className="hover:text-slate-900 transition-colors"
              >
                My Looks
              </button>
            </div>
            <div>
              <span>© {new Date().getFullYear()} VFit. All rights reserved.</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
