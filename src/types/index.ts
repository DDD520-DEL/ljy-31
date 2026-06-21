export interface Photo {
  id: string;
  recordId: string;
  dataUrl: string;
  thumbnail: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  width: number;
  height: number;
  uploadedAt: number;
  ocrResult?: OCRResult;
  ocrStatus: 'pending' | 'processing' | 'success' | 'failed';
}

export interface OCRResult {
  timestamp: number;
  rawText: string;
  detectedTime?: string;
  detectedDate?: string;
  detectedLocation?: string;
  confidence: number;
  error?: string;
}

export interface StorageInfo {
  totalSize: number;
  usedSize: number;
  photoCount: number;
  quotaLimit: number;
  quotaWarning: boolean;
  quotaExceeded: boolean;
}

export interface SprinklerRecord {
  id: string;
  timestamp: number;
  date: string;
  time: string;
  hour: number;
  minute: number;
  dayOfWeek: number;
  road: string;
  isSplashed: boolean;
  direction?: 'east' | 'west' | 'south' | 'north';
  note?: string;
  photos?: Photo[];
  createdAt: number;
  updatedAt: number;
}

export interface PredictedTime {
  hour: number;
  minute: number;
  probability: number;
  averageTime: string;
  confidence: number;
}

export interface RoadPrediction {
  roadName: string;
  recordCount: number;
  splashCount: number;
  splashProbability: number;
  predictedTimes: PredictedTime[];
  hourlyDistribution: Record<number, number>;
  lastUpdated: number;
}

export interface StatisticsData {
  totalRecords: number;
  totalSplashed: number;
  splashRate: number;
  recordsByDay: Array<{ date: string; count: number; splashed: number }>;
  recordsByHour: Array<{ hour: number; count: number; splashed: number }>;
  topRoads: Array<{ road: string; count: number; splashRate: number }>;
  heatmapData: Array<{ hour: number; day: number; count: number }>;
  monthlyTrend: Array<{ date: string; count: number }>;
}

export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy';

export interface WeatherData {
  type: WeatherType;
  temperature: number;
  humidity: number;
  description: string;
  icon: string;
  windSpeed: number;
  lastUpdated: number;
}

export interface WeatherAdjustment {
  originalProbability: number;
  adjustedProbability: number;
  adjustmentFactor: number;
  reason: string;
}

export interface RoadWeeklyStats {
  road: string;
  recordCount: number;
  splashCount: number;
  splashRate: number;
  prevRecordCount: number;
  prevSplashCount: number;
  prevSplashRate: number;
  changeRate: number;
  trend: 'up' | 'down' | 'stable';
}

export interface HighRiskPeriod {
  dayOfWeek: number;
  dayName: string;
  hour: number;
  hourRange: string;
  riskLevel: 'high' | 'medium' | 'low';
  recordCount: number;
  splashRate: number;
}

export interface WeeklyReport {
  id: string;
  weekStart: string;
  weekEnd: string;
  weekNumber: number;
  generatedAt: number;
  totalRecords: number;
  totalSplashed: number;
  overallSplashRate: number;
  prevTotalRecords: number;
  prevTotalSplashed: number;
  prevOverallSplashRate: number;
  overallChange: number;
  overallTrend: 'up' | 'down' | 'stable';
  roadStats: RoadWeeklyStats[];
  highRiskPeriods: HighRiskPeriod[];
  topSplashRoads: RoadWeeklyStats[];
  mostImprovedRoads: RoadWeeklyStats[];
  dailySummary: Array<{
    date: string;
    dayName: string;
    recordCount: number;
    splashCount: number;
    splashRate: number;
  }>;
}

export interface WeeklyReportSettings {
  autoGenerate: boolean;
  pushDay: number;
  pushHour: number;
  pushMinute: number;
  lastGeneratedId: string | null;
  lastGeneratedAt: number | null;
  bannerDismissed: Record<string, boolean>;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  reminderEnabled: boolean;
  reminderMinutes: number;
  favoriteRoads: string[];
  weatherNotificationEnabled: boolean;
  weeklyReport: WeeklyReportSettings;
}

export type NotificationType = 'road_reminder' | 'weather_alert' | 'weekly_report' | 'system';

export interface NotificationMessage {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  roadName?: string;
  predictedTime?: string;
  probability?: number;
  timestamp: number;
  read: boolean;
  data?: Record<string, unknown>;
}

