import { create } from 'zustand';
import {
  AppState,
  SprinklerRecord,
  AppSettings,
  StorageKeys,
  RoadPrediction,
} from '../types';
import { storage } from '../utils/storage';
import { generateAllPredictions, generateStatistics } from '../utils/analysis';
import { generateId, formatDate, formatTime } from '../utils/format';
import { mockRecords } from '../data/mockRecords';

const defaultSettings: AppSettings = {
  theme: 'light',
  reminderEnabled: true,
  reminderMinutes: 15,
  favoriteRoads: [],
};

const getInitialRecords = (): SprinklerRecord[] => {
  const stored = storage.get<SprinklerRecord[]>(StorageKeys.RECORDS, []);
  if (stored.length > 0) return stored;
  return mockRecords;
};

const initialRecords = getInitialRecords();
const initialPredictions = generateAllPredictions(initialRecords);
const initialStatistics = generateStatistics(initialRecords);
const initialSettings = storage.get<AppSettings>(StorageKeys.SETTINGS, defaultSettings);

export const useAppStore = create<AppState>((set, get) => ({
  records: initialRecords,
  predictions: initialPredictions,
  statistics: initialStatistics,
  settings: initialSettings,
  isLoading: false,

  addRecord: (recordData) => {
    const now = Date.now();
    const newRecord: SprinklerRecord = {
      ...recordData,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };

    set((state) => {
      const newRecords = [newRecord, ...state.records];
      storage.set(StorageKeys.RECORDS, newRecords);
      return { records: newRecords };
    });

    get().refreshPredictions();
    get().refreshStatistics();
  },

  updateRecord: (id, updates) => {
    set((state) => {
      const newRecords = state.records.map((record) =>
        record.id === id
          ? { ...record, ...updates, updatedAt: Date.now() }
          : record
      );
      storage.set(StorageKeys.RECORDS, newRecords);
      return { records: newRecords };
    });

    get().refreshPredictions();
    get().refreshStatistics();
  },

  deleteRecord: (id) => {
    set((state) => {
      const newRecords = state.records.filter((record) => record.id !== id);
      storage.set(StorageKeys.RECORDS, newRecords);
      return { records: newRecords };
    });

    get().refreshPredictions();
    get().refreshStatistics();
  },

  updateSettings: (updates) => {
    set((state) => {
      const newSettings = { ...state.settings, ...updates };
      storage.set(StorageKeys.SETTINGS, newSettings);
      return { settings: newSettings };
    });
  },

  refreshPredictions: () => {
    const { records } = get();
    const predictions = generateAllPredictions(records);
    storage.set(StorageKeys.PREDICTIONS, predictions);
    set({ predictions });
  },

  refreshStatistics: () => {
    const { records } = get();
    const statistics = generateStatistics(records);
    set({ statistics });
  },

  loadMockData: () => {
    storage.set(StorageKeys.RECORDS, mockRecords);
    const predictions = generateAllPredictions(mockRecords);
    const statistics = generateStatistics(mockRecords);
    storage.set(StorageKeys.PREDICTIONS, predictions);
    set({
      records: mockRecords,
      predictions,
      statistics,
    });
  },

  exportData: () => {
    const { records, predictions, settings } = get();
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      records,
      predictions,
      settings,
    };
    return JSON.stringify(exportData, null, 2);
  },
}));

export const useRecords = () => useAppStore((state) => state.records);
export const usePredictions = () => useAppStore((state) => state.predictions);
export const useStatistics = () => useAppStore((state) => state.statistics);
export const useSettings = () => useAppStore((state) => state.settings);
export const useAddRecord = () => useAppStore((state) => state.addRecord);
export const useUpdateRecord = () => useAppStore((state) => state.updateRecord);
export const useDeleteRecord = () => useAppStore((state) => state.deleteRecord);
export const useExportData = () => useAppStore((state) => state.exportData);
export const useLoadMockData = () => useAppStore((state) => state.loadMockData);

export const useCreateRecordFromNow = () => {
  const addRecord = useAddRecord();
  return (road: string, isSplashed: boolean, note?: string) => {
    const now = Date.now();
    const date = new Date(now);
    addRecord({
      timestamp: now,
      date: formatDate(now),
      time: formatTime(now),
      hour: date.getHours(),
      minute: date.getMinutes(),
      dayOfWeek: date.getDay(),
      road,
      isSplashed,
      note,
    });
  };
};

export const useToggleFavoriteRoad = () => {
  const updateSettings = useAppStore((state) => state.updateSettings);
  const favoriteRoads = useAppStore((state) => state.settings.favoriteRoads);
  return (roadName: string) => {
    const newFavorites = favoriteRoads.includes(roadName)
      ? favoriteRoads.filter((r) => r !== roadName)
      : [...favoriteRoads, roadName];
    updateSettings({ favoriteRoads: newFavorites });
  };
};

export const useIsFavoriteRoad = (roadName: string) => {
  const favoriteRoads = useAppStore((state) => state.settings.favoriteRoads);
  return favoriteRoads.includes(roadName);
};

export const useFavoritePredictions = () => {
  const predictions = usePredictions();
  const favoriteRoads = useAppStore((state) => state.settings.favoriteRoads);
  return predictions.filter((p) => favoriteRoads.includes(p.roadName));
};
