import { create } from 'zustand';
import {
  AppState,
  SprinklerRecord,
  AppSettings,
  StorageKeys,
  RoadPrediction,
  WeatherData,
  WeeklyReport,
  WeeklyReportSettings,
} from '../types';
import { storage } from '../utils/storage';
import {
  generateAllPredictions,
  generateStatistics,
  generateWeeklyReport as generateWeeklyReportFn,
  shouldGenerateWeeklyReport,
} from '../utils/analysis';
import { generateId, formatDate, formatTime } from '../utils/format';
import { mockRecords } from '../data/mockRecords';
import { fetchWeatherData, calculateWeatherAdjustment, shouldRefreshWeather } from '../utils/weather';

const defaultWeeklyReportSettings: WeeklyReportSettings = {
  autoGenerate: true,
  pushDay: 1,
  pushHour: 8,
  pushMinute: 0,
  lastGeneratedId: null,
  lastGeneratedAt: null,
  bannerDismissed: {},
};

const defaultSettings: AppSettings = {
  theme: 'light',
  reminderEnabled: true,
  reminderMinutes: 15,
  favoriteRoads: [],
  weatherNotificationEnabled: true,
  weeklyReport: defaultWeeklyReportSettings,
};

const getInitialRecords = (): SprinklerRecord[] => {
  const stored = storage.get<SprinklerRecord[]>(StorageKeys.RECORDS, []);
  if (stored.length > 0) return stored;
  return mockRecords;
};

const getInitialWeather = (): WeatherData | null => {
  const stored = storage.get<WeatherData | null>(StorageKeys.WEATHER, null);
  if (stored && !shouldRefreshWeather(stored.lastUpdated)) {
    return stored;
  }
  return null;
};

const getInitialSettings = (): AppSettings => {
  const stored = storage.get<AppSettings>(StorageKeys.SETTINGS, defaultSettings);
  return {
    ...defaultSettings,
    ...stored,
    weeklyReport: {
      ...defaultWeeklyReportSettings,
      ...(stored.weeklyReport || {}),
    },
  };
};

const getInitialWeeklyReports = (): WeeklyReport[] => {
  return storage.get<WeeklyReport[]>(StorageKeys.WEEKLY_REPORTS, []);
};

const initialRecords = getInitialRecords();
const initialPredictions = generateAllPredictions(initialRecords);
const initialStatistics = generateStatistics(initialRecords);
const initialSettings = getInitialSettings();
const initialWeather = getInitialWeather();
const initialWeeklyReports = getInitialWeeklyReports();
const initialLatestWeeklyReport =
  initialWeeklyReports.length > 0
    ? initialWeeklyReports.sort((a, b) => b.generatedAt - a.generatedAt)[0]
    : null;

export const useAppStore = create<AppState>((set, get) => ({
  records: initialRecords,
  predictions: initialPredictions,
  statistics: initialStatistics,
  settings: initialSettings,
  weather: initialWeather,
  weeklyReports: initialWeeklyReports,
  latestWeeklyReport: initialLatestWeeklyReport,
  isLoading: false,
  isWeatherLoading: false,
  isGeneratingReport: false,

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

  refreshWeather: async () => {
    set({ isWeatherLoading: true });
    try {
      const weatherData = await fetchWeatherData();
      storage.set(StorageKeys.WEATHER, weatherData);
      set({ weather: weatherData, isWeatherLoading: false });
      return weatherData;
    } catch (error) {
      set({ isWeatherLoading: false });
      throw error;
    }
  },

  getWeatherAdjustment: (probability: number) => {
    const { weather } = get();
    if (!weather) {
      return {
        originalProbability: probability,
        adjustedProbability: probability,
        adjustmentFactor: 1.0,
        reason: '暂无天气数据',
      };
    }
    return calculateWeatherAdjustment(probability, weather.type);
  },

  generateWeeklyReport: (weekStartDate?: string) => {
    set({ isGeneratingReport: true });
    try {
      const { records, weeklyReports, settings } = get();
      const report = generateWeeklyReportFn(records, weekStartDate);

      if (!report) {
        set({ isGeneratingReport: false });
        return null;
      }

      const existingIndex = weeklyReports.findIndex(
        (r) => r.weekStart === report.weekStart
      );

      let newReports: WeeklyReport[];
      if (existingIndex >= 0) {
        newReports = [...weeklyReports];
        newReports[existingIndex] = report;
      } else {
        newReports = [...weeklyReports, report];
      }

      newReports.sort((a, b) => b.generatedAt - a.generatedAt);

      const newSettings = {
        ...settings,
        weeklyReport: {
          ...settings.weeklyReport,
          lastGeneratedId: report.id,
          lastGeneratedAt: report.generatedAt,
        },
      };

      storage.set(StorageKeys.WEEKLY_REPORTS, newReports);
      storage.set(StorageKeys.SETTINGS, newSettings);

      set({
        weeklyReports: newReports,
        latestWeeklyReport: report,
        settings: newSettings,
        isGeneratingReport: false,
      });

      return report;
    } catch (error) {
      console.error('Failed to generate weekly report:', error);
      set({ isGeneratingReport: false });
      return null;
    }
  },

  getWeeklyReportByWeek: (weekStart: string) => {
    const { weeklyReports } = get();
    return weeklyReports.find((r) => r.weekStart === weekStart);
  },

  dismissWeeklyBanner: (reportId: string) => {
    const { settings } = get();
    const newSettings = {
      ...settings,
      weeklyReport: {
        ...settings.weeklyReport,
        bannerDismissed: {
          ...settings.weeklyReport.bannerDismissed,
          [reportId]: true,
        },
      },
    };
    storage.set(StorageKeys.SETTINGS, newSettings);
    set({ settings: newSettings });
  },

  checkAndGenerateWeeklyReport: () => {
    const { settings } = get();
    const { autoGenerate, lastGeneratedAt, pushDay, pushHour, pushMinute } =
      settings.weeklyReport;

    if (
      shouldGenerateWeeklyReport(
        autoGenerate,
        lastGeneratedAt,
        pushDay,
        pushHour,
        pushMinute
      )
    ) {
      return get().generateWeeklyReport();
    }
    return null;
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

export const useWeather = () => useAppStore((state) => state.weather);
export const useIsWeatherLoading = () => useAppStore((state) => state.isWeatherLoading);
export const useRefreshWeather = () => useAppStore((state) => state.refreshWeather);
export const useGetWeatherAdjustment = () => useAppStore((state) => state.getWeatherAdjustment);

export const useWeeklyReports = () => useAppStore((state) => state.weeklyReports);
export const useLatestWeeklyReport = () => useAppStore((state) => state.latestWeeklyReport);
export const useIsGeneratingReport = () => useAppStore((state) => state.isGeneratingReport);
export const useGenerateWeeklyReport = () => useAppStore((state) => state.generateWeeklyReport);
export const useGetWeeklyReportByWeek = () => useAppStore((state) => state.getWeeklyReportByWeek);
export const useDismissWeeklyBanner = () => useAppStore((state) => state.dismissWeeklyBanner);
export const useCheckAndGenerateWeeklyReport = () => useAppStore((state) => state.checkAndGenerateWeeklyReport);
export const useWeeklyReportSettings = () => useAppStore((state) => state.settings.weeklyReport);
