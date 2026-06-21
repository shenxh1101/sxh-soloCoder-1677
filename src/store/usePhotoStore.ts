import { create } from 'zustand';
import { generateMockData } from '../mock/seed';
import { useLocalStorage } from '../utils/storage';
import type { Photo, PhotoMark } from '../types';

interface PhotoNote {
  photoId: string;
  content: string;
}

interface SelectionSummary {
  albumCount: number;
  retouchCount: number;
  notes: PhotoNote[];
}

interface PhotoState {
  photos: Record<string, Photo[]>;
  fetchPhotos: (orderId: string) => Promise<Photo[]>;
  getPhotos: (orderId: string) => Photo[];
  markPhoto: (photoId: string, mark: PhotoMark) => Photo | undefined;
  addNote: (photoId: string, note: string) => Photo | undefined;
  addPhotos: (orderId: string, photos: Omit<Photo, 'id' | 'orderId' | 'uploadedAt' | 'mark'>[]) => Photo[];
  getSelectionSummary: (orderId: string) => SelectionSummary;
}

const photosStorage = useLocalStorage<Record<string, Photo[]>>('photo_map');

const initialPhotos = (() => {
  const stored = photosStorage.get();
  if (stored && Object.keys(stored).length > 0) return stored;
  const { photos } = generateMockData();
  const grouped: Record<string, Photo[]> = {};
  for (const photo of photos) {
    if (!grouped[photo.orderId]) {
      grouped[photo.orderId] = [];
    }
    grouped[photo.orderId].push(photo);
  }
  photosStorage.set(grouped);
  return grouped;
})();

function generatePhotoId(orderId: string, index: number): string {
  const orderPart = orderId.split('_')[1] || Date.now().toString(36);
  return `photo_${orderPart}_${String(index).padStart(3, '0')}`;
}

function persistPhotos(photos: Record<string, Photo[]>) {
  photosStorage.set(photos);
}

function findPhotoInMap(
  photos: Record<string, Photo[]>,
  photoId: string
): { orderId: string; index: number; photo: Photo } | null {
  for (const orderId of Object.keys(photos)) {
    const list = photos[orderId];
    const idx = list.findIndex((p) => p.id === photoId);
    if (idx !== -1) {
      return { orderId, index: idx, photo: list[idx] };
    }
  }
  return null;
}

export const usePhotoStore = create<PhotoState>((set, get) => ({
  photos: initialPhotos,

  fetchPhotos: async (orderId: string) => {
    const { photos } = get();
    return photos[orderId] || [];
  },

  getPhotos: (orderId: string) => {
    const { photos } = get();
    return photos[orderId] || [];
  },

  markPhoto: (photoId: string, mark: PhotoMark) => {
    const { photos } = get();
    const found = findPhotoInMap(photos, photoId);
    if (!found) return undefined;

    const { orderId, index } = found;
    const updatedPhoto: Photo = { ...photos[orderId][index], mark };
    const updatedOrderPhotos = [...photos[orderId]];
    updatedOrderPhotos[index] = updatedPhoto;

    const updatedPhotos = { ...photos, [orderId]: updatedOrderPhotos };
    set({ photos: updatedPhotos });
    persistPhotos(updatedPhotos);
    return updatedPhoto;
  },

  addNote: (photoId: string, note: string) => {
    const { photos } = get();
    const found = findPhotoInMap(photos, photoId);
    if (!found) return undefined;

    const { orderId, index } = found;
    const updatedPhoto: Photo = { ...photos[orderId][index], note };
    const updatedOrderPhotos = [...photos[orderId]];
    updatedOrderPhotos[index] = updatedPhoto;

    const updatedPhotos = { ...photos, [orderId]: updatedOrderPhotos };
    set({ photos: updatedPhotos });
    persistPhotos(updatedPhotos);
    return updatedPhoto;
  },

  addPhotos: (orderId: string, newPhotos) => {
    const { photos } = get();
    const existing = photos[orderId] || [];
    const startIdx = existing.length;
    const now = new Date().toISOString();

    const created: Photo[] = newPhotos.map((p, i) => ({
      ...p,
      id: generatePhotoId(orderId, startIdx + i + 1),
      orderId,
      mark: 'none' as PhotoMark,
      uploadedAt: now,
    }));

    const updatedPhotos = {
      ...photos,
      [orderId]: [...existing, ...created],
    };
    set({ photos: updatedPhotos });
    persistPhotos(updatedPhotos);
    return created;
  },

  getSelectionSummary: (orderId: string) => {
    const orderPhotos = get().photos[orderId] || [];
    let albumCount = 0;
    let retouchCount = 0;
    const notes: PhotoNote[] = [];

    for (const photo of orderPhotos) {
      if (photo.mark === 'album') albumCount++;
      if (photo.mark === 'retouch') retouchCount++;
      if (photo.note && photo.note.trim()) {
        notes.push({ photoId: photo.id, content: photo.note });
      }
    }

    return { albumCount, retouchCount, notes };
  },
}));
