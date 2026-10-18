/**
 * IndexedDB helper for local-first image and look persistence in VFit
 * Uses native IndexedDB to reliably store large image data without localStorage quota limits.
 */

const DB_NAME = 'vfit_studio_db';
const DB_VERSION = 1;

export interface StoredPhoto {
  id: string;
  name: string;
  dataUrl: string;
  category: 'face' | 'fullbody' | 'general';
  createdAt: string;
  width?: number;
  height?: number;
}

export interface StoredLookItem {
  id: string;
  title: string;
  createdAt: string;
  resultImage: string;
  originalImage?: string;
  eyewearName?: string;
  clothingName?: string;
  frameColor?: string;
  size?: string;
  fitPreference?: string;
  notes?: string;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('photos')) {
        db.createObjectStore('photos', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('looks')) {
        db.createObjectStore('looks', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Photos API
export async function getAllPhotos(): Promise<StoredPhoto[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('photos', 'readonly');
      const store = tx.objectStore('photos');
      const request = store.getAll();
      request.onsuccess = () => {
        const results = (request.result as StoredPhoto[]) || [];
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB getAllPhotos error:', err);
    return [];
  }
}

export async function savePhoto(photo: StoredPhoto): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('photos', 'readwrite');
    const store = tx.objectStore('photos');
    const request = store.put(photo);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deletePhoto(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('photos', 'readwrite');
    const store = tx.objectStore('photos');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Looks API
export async function getAllLooks(): Promise<StoredLookItem[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('looks', 'readonly');
      const store = tx.objectStore('looks');
      const request = store.getAll();
      request.onsuccess = () => {
        const results = (request.result as StoredLookItem[]) || [];
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB getAllLooks error:', err);
    return [];
  }
}

export async function saveLook(look: StoredLookItem): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('looks', 'readwrite');
    const store = tx.objectStore('looks');
    const request = store.put(look);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteLook(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('looks', 'readwrite');
    const store = tx.objectStore('looks');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
