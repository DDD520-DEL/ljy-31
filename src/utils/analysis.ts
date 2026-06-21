import { SprinklerRecord, RoadPrediction, PredictedTime, StatisticsData } from '../types';
import { formatDate, getDayOfWeek, getRecentDays } from './format';

export const groupRecordsByRoad = (records: SprinklerRecord[]): Record<string, SprinklerRecord[]> => {
  return records.reduce((acc, record) => {
    if (!acc[record.road]) {
      acc[record.road] = [];
    }
    acc[record.road].push(record);
    return acc;
  }, {} as Record<string, SprinklerRecord[]>);
};

export const groupRecordsByDate = (records: SprinklerRecord[]): Record<string, SprinklerRecord[]> => {
  return records.reduce((acc, record) => {
    const date = formatDate(record.timestamp);
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(record);
    return acc;
  }, {} as Record<string, SprinklerRecord[]>);
};

export const groupRecordsByHour = (records: SprinklerRecord[]): Record<number, SprinklerRecord[]> => {
  return records.reduce((acc, record) => {
    if (!acc[record.hour]) {
      acc[record.hour] = [];
    }
    acc[record.hour].push(record);
    return acc;
  }, {} as Record<number, SprinklerRecord[]>);
};

export const calculateHourlyDistribution = (records: SprinklerRecord[]): Record<number, number> => {
  const hourlyCounts: Record<number, number> = {};
  for (let i = 0; i < 24; i++) {
    hourlyCounts[i] = 0;
  }
  records.forEach(record => {
    hourlyCounts[record.hour] = (hourlyCounts[record.hour] || 0) + 1;
  });
  return hourlyCounts;
};

export const clusterTimes = (records: SprinklerRecord[], thresholdMinutes: number = 45): PredictedTime[] => {
  if (records.length === 0) return [];

  const sortedRecords = [...records].sort((a, b) => a.timestamp - b.timestamp);
  const clusters: SprinklerRecord[][] = [];
  let currentCluster: SprinklerRecord[] = [sortedRecords[0]];

  for (let i = 1; i < sortedRecords.length; i++) {
    const current = sortedRecords[i];
    const lastInCluster = currentCluster[currentCluster.length - 1];
    const diffMinutes = (current.timestamp - lastInCluster.timestamp) / (1000 * 60);

    if (diffMinutes <= thresholdMinutes * 12) {
      const avgHour = currentCluster.reduce((sum, r) => sum + r.hour * 60 + r.minute, 0) / currentCluster.length;
      const currentMinutes = current.hour * 60 + current.minute;
      if (Math.abs(currentMinutes - avgHour) <= thresholdMinutes * 3) {
        currentCluster.push(current);
        continue;
      }
    }
    clusters.push(currentCluster);
    currentCluster = [current];
  }
  clusters.push(currentCluster);

  return clusters
    .filter(cluster => cluster.length >= 1)
    .map(cluster => {
      const totalMinutes = cluster.reduce((sum, r) => sum + r.hour * 60 + r.minute, 0);
      const avgMinutes = totalMinutes / cluster.length;
      const hour = Math.floor(avgMinutes / 60);
      const minute = Math.round(avgMinutes % 60);

      const variance = cluster.reduce((sum, r) => {
        const diff = (r.hour * 60 + r.minute) - avgMinutes;
        return sum + diff * diff;
      }, 0) / cluster.length;
      const stdDev = Math.sqrt(variance);
      const confidence = Math.max(0, 1 - stdDev / 120) * (1 - 1 / (cluster.length + 2));

      const splashedCount = cluster.filter(r => r.isSplashed).length;
      const probability = cluster.length > 0 ? splashedCount / cluster.length : 0;

      return {
        hour,
        minute,
        probability,
        averageTime: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
        confidence: Math.round(confidence * 100) / 100,
      };
    })
    .sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute));
};

export const generateRoadPrediction = (roadName: string, records: SprinklerRecord[]): RoadPrediction => {
  const splashCount = records.filter(r => r.isSplashed).length;
  const predictedTimes = clusterTimes(records);
  const hourlyDistribution = calculateHourlyDistribution(records);

  return {
    roadName,
    recordCount: records.length,
    splashCount,
    splashProbability: records.length > 0 ? splashCount / records.length : 0,
    predictedTimes,
    hourlyDistribution,
    lastUpdated: Date.now(),
  };
};

export const generateAllPredictions = (records: SprinklerRecord[]): RoadPrediction[] => {
  const grouped = groupRecordsByRoad(records);
  return Object.entries(grouped)
    .map(([roadName, roadRecords]) => generateRoadPrediction(roadName, roadRecords))
    .sort((a, b) => b.recordCount - a.recordCount);
};

export const generateStatistics = (records: SprinklerRecord[]): StatisticsData => {
  const totalRecords = records.length;
  const totalSplashed = records.filter(r => r.isSplashed).length;
  const splashRate = totalRecords > 0 ? totalSplashed / totalRecords : 0;

  const recordsByDate = groupRecordsByDate(records);
  const recentDays = getRecentDays(30);
  const recordsByDay = recentDays.map(date => ({
    date,
    count: recordsByDate[date]?.length || 0,
    splashed: recordsByDate[date]?.filter(r => r.isSplashed).length || 0,
  }));

  const recordsByHourGroup = groupRecordsByHour(records);
  const recordsByHour = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    count: recordsByHourGroup[i]?.length || 0,
    splashed: recordsByHourGroup[i]?.filter(r => r.isSplashed).length || 0,
  }));

  const roadGroups = groupRecordsByRoad(records);
  const topRoads = Object.entries(roadGroups)
    .map(([road, roadRecords]) => ({
      road,
      count: roadRecords.length,
      splashRate: roadRecords.filter(r => r.isSplashed).length / roadRecords.length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const heatmapData: Array<{ hour: number; day: number; count: number }> = [];
  const heatmapGroups: Record<string, number> = {};
  records.forEach(record => {
    const key = `${record.hour}-${getDayOfWeek(record.timestamp)}`;
    heatmapGroups[key] = (heatmapGroups[key] || 0) + 1;
  });
  for (let hour = 0; hour < 24; hour++) {
    for (let day = 0; day < 7; day++) {
      heatmapData.push({
        hour,
        day,
        count: heatmapGroups[`${hour}-${day}`] || 0,
      });
    }
  }

  const last30Days = getRecentDays(30);
  const monthlyTrend = last30Days.map(date => ({
    date,
    count: recordsByDate[date]?.length || 0,
  }));

  return {
    totalRecords,
    totalSplashed,
    splashRate,
    recordsByDay,
    recordsByHour,
    topRoads,
    heatmapData,
    monthlyTrend,
  };
};

export const getTodayPredictions = (predictions: RoadPrediction[], currentHour: number): RoadPrediction[] => {
  return predictions
    .filter(p => p.predictedTimes.some(t => t.hour >= currentHour - 1 && t.hour <= currentHour + 3))
    .map(p => ({
      ...p,
      predictedTimes: p.predictedTimes.filter(t => t.hour >= currentHour - 1 && t.hour <= currentHour + 3),
    }))
    .filter(p => p.predictedTimes.length > 0);
};

export const searchPredictions = (predictions: RoadPrediction[], query: string): RoadPrediction[] => {
  if (!query.trim()) return predictions;
  const lowerQuery = query.toLowerCase();
  return predictions.filter(p => p.roadName.toLowerCase().includes(lowerQuery));
};
