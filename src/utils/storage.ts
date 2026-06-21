import { StorageKeys } from '../types';

export const storage = {
  get<T>(key: StorageKeys, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }
      return JSON.parse(item) as T;
    } catch {
      return defaultValue;
    }
  },

  set<T>(key: StorageKeys, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage set error:', e);
    }
  },

  remove(key: StorageKeys): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Storage remove error:', e);
    }
  },

  clearAll(): void {
    Object.values(StorageKeys).forEach(key => {
      this.remove(key);
    });
  },

  has(key: StorageKeys): boolean {
    return localStorage.getItem(key) !== null;
  },
};
