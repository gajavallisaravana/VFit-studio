import React, { useState, useEffect } from 'react';
import { StoredPhoto, getAllPhotos, savePhoto, deletePhoto } from '../../utils/indexedDb';
import {
  Upload,
  Camera,
  Trash2,
  Glasses,
  Shirt,
  ShieldCheck,
  Check,
  AlertCircle,
  Plus,
  Image as ImageIcon,
  Clock,
  X,
} from 'lucide-react';

interface Props {
  onSelectPhotoForEyewear: (photoDataUrl: string) => void;
  onSelectPhotoForClothing: (photoDataUrl: string) => void;
}

export const MyPhotosPage: React.FC<Props> = ({
  onSelectPhotoForEyewear,
  onSelectPhotoForClothing,
}) => {
  const [photos, setPhotos] = useState<StoredPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<StoredPhoto | null>(null);
  const [photoToDelete, setPhotoToDelete] = useState<StoredPhoto | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [uploadCategory, setUploadCategory] = useState<'face' | 'fullbody' | 'general'>('face');

  // Load photos from IndexedDB
  const refreshPhotos = async () => {
    setIsLoading(true);
    try {
      const items = await getAllPhotos();
      setPhotos(items);
    } catch (err) {
      console.warn('Failed to load photos from IndexedDB:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshPhotos();
  }, []);

  const triggerToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png|webp|avif)$/)) {
      alert('Please upload an image in JPG, PNG, or WebP format.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      alert('File size exceeds 15MB limit. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

      const newPhoto: StoredPhoto = {
        id: `photo-${Date.now()}`,
        name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
        dataUrl,
        category: uploadCategory,
        createdAt: new Date().toISOString(),
      };

      try {
        await savePhoto(newPhoto);
        await refreshPhotos();
        triggerToast('Photo successfully saved to your local fitting room storage.');
      } catch (err) {
        console.error('Storage error:', err);
        alert('Could not save photo to browser storage.');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleConfirmDelete = async () => {
    if (!photoToDelete) return;
    try {
      await deletePhoto(photoToDelete.id);
      await refreshPhotos();
      if (selectedPhoto?.id === photoToDelete.id) {
        setSelectedPhoto(null);
      }
      triggerToast('Saved copy removed from your VFit storage.');
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setPhotoToDelete(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 border border-slate-700 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="text-xs font-semibold text-sky-600 tracking-wider uppercase mb-1">
            Personal Fitting Wardrobe
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">
            My Photos
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">
            Save your portraits and full-body photos locally in your browser. Seamlessly reuse them anytime for 3D eyewear or clothing try-on without re-uploading.
          </p>
        </div>

        {/* Upload Action Button */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer transform active:scale-95">
            <Plus className="w-4 h-4" />
            <span>Upload New Photo</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Privacy Notice Banner */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-start gap-3 text-xs text-slate-600">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold text-slate-900">100% Local-First Browser Storage (IndexedDB): </span>
          <span>
            Photos are saved directly inside your browser on this device and are never sent to external servers or exposed publicly. Deleting a photo removes your saved copy inside VFit.
          </span>
        </div>
      </div>

      {/* Photos Grid */}
      {isLoading ? (
        <div className="p-16 text-center text-slate-400 text-xs">
          Loading your saved photos...
        </div>
      ) : photos.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
            <ImageIcon className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-bold text-base text-slate-900">
              No saved photos yet
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Upload a clear face photo or full-body picture to easily try on eyewear and clothing whenever you return.
            </p>
          </div>
          <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl cursor-pointer shadow-sm">
            <Upload className="w-3.5 h-3.5 text-sky-400" />
            <span>Upload First Photo</span>
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
            >
              {/* Photo Preview Container */}
              <div
                onClick={() => setSelectedPhoto(photo)}
                className="relative aspect-[3/4] bg-slate-950 overflow-hidden cursor-pointer"
              >
                <img
                  src={photo.dataUrl}
                  alt={photo.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-black/60 text-white backdrop-blur-md">
                    {new Date(photo.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Photo Info & Actions */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-900 truncate">
                    {photo.name}
                  </span>
                  <button
                    onClick={() => setPhotoToDelete(photo)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Delete photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Direct Reuse Actions */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                  <button
                    onClick={() => onSelectPhotoForEyewear(photo.dataUrl)}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold rounded-xl border border-sky-200/80 transition-colors"
                  >
                    <Glasses className="w-3.5 h-3.5" />
                    <span>Try Eyewear</span>
                  </button>
                  <button
                    onClick={() => onSelectPhotoForClothing(photo.dataUrl)}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors"
                  >
                    <Shirt className="w-3.5 h-3.5 text-sky-400" />
                    <span>Try Clothes</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {photoToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600 font-semibold text-sm">
                <Trash2 className="w-4 h-4" />
                <span>Delete Saved Photo</span>
              </div>
              <button
                onClick={() => setPhotoToDelete(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete <strong>{photoToDelete.name}</strong> from your VFit browser storage? This cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setPhotoToDelete(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Preview Modal */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl max-h-[85vh] rounded-2xl bg-white overflow-hidden shadow-2xl border border-slate-200"
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <span className="font-semibold text-xs text-slate-900">{selectedPhoto.name}</span>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={selectedPhoto.dataUrl}
              alt={selectedPhoto.name}
              className="w-full max-h-[70vh] object-contain bg-slate-950"
            />
          </div>
        </div>
      )}
    </div>
  );
};
