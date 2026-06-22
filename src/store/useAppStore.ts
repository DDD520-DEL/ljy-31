import { create } from 'zustand';
import {
  AppState,
  SprinklerRecord,
  AppSettings,
  StorageKeys,
  WeatherData,
  WeeklyReport,
  WeeklyReportSettings,
  ExportOptions,
  ImportReport,
  Photo,
  StorageInfo,
  CommunityRoadStats,
  ContributionStats,
  CommunitySettings,
  RouteLibraryItem,
  RecordTemplate,
  Achievement,
  UserAchievement,
  AchievementProgress,
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
import { recordsToCSV, parseCSVToRecords } from '../utils/csv';
import {
  generateStorageInfo,
  setStorageQuota as setStorageQuotaFn,
} from '../utils/storageManager';
import { communityService } from '../services/community';
import {
  ACHIEVEMENTS,
  calculateAchievementProgress,
  findNewlyUnlockedAchievements,
} from '../utils/achievements';

const defaultWeeklyReportSettings: WeeklyReportSettings = {
  autoGenerate: true,
  pushDay: 1,
  pushHour: 8,
  pushMinute: 0,
  lastGeneratedId: null,
  lastGeneratedAt: null,
  bannerDismissed: {},
};

const defaultCommunitySettings: CommunitySettings = communityService.getDefaultCommunitySettings();

const defaultSettings: AppSettings = {
  theme: 'light',
  reminderEnabled: true,
  reminderMinutes: 15,
  favoriteRoads: [],
  weatherNotificationEnabled: true,
  weeklyReport: defaultWeeklyReportSettings,
  community: defaultCommunitySettings,
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
    community: {
      ...defaultCommunitySettings,
      ...(stored.community || {}),
    },
  };
};

const getInitialCommunityRecords = (localRecords: SprinklerRecord[]): SprinklerRecord[] => {
  return communityService.getCommunityRecords(localRecords);
};

const getInitialWeeklyReports = (): WeeklyReport[] => {
  return storage.get<WeeklyReport[]>(StorageKeys.WEEKLY_REPORTS, []);
};

const getInitialPhotos = (): Photo[] => {
  return storage.get<Photo[]>(StorageKeys.PHOTOS, []);
};

const getInitialRouteLibrary = (): RouteLibraryItem[] => {
  return storage.get<RouteLibraryItem[]>(StorageKeys.ROUTE_LIBRARY, []);
};

const getInitialRecordTemplates = (): RecordTemplate[] => {
  return storage.get<RecordTemplate[]>(StorageKeys.RECORD_TEMPLATES, []);
};

const getInitialUserAchievements = (): UserAchievement[] => {
  return storage.get<UserAchievement[]>(StorageKeys.ACHIEVEMENTS, []);
};

const initialRecords = getInitialRecords();
const initialSettings = getInitialSettings();
const initialCommunityRecords = getInitialCommunityRecords(initialRecords);
const initialMergedRecords = initialSettings.community.useCommunityData
  ? [...initialRecords, ...initialCommunityRecords]
  : initialRecords;
const initialPredictions = generateAllPredictions(initialMergedRecords);
const initialStatistics = generateStatistics(initialRecords);
const initialWeather = getInitialWeather();
const initialWeeklyReports = getInitialWeeklyReports();
const initialLatestWeeklyReport =
  initialWeeklyReports.length > 0
    ? initialWeeklyReports.sort((a, b) => b.generatedAt - a.generatedAt)[0]
    : null;
const initialPhotos = getInitialPhotos();
const initialStorageInfo = generateStorageInfo(initialPhotos);
const initialRouteLibrary = getInitialRouteLibrary();
const initialRecordTemplates = getInitialRecordTemplates();
const initialCommunityRoadStats = communityService.generateRoadStats(initialCommunityRecords);
const initialContributionStats = communityService.generateContributionStats(
  initialRecords,
  initialSettings.community
);
const initialUserAchievements = getInitialUserAchievements();
const initialAchievementProgress = calculateAchievementProgress(initialRecords, ACHIEVEMENTS);
const initialNewAchievements = initialUserAchievements.filter((a) => a.isNew);