export interface QuietHours {
  enabled: boolean;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

export interface PushSettings {
  enabled: boolean;
  roadReminderEnabled: boolean;
  weatherAlertEnabled: boolean;
  weeklyReportEnabled: boolean;
  quietHours: QuietHours;
  doNotDisturb: boolean;
  vibrate: boolean;
  sound: boolean;
}

export interface WebSocketStatus {
  connected: boolean;
  connecting: boolean;
  lastConnectTime: number | null;
  lastDisconnectTime: number | null;
  reconnectAttempts: number;
}

export enum StorageKeys {
  RECORDS = 'sprinkler_records',
  PREDICTIONS = 'sprinkler_predictions',
  SETTINGS = 'sprinkler_settings',
  WEATHER = 'sprinkler_weather',
  WEEKLY_REPORTS = 'sprinkler_weekly_reports',
  NOTIFICATIONS = 'sprinkler_notifications',
  PUSH_SETTINGS = 'sprinkler_push_settings',
  SEARCH_HISTORY = 'sprinkler_search_history',
  PHOTOS = 'sprinkler_photos',
  STORAGE_QUOTA = 'sprinkler_storage_quota',
}

export type SearchResultType = 'road' | 'record' | 'statistic';

export interface SearchResultItem {
  type: SearchResultType;
  id: string;
  title: string;
  subtitle?: string;
  matchField?: string;
  matchText?: string;
  target: {
    roadName?: string;
    recordId?: string;
    statisticSection?: 'overview' | 'hourly' | 'monthly' | 'heatmap' | 'topRoads' | 'splashRate';
  };
}

export interface SearchHistoryItem {
  keyword: string;
  timestamp: number;
}

export interface ImportReportItem {
  lineNumber: number;
  row: Record<string, string>;
  success: boolean;
  errors?: string[];
  record?: SprinklerRecord;
}

export interface ImportReport {
  total: number;
  success: number;
  failed: number;
  items: ImportReportItem[];
  createdRecords?: SprinklerRecord[];
  startedAt: number;
  finishedAt: number;
  error?: string;
}

export type ExportScope = 'all' | 'filtered' | 'dateRange';

export interface ExportOptions {
  scope: ExportScope;
  dateRange?: { start: string; end: string };
  filteredIds?: string[];
}

export interface RouteSegment {
  roadName: string;
  order: number;
  distance: number;
  estimatedTime: number;
  splashProbability: number;
  adjustedProbability: number;
  riskLevel: 'high' | 'medium' | 'low';
  highRiskTimes: string[];
  lowRiskTimes: string[];
}

export interface RouteOption {
  id: string;
  name: string;
  segments: RouteSegment[];
  totalDistance: number;
  totalEstimatedTime: number;
  overallRisk: number;
  adjustedOverallRisk: number;
  riskLevel: 'high' | 'medium' | 'low';
  highRiskSegments: number;
  mediumRiskSegments: number;
  lowRiskSegments: number;
  bestDepartureTime?: string;
  worstDepartureTime?: string;
  savedProbability?: number;
  tag?: '推荐' | '最快' | '最安全' | '备选';
}

export interface RoutePlanInput {
  origin: string;
  destination: string;
  departureTime?: string;
  dayOfWeek?: number;
}

export interface TimeSlotRisk {
  timeSlot: string;
  startHour: number;
  endHour: number;
  averageRisk: number;
  highRiskRoads: string[];
  mediumRiskRoads: string[];
  lowRiskRoads: string[];
}

export interface RoadHourlyRisk {
  roadName: string;
  hourlyRisk: Record<number, number>;
  overallRisk: number;
  peakHours: number[];
  safeHours: number[];
}

export interface RouteAvoidanceResult {
  input: RoutePlanInput;
  routes: RouteOption[];
  bestRouteId: string;
  timeSlotRisks: TimeSlotRisk[];
  generatedAt: number;
}

export interface HeatmapRoadData {
  roadName: string;
  hourlyData: Array<{ hour: number; risk: number }>;
  overallRisk: number;
}

export interface AppState {
  records: SprinklerRecord[];
  predictions: RoadPrediction[];
  statistics: StatisticsData | null;
  settings: AppSettings;
  weather: WeatherData | null;
  weeklyReports: WeeklyReport[];
  latestWeeklyReport: WeeklyReport | null;
  isLoading: boolean;
  isWeatherLoading: boolean;
  isGeneratingReport: boolean;
  photos: Photo[];
  storageInfo: StorageInfo;
  addRecord: (record: Omit<SprinklerRecord, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateRecord: (id: string, record: Partial<SprinklerRecord>) => void;
  deleteRecord: (id: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  refreshPredictions: () => void;
  refreshStatistics: () => void;
  loadMockData: () => void;
  exportData: () => string;
  exportRecordsCSV: (options?: ExportOptions) => string;
  importRecordsFromCSV: (csvContent: string) => ImportReport;
  refreshWeather: () => Promise<WeatherData>;
  getWeatherAdjustment: (probability: number) => WeatherAdjustment;
  generateWeeklyReport: (weekStartDate?: string) => WeeklyReport | null;
  getWeeklyReportByWeek: (weekStart: string) => WeeklyReport | undefined;
  dismissWeeklyBanner: (reportId: string) => void;
  checkAndGenerateWeeklyReport: () => WeeklyReport | null;
  addPhoto: (photo: Omit<Photo, 'id' | 'uploadedAt'>) => Photo;
  updatePhoto: (id: string, updates: Partial<Photo>) => void;
  deletePhoto: (id: string) => void;
  getPhotosByRecordId: (recordId: string) => Photo[];
  refreshStorageInfo: () => void;
  setStorageQuota: (quotaMB: number) => void;
  clearAllPhotos: () => void;
}
