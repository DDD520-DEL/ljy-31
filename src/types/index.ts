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

export interface AppSettings {
  theme: 'light' | 'dark';
  reminderEnabled: boolean;
  reminderMinutes: number;
  favoriteRoads: string[];
  weatherNotificationEnabled: boolean;
}

export enum StorageKeys {
  RECORDS = 'sprinkler_records',
  PREDICTIONS = 'sprinkler_predictions',
  SETTINGS = 'sprinkler_settings',
  WEATHER = 'sprinkler_weather',
}

export interface AppState {
  records: SprinklerRecord[];
  predictions: RoadPrediction[];
  statistics: StatisticsData | null;
  settings: AppSettings;
  weather: WeatherData | null;
  isLoading: boolean;
  isWeatherLoading: boolean;
  addRecord: (record: Omit<SprinklerRecord, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateRecord: (id: string, record: Partial<SprinklerRecord>) => void;
  deleteRecord: (id: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  refreshPredictions: () => void;
  refreshStatistics: () => void;
  loadMockData: () => void;
  exportData: () => string;
  refreshWeather: () => Promise<WeatherData>;
  getWeatherAdjustment: (probability: number) => WeatherAdjustment;
}