export const useAppStore = create<AppState>((set, get) => ({
  records: initialRecords,
  communityRecords: initialCommunityRecords,
  predictions: initialPredictions,
  statistics: initialStatistics,
  communityRoadStats: initialCommunityRoadStats,
  contributionStats: initialContributionStats,
  settings: initialSettings,
  weather: initialWeather,
  weeklyReports: initialWeeklyReports,
  latestWeeklyReport: initialLatestWeeklyReport,
  isLoading: false,
  isWeatherLoading: false,
  isGeneratingReport: false,
  isCommunitySyncing: false,
  photos: initialPhotos,
  storageInfo: initialStorageInfo,
  routeLibrary: initialRouteLibrary,
  recordTemplates: initialRecordTemplates,
  achievements: ACHIEVEMENTS,
  userAchievements: initialUserAchievements,
  achievementProgress: initialAchievementProgress,
  newAchievements: initialNewAchievements,

  addRecord: (recordData) => {
    const now = Date.now();
    const newRecord: SprinklerRecord = {
      ...recordData,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      dataSource: 'local',
    };

    set((state) => {
      const newRecords = [newRecord, ...state.records];
      storage.set(StorageKeys.RECORDS, newRecords);
      return { records: newRecords };
    });

    const { settings } = get();
    if (settings.community.enabled && settings.community.autoShare) {
      get().shareRecordToCommunity(newRecord.id);
    }

    get().refreshPredictions();
    get().refreshStatistics();
    get().checkAchievements();
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
      const newPhotos = state.photos.filter((photo) => photo.recordId !== id);
      storage.set(StorageKeys.RECORDS, newRecords);
      storage.set(StorageKeys.PHOTOS, newPhotos);
      return {
        records: newRecords,
        photos: newPhotos,
        storageInfo: generateStorageInfo(newPhotos),
      };
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
    const { records, communityRecords, settings } = get();
    const mergedRecords = settings.community.useCommunityData
      ? [...records, ...communityRecords]
      : records;
    const predictions = generateAllPredictions(mergedRecords);
    storage.set(StorageKeys.PREDICTIONS, predictions);
    set({ predictions });
  },

  getMergedRecords: () => {
    const { records, communityRecords, settings } = get();
    return settings.community.useCommunityData
      ? [...records, ...communityRecords]
      : records;
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

  exportRecordsCSV: (options?: ExportOptions) => {
    const { records } = get();
    let exportRecords = [...records];

    if (options) {
      if (options.scope === 'filtered' && options.filteredIds) {
        const idSet = new Set(options.filteredIds);
        exportRecords = exportRecords.filter((r) => idSet.has(r.id));
      } else if (options.scope === 'dateRange' && options.dateRange) {
        const { start, end } = options.dateRange;
        exportRecords = exportRecords.filter(
          (r) => r.date >= start && r.date <= end
        );
      }
    }

    exportRecords.sort((a, b) => b.timestamp - a.timestamp);
    return recordsToCSV(exportRecords);
  },

  importRecordsFromCSV: (csvContent: string): ImportReport => {
    const report = parseCSVToRecords(csvContent);

    if (report.createdRecords && report.createdRecords.length > 0) {
      const existingRecords = get().records;
      const newRecords = [...report.createdRecords, ...existingRecords];
      newRecords.sort((a, b) => b.timestamp - a.timestamp);
      storage.set(StorageKeys.RECORDS, newRecords);

      set((state) => {
        const updatedRecords = [...report.createdRecords!, ...state.records];
        updatedRecords.sort((a, b) => b.timestamp - a.timestamp);
        return { records: updatedRecords };
      });

      get().refreshPredictions();
      get().refreshStatistics();
    }

    return report;
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

  addPhoto: (photoData) => {
    const now = Date.now();
    const newPhoto: Photo = {
      ...photoData,
      id: generateId(),
      uploadedAt: now,
    };

    set((state) => {
      const newPhotos = [...state.photos, newPhoto];
      storage.set(StorageKeys.PHOTOS, newPhotos);
      return {
        photos: newPhotos,
        storageInfo: generateStorageInfo(newPhotos),
      };
    });

    return newPhoto;
  },

  updatePhoto: (id, updates) => {
    set((state) => {
      const newPhotos = state.photos.map((photo) =>
        photo.id === id ? { ...photo, ...updates } : photo
      );
      storage.set(StorageKeys.PHOTOS, newPhotos);
      return {
        photos: newPhotos,
        storageInfo: generateStorageInfo(newPhotos),
      };
    });
  },

  deletePhoto: (id) => {
    set((state) => {
      const newPhotos = state.photos.filter((photo) => photo.id !== id);
      storage.set(StorageKeys.PHOTOS, newPhotos);
      return {
        photos: newPhotos,
        storageInfo: generateStorageInfo(newPhotos),
      };
    });
  },

  getPhotosByRecordId: (recordId) => {
    return get().photos.filter((photo) => photo.recordId === recordId);
  },

  refreshStorageInfo: () => {
    set((state) => ({
      storageInfo: generateStorageInfo(state.photos),
    }));
  },

  setStorageQuota: (quotaMB) => {
    setStorageQuotaFn(quotaMB);
    set((state) => ({
      storageInfo: generateStorageInfo(state.photos),
    }));
  },

  clearAllPhotos: () => {
    storage.set(StorageKeys.PHOTOS, []);
    set({
      photos: [],
      storageInfo: generateStorageInfo([]),
    });
  },

  shareRecordToCommunity: async (recordId: string): Promise<boolean> => {
    const { records, settings } = get();
    const record = records.find(r => r.id === recordId);
    if (!record || !settings.community.enabled) return false;

    set({ isCommunitySyncing: true });
    try {
      const success = await communityService.submitRecord(record, settings.community);
      if (success) {
        const newSettings = {
          ...settings,
          community: {
            ...settings.community,
            contributedCount: settings.community.contributedCount + 1,
            lastSyncAt: Date.now(),
          },
        };
        storage.set(StorageKeys.SETTINGS, newSettings);
        set({
          settings: newSettings,
          isCommunitySyncing: false,
        });
        get().refreshContributionStats();
        get().refreshCommunityRoadStats();
      } else {
        set({ isCommunitySyncing: false });
      }
      return success;
    } catch (error) {
      set({ isCommunitySyncing: false });
      return false;
    }
  },

  shareMultipleRecords: async (recordIds: string[]): Promise<number> => {
    const { records, settings } = get();
    if (!settings.community.enabled) return 0;

    const targetRecords = records.filter(r => recordIds.includes(r.id));
    if (targetRecords.length === 0) return 0;

    set({ isCommunitySyncing: true });
    try {
      const submitted = await communityService.submitRecords(targetRecords, settings.community);
      if (submitted > 0) {
        const newSettings = {
          ...settings,
          community: {
            ...settings.community,
            contributedCount: settings.community.contributedCount + submitted,
            lastSyncAt: Date.now(),
          },
        };
        storage.set(StorageKeys.SETTINGS, newSettings);
        set({
          settings: newSettings,
          isCommunitySyncing: false,
        });
        get().refreshContributionStats();
        get().refreshCommunityRoadStats();
      } else {
        set({ isCommunitySyncing: false });
      }
      return submitted;
    } catch (error) {
      set({ isCommunitySyncing: false });
      return 0;
    }
  },

  shareAllRecords: async (): Promise<number> => {
    const { records } = get();
    return get().shareMultipleRecords(records.map(r => r.id));
  },

  syncCommunityData: async (): Promise<void> => {
    const { records, settings } = get();
    if (!settings.community.enabled) return;

    set({ isCommunitySyncing: true });
    try {
      const communityRecords = await communityService.fetchCommunityData(records);
      const newSettings = {
        ...settings,
        community: {
          ...settings.community,
          lastSyncAt: Date.now(),
        },
      };
      storage.set(StorageKeys.SETTINGS, newSettings);
      set({
        communityRecords,
        settings: newSettings,
        isCommunitySyncing: false,
      });
      get().refreshPredictions();
      get().refreshCommunityRoadStats();
    } catch (error) {
      set({ isCommunitySyncing: false });
    }
  },

  updateCommunitySettings: (updates: Partial<CommunitySettings>): void => {
    set((state) => {
      const newCommunitySettings = { ...state.settings.community, ...updates };
      const newSettings = { ...state.settings, community: newCommunitySettings };
      storage.set(StorageKeys.SETTINGS, newSettings);
      return { settings: newSettings };
    });
    get().refreshPredictions();
  },

  refreshCommunityRoadStats: (): void => {
    const { communityRecords } = get();
    const stats = communityService.generateRoadStats(communityRecords);
    set({ communityRoadStats: stats });
  },

  refreshContributionStats: (): void => {
    const { records, settings } = get();
    const stats = communityService.generateContributionStats(records, settings.community);
    set({ contributionStats: stats });
  },

  addRouteItem: (itemData) => {
    const now = Date.now();
    const newItem: RouteLibraryItem = {
      ...itemData,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };

    set((state) => {
      const newRouteLibrary = [...state.routeLibrary, newItem];
      storage.set(StorageKeys.ROUTE_LIBRARY, newRouteLibrary);
      return { routeLibrary: newRouteLibrary };
    });

    return newItem;
  },

  updateRouteItem: (id, updates) => {
    set((state) => {
      const newRouteLibrary = state.routeLibrary.map((item) =>
        item.id === id
          ? { ...item, ...updates, updatedAt: Date.now() }
          : item
      );
      storage.set(StorageKeys.ROUTE_LIBRARY, newRouteLibrary);
      return { routeLibrary: newRouteLibrary };
    });
  },

  deleteRouteItem: (id) => {
    set((state) => {
      const newRouteLibrary = state.routeLibrary.filter((item) => item.id !== id);
      storage.set(StorageKeys.ROUTE_LIBRARY, newRouteLibrary);
      return { routeLibrary: newRouteLibrary };
    });
  },

  getRouteLibrary: () => {
    return get().routeLibrary;
  },

  refreshRouteLibrary: () => {
    const routeLibrary = getInitialRouteLibrary();
    set({ routeLibrary });
  },

  addRecordTemplate: (templateData) => {
    const now = Date.now();
    const newTemplate: RecordTemplate = {
      ...templateData,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };

    set((state) => {
      const newRecordTemplates = [...state.recordTemplates, newTemplate];
      storage.set(StorageKeys.RECORD_TEMPLATES, newRecordTemplates);
      return { recordTemplates: newRecordTemplates };
    });

    return newTemplate;
  },

  updateRecordTemplate: (id, updates) => {
    set((state) => {
      const newRecordTemplates = state.recordTemplates.map((template) =>
        template.id === id
          ? { ...template, ...updates, updatedAt: Date.now() }
          : template
      );
      storage.set(StorageKeys.RECORD_TEMPLATES, newRecordTemplates);
      return { recordTemplates: newRecordTemplates };
    });
  },

  deleteRecordTemplate: (id) => {
    set((state) => {
      const newRecordTemplates = state.recordTemplates.filter((template) => template.id !== id);
      storage.set(StorageKeys.RECORD_TEMPLATES, newRecordTemplates);
      return { recordTemplates: newRecordTemplates };
    });
  },

  getRecordTemplates: () => {
    return get().recordTemplates;
  },

  refreshRecordTemplates: () => {
    const recordTemplates = getInitialRecordTemplates();
    set({ recordTemplates });
  },

  checkAchievements: () => {
    const { records, userAchievements, achievements } = get();
    const progress = calculateAchievementProgress(records, achievements);
    const newlyUnlocked = findNewlyUnlockedAchievements(progress, userAchievements);

    if (newlyUnlocked.length === 0) {
      set({ achievementProgress: progress });
      return [];
    }

    const now = Date.now();
    const newUserAchievements: UserAchievement[] = newlyUnlocked.map((a) => ({
      achievementId: a.id,
      unlockedAt: now,
      isNew: true,
    }));

    const updatedUserAchievements = [...userAchievements, ...newUserAchievements];
    storage.set(StorageKeys.ACHIEVEMENTS, updatedUserAchievements);

    const updatedProgress = progress.map((p) => {
      const userAch = updatedUserAchievements.find(
        (ua) => ua.achievementId === p.achievementId
      );
      return {
        ...p,
        unlockedAt: userAch?.unlockedAt,
      };
    });

    const newAchievementsList = updatedUserAchievements.filter((a) => a.isNew);

    set({
      userAchievements: updatedUserAchievements,
      achievementProgress: updatedProgress,
      newAchievements: newAchievementsList,
    });

    return newUserAchievements;
  },

  markAchievementAsRead: (achievementId: string) => {
    set((state) => {
      const updatedUserAchievements = state.userAchievements.map((ua) =>
        ua.achievementId === achievementId ? { ...ua, isNew: false } : ua
      );
      storage.set(StorageKeys.ACHIEVEMENTS, updatedUserAchievements);
      return {
        userAchievements: updatedUserAchievements,
        newAchievements: updatedUserAchievements.filter((a) => a.isNew),
      };
    });
  },

  markAllAchievementsAsRead: () => {
    set((state) => {
      const updatedUserAchievements = state.userAchievements.map((ua) => ({
        ...ua,
        isNew: false,
      }));
      storage.set(StorageKeys.ACHIEVEMENTS, updatedUserAchievements);
      return {
        userAchievements: updatedUserAchievements,
        newAchievements: [],
      };
    });
  },

  refreshAchievementProgress: () => {
    const { records, achievements, userAchievements } = get();
    const progress = calculateAchievementProgress(records, achievements);
    const progressWithUnlockTime = progress.map((p) => {
      const userAch = userAchievements.find(
        (ua) => ua.achievementId === p.achievementId
      );
      return {
        ...p,
        unlockedAt: userAch?.unlockedAt,
      };
    });
    set({ achievementProgress: progressWithUnlockTime });
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
export const useExportRecordsCSV = () => useAppStore((state) => state.exportRecordsCSV);
export const useImportRecordsFromCSV = () => useAppStore((state) => state.importRecordsFromCSV);
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
      direction: 'east',
      note: note || '',
      dataSource: 'local',
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

export const usePhotos = () => useAppStore((state) => state.photos);
export const useStorageInfo = () => useAppStore((state) => state.storageInfo);
export const useAddPhoto = () => useAppStore((state) => state.addPhoto);
export const useUpdatePhoto = () => useAppStore((state) => state.updatePhoto);
export const useDeletePhoto = () => useAppStore((state) => state.deletePhoto);
export const useGetPhotosByRecordId = () => useAppStore((state) => state.getPhotosByRecordId);
export const useRefreshStorageInfo = () => useAppStore((state) => state.refreshStorageInfo);
export const useSetStorageQuota = () => useAppStore((state) => state.setStorageQuota);
export const useClearAllPhotos = () => useAppStore((state) => state.clearAllPhotos);

export const useCommunityRecords = () => useAppStore((state) => state.communityRecords);
export const useCommunityRoadStats = () => useAppStore((state) => state.communityRoadStats);
export const useContributionStats = () => useAppStore((state) => state.contributionStats);
export const useCommunitySettings = () => useAppStore((state) => state.settings.community);
export const useIsCommunitySyncing = () => useAppStore((state) => state.isCommunitySyncing);
export const useShareRecordToCommunity = () => useAppStore((state) => state.shareRecordToCommunity);
export const useShareMultipleRecords = () => useAppStore((state) => state.shareMultipleRecords);
export const useShareAllRecords = () => useAppStore((state) => state.shareAllRecords);
export const useSyncCommunityData = () => useAppStore((state) => state.syncCommunityData);
export const useUpdateCommunitySettings = () => useAppStore((state) => state.updateCommunitySettings);
export const useRefreshCommunityRoadStats = () => useAppStore((state) => state.refreshCommunityRoadStats);
export const useRefreshContributionStats = () => useAppStore((state) => state.refreshContributionStats);
export const useGetMergedRecords = () => useAppStore((state) => state.getMergedRecords);

export const useRouteLibrary = () => useAppStore((state) => state.routeLibrary);
export const useAddRouteItem = () => useAppStore((state) => state.addRouteItem);
export const useUpdateRouteItem = () => useAppStore((state) => state.updateRouteItem);
export const useDeleteRouteItem = () => useAppStore((state) => state.deleteRouteItem);
export const useGetRouteLibrary = () => useAppStore((state) => state.getRouteLibrary);
export const useRefreshRouteLibrary = () => useAppStore((state) => state.refreshRouteLibrary);

export const useRecordTemplates = () => useAppStore((state) => state.recordTemplates);
export const useAddRecordTemplate = () => useAppStore((state) => state.addRecordTemplate);
export const useUpdateRecordTemplate = () => useAppStore((state) => state.updateRecordTemplate);
export const useDeleteRecordTemplate = () => useAppStore((state) => state.deleteRecordTemplate);
export const useGetRecordTemplates = () => useAppStore((state) => state.getRecordTemplates);
export const useRefreshRecordTemplates = () => useAppStore((state) => state.refreshRecordTemplates);

export const useAchievements = () => useAppStore((state) => state.achievements);
export const useUserAchievements = () => useAppStore((state) => state.userAchievements);
export const useAchievementProgress = () => useAppStore((state) => state.achievementProgress);
export const useNewAchievements = () => useAppStore((state) => state.newAchievements);
export const useCheckAchievements = () => useAppStore((state) => state.checkAchievements);
export const useMarkAchievementAsRead = () => useAppStore((state) => state.markAchievementAsRead);
export const useMarkAllAchievementsAsRead = () => useAppStore((state) => state.markAllAchievementsAsRead);
export const useRefreshAchievementProgress = () => useAppStore((state) => state.refreshAchievementProgress);
