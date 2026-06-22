import {
  SprinklerRecord,
  CommunityRoadStats,
  ContributionStats,
  CommunitySettings,
  AnonymityLevel,
  StorageKeys,
  DataSource,
} from '../types';
import { storage } from '../utils/storage';
import { generateId } from '../utils/format';

const generateMockContributorId = (): string => {
  return 'user_' + Math.random().toString(36).substring(2, 10);
};

const generateMockCommunityRoads = (): string[] => {
  return [
    '中山路', '人民路', '建设路', '解放路', '和平路',
    '长江路', '黄河路', '珠江路', '松花江路', '嫩江路',
    '牡丹江路', '金沙江路', '大渡河路', '淮河路', '海河路',
    '洛川路', '汶水路', '合川路', '虹梅路', '漕宝路',
  ];
};

const seedRandom = (seed: number) => {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const generateMockCommunityRecords = (localRecords: SprinklerRecord[]): SprinklerRecord[] => {
  const roads = generateMockCommunityRoads();
  const records: SprinklerRecord[] = [];
  const now = Date.now();

  for (let i = 0; i < 150; i++) {
    const seed = i * 12345 + 789;
    const roadIdx = Math.floor(seedRandom(seed) * roads.length);
    const daysAgo = Math.floor(seedRandom(seed + 1) * 60);
    const hour = Math.floor(seedRandom(seed + 2) * 24);
    const minute = Math.floor(seedRandom(seed + 3) * 60);
    const isSplashed = seedRandom(seed + 4) > 0.4;

    const timestamp = now - daysAgo * 24 * 60 * 60 * 1000 - hour * 60 * 60 * 1000 - minute * 60 * 1000;
    const date = new Date(timestamp);

    records.push({
      id: 'community_' + i,
      timestamp,
      date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      hour,
      minute,
      dayOfWeek: date.getDay(),
      road: roads[roadIdx],
      isSplashed,
      dataSource: 'community' as DataSource,
      contributorId: 'contributor_' + Math.floor(seedRandom(seed + 5) * 50),
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  const localRoads = new Set(localRecords.map(r => r.road));
  roads.forEach(road => {
    if (!localRoads.has(road)) {
      for (let i = 0; i < 3; i++) {
        const seed = roads.indexOf(road) * 100 + i * 999;
        const daysAgo = Math.floor(seedRandom(seed) * 30);
        const hour = 6 + Math.floor(seedRandom(seed + 1) * 14);
        const minute = Math.floor(seedRandom(seed + 2) * 60);
        const isSplashed = seedRandom(seed + 3) > 0.5;

        const timestamp = now - daysAgo * 24 * 60 * 60 * 1000 - hour * 60 * 60 * 1000 - minute * 60 * 1000;
        const date = new Date(timestamp);

        records.push({
          id: 'community_extra_' + road + '_' + i,
          timestamp,
          date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
          time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
          hour,
          minute,
          dayOfWeek: date.getDay(),
          road,
          isSplashed,
          dataSource: 'community' as DataSource,
          contributorId: 'contributor_' + Math.floor(seedRandom(seed + 4) * 30),
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      }
    }
  });

  return records;
};

const anonymizeRecord = (
  record: SprinklerRecord,
  settings: CommunitySettings
): SprinklerRecord => {
  const anonymized: SprinklerRecord = {
    ...record,
    id: 'comm_' + generateId(),
    dataSource: 'community',
    contributorId: settings.contributorId,
  };

  switch (settings.anonymityLevel) {
    case 'full':
      delete anonymized.note;
      delete anonymized.photos;
      anonymized.contributorId = 'anonymous';
      break;
    case 'partial':
      if (!settings.shareNotes) delete anonymized.note;
      if (!settings.sharePhotos) delete anonymized.photos;
      break;
    case 'none':
      if (!settings.shareNotes) delete anonymized.note;
      if (!settings.sharePhotos) delete anonymized.photos;
      break;
  }

  return anonymized;
};

export const communityService = {
  getCommunityRecords(localRecords: SprinklerRecord[]): SprinklerRecord[] {
    const stored = storage.get<SprinklerRecord[]>(StorageKeys.COMMUNITY_RECORDS, []);
    if (stored.length > 0) return stored;

    const mockRecords = generateMockCommunityRecords(localRecords);
    storage.set(StorageKeys.COMMUNITY_RECORDS, mockRecords);
    return mockRecords;
  },

  getSyncedIds(): Set<string> {
    const ids = storage.get<string[]>(StorageKeys.COMMUNITY_SYNCED_IDS, []);
    return new Set(ids);
  },

  addSyncedIds(ids: string[]): void {
    const existing = this.getSyncedIds();
    ids.forEach(id => existing.add(id));
    storage.set(StorageKeys.COMMUNITY_SYNCED_IDS, Array.from(existing));
  },

  isRecordSynced(recordId: string): boolean {
    return this.getSyncedIds().has(recordId);
  },

  async submitRecord(
    record: SprinklerRecord,
    settings: CommunitySettings
  ): Promise<boolean> {
    if (!settings.enabled) return false;
    if (this.isRecordSynced(record.id)) return true;

    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));

    const anonymized = anonymizeRecord(record, settings);
    const allRecords = this.getCommunityRecords([]);
    allRecords.unshift(anonymized);
    storage.set(StorageKeys.COMMUNITY_RECORDS, allRecords);
    this.addSyncedIds([record.id]);

    return true;
  },

  async submitRecords(
    records: SprinklerRecord[],
    settings: CommunitySettings
  ): Promise<number> {
    if (!settings.enabled) return 0;

    const unsynced = records.filter(r => !this.isRecordSynced(r.id));
    let submitted = 0;

    for (const record of unsynced) {
      const success = await this.submitRecord(record, settings);
      if (success) submitted++;
    }

    return submitted;
  },

  async fetchCommunityData(localRecords: SprinklerRecord[]): Promise<SprinklerRecord[]> {
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
    return this.getCommunityRecords(localRecords);
  },

  generateRoadStats(
    communityRecords: SprinklerRecord[]
  ): CommunityRoadStats[] {
    const roadMap = new Map<string, {
      total: number;
      splashed: number;
      contributors: Set<string>;
      lastAt: number;
    }>();

    communityRecords.forEach(record => {
      const existing = roadMap.get(record.road) || {
        total: 0,
        splashed: 0,
        contributors: new Set<string>(),
        lastAt: 0,
      };
      existing.total++;
      if (record.isSplashed) existing.splashed++;
      if (record.contributorId && record.contributorId !== 'anonymous') {
        existing.contributors.add(record.contributorId);
      }
      if (record.timestamp > existing.lastAt) existing.lastAt = record.timestamp;
      roadMap.set(record.road, existing);
    });

    const stats: CommunityRoadStats[] = Array.from(roadMap.entries()).map(
      ([roadName, data]) => ({
        roadName,
        totalRecords: data.total,
        splashCount: data.splashed,
        splashRate: data.total > 0 ? data.splashed / data.total : 0,
        contributorCount: data.contributors.size,
        lastContributionAt: data.lastAt,
        rank: 0,
      })
    );

    stats.sort((a, b) => b.totalRecords - a.totalRecords);
    stats.forEach((s, i) => (s.rank = i + 1));

    return stats;
  },

  generateContributionStats(
    localRecords: SprinklerRecord[],
    settings: CommunitySettings
  ): ContributionStats {
    const syncedIds = this.getSyncedIds();
    const contributedRecords = localRecords.filter(r => syncedIds.has(r.id));

    const roadsContributed = new Set(contributedRecords.map(r => r.road));
    const timestamps = contributedRecords.map(r => r.timestamp).sort((a, b) => a - b);

    const weeklyMap = new Map<string, number>();
    contributedRecords.forEach(record => {
      const date = new Date(record.timestamp);
      const day = date.getDay() || 7;
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - day + 1);
      const weekKey = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
      weeklyMap.set(weekKey, (weeklyMap.get(weekKey) || 0) + 1);
    });

    const weeklyContributions = Array.from(weeklyMap.entries())
      .map(([week, count]) => ({ week, count }))
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-12);

    const level = Math.min(10, Math.floor(contributedRecords.length / 10) + Math.floor(roadsContributed.size / 5) + 1);

    return {
      totalContributed: contributedRecords.length,
      roadsContributed: roadsContributed.size,
      firstContributionAt: timestamps.length > 0 ? timestamps[0] : null,
      lastContributionAt: timestamps.length > 0 ? timestamps[timestamps.length - 1] : null,
      weeklyContributions,
      level,
    };
  },

  getDefaultCommunitySettings(): CommunitySettings {
    return {
      enabled: false,
      anonymityLevel: 'full' as AnonymityLevel,
      autoShare: false,
      shareNotes: false,
      sharePhotos: false,
      useCommunityData: true,
      contributorId: generateMockContributorId(),
      lastSyncAt: null,
      contributedCount: 0,
    };
  },
};
