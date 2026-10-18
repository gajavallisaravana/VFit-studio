export type ProductCategory = 'eyewear' | 'clothing';

export type EyewearSubcategory = 'aviator' | 'rectangular' | 'round' | 'bold' | 'visor';
export type ClothingSubcategory = 'blazer' | 'trench' | 'hoodie' | 'shirt' | 'trousers' | 'dress' | 'jacket' | 'top';

export interface FrameColor {
  id: string;
  name: string;
  hex: string;
  metalness: number;
  roughness: number;
}

export interface LensTint {
  id: string;
  name: string;
  color: string;
  opacity: number;
  transmission: number;
  roughness: number;
}

export interface Product {
  id: string;
  name: string;
  tagline: string;
  category: ProductCategory;
  subcategory: EyewearSubcategory | ClothingSubcategory;
  description: string;
  priceSample: number;
  currency: string;
  image: string;
  has3DModel: boolean;
  model3DType?: 'aviator' | 'hex' | 'minimal_oval' | 'shield_visor' | 'wayfarer';
  frameShape?: 'round' | 'rectangle' | 'cat-eye' | 'aviator' | 'transparent';
  stylePreference?: 'simple' | 'classic' | 'trendy';
  frameColors?: FrameColor[];
  lensTints?: LensTint[];
  sizes?: string[];
  sellerUrl?: string;
  sellerName?: string;
  isCustomUpload?: boolean;
}

export interface SavedLook {
  id: string;
  title: string;
  createdAt: string;
  userPhoto?: string;
  resultImage?: string;
  eyewearProduct?: Product;
  clothingProduct?: Product;
  frameColor?: string;
  lensTint?: string;
  clothingSize?: string;
  notes?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  token?: string;
  isDemo?: boolean;
}

export interface TryOnGenerationResponse {
  success: boolean;
  resultImage?: string;
  message?: string;
  executionTimeMs?: number;
  serviceUsed?: 'gemini' | 'external' | 'simulation';
  error?: string;
}

export interface ProductImportResponse {
  success: boolean;
  product?: {
    title: string;
    image: string;
    price?: number;
    currency?: string;
    brand?: string;
    category: ProductCategory;
    originalUrl: string;
  };
  error?: string;
}
