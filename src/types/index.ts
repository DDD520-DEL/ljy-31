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

export interface AppSettings {
  theme: 'light' | 'dark';
  reminderEnabled: boolean;
  reminderMinutes: number;
  favoriteRoads: string[];
}

export enum StorageKeys {
  RECORDS = 'sprinkler_records',
  PREDICTIONS = 'sprinkler_predictions',
  SETTINGS = 'sprinkler_settings',
}

export interface AppState {
  records: SprinklerRecord[];
  predictions: RoadPrediction[];
  statistics: StatisticsData | null;
  settings: AppSettings;
  isLoading: boolean;
  addRecord: (record: Omit<SprinklerRecord, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateRecord: (id: string, record: Partial<SprinklerRecord>) => void;
  deleteRecord: (id: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  refreshPredictions: () => void;
  refreshStatistics: () => void;
  loadMockData: () => void;
  exportData: () => string;
}
