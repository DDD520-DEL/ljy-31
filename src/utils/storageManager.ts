import { StorageInfo, StorageKeys, Photo } from '../types';
import { storage } from './storage';

export const DEFAULT_STORAGE_QUOTA_MB = 100;
const WARNING_THRESHOLD = 0.8;

const MB_TO_BYTES = 1024 * 1024;

export const getStorageQuota = (): number => {
  const stored = storage.get<number | null>(StorageKeys.STORAGE_QUOTA, null);
  if (stored && stored > 0) {
    return stored * MB_TO_BYTES;
  }
  return DEFAULT_STORAGE_QUOTA_MB * MB_TO_BYTES;
};

export const setStorageQuota = (quotaMB: number): void => {
  storage.set(StorageKeys.STORAGE_QUOTA, Math.max(1, quotaMB));
};

export const calculatePhotosSize = (photos: Photo[]): number => {
  return photos.reduce((total, photo) => total + photo.fileSize, 0);
};

export const calculateLocalStorageSize = (): number => {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key) || '';
      total += key.length + value.length;
    }
  }
  return total;
};

export const generateStorageInfo = (photos: Photo[]): StorageInfo => {
  const usedSize = calculatePhotosSize(photos);
  const quotaLimit = getStorageQuota();
  const usageRatio = usedSize / quotaLimit;

  return {
    totalSize: quotaLimit,
    usedSize,
    photoCount: photos.length,
    quotaLimit,
    quotaWarning: usageRatio >= WARNING_THRESHOLD && usageRatio < 1,
    quotaExceeded: usageRatio >= 1,
  };
};

export const checkCanAddPhoto = (
  photos: Photo[],
  newPhotoSize: number
): { canAdd: boolean; reason?: string } => {
  const currentSize = calculatePhotosSize(photos);
  const quotaLimit = getStorageQuota();

  if (currentSize + newPhotoSize > quotaLimit) {
    return {
      canAdd: false,
      reason: `存储空间不足，需要 ${formatSize(newPhotoSize)}，但仅剩 ${formatSize(Math.max(0, quotaLimit - currentSize))}`,
    };
  }

  return { canAdd: true };
};

export const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const getStorageUsagePercentage = (storageInfo: StorageInfo): number => {
  if (storageInfo.quotaLimit === 0) return 0;
  return Math.min(100, (storageInfo.usedSize / storageInfo.quotaLimit) * 100);
};

export const getOldestPhotos = (photos: Photo[], count: number): Photo[] => {
  return [...photos]
    .sort((a, b) => a.uploadedAt - b.uploadedAt)
    .slice(0, count);
};
