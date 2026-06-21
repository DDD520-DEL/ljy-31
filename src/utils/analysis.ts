import {
  SprinklerRecord,
  RoadPrediction,
  PredictedTime,
  StatisticsData,
  WeeklyReport,
  RoadWeeklyStats,
  HighRiskPeriod,
} from '../types';
import { formatDate, getDayOfWeek, getRecentDays, getDayName, generateId } from './format';

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

export const getWeekStartDate = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const getWeekDates = (weekStart: Date): string[] => {
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    dates.push(formatDate(d.getTime()));
  }
  return dates;
};

export const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

export const filterRecordsByWeek = (records: SprinklerRecord[], weekStart: Date): SprinklerRecord[] => {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  return records.filter(
    (r) => r.timestamp >= weekStart.getTime() && r.timestamp < weekEnd.getTime()
  );
};

const calcTrend = (current: number, previous: number): { trend: 'up' | 'down' | 'stable'; changeRate: number } => {
  if (previous === 0) {
    return { trend: current > 0 ? 'up' : 'stable', changeRate: current > 0 ? 100 : 0 };
  }
  const changeRate = ((current - previous) / previous) * 100;
  if (Math.abs(changeRate) < 2) return { trend: 'stable', changeRate: 0 };
  return {
    trend: changeRate > 0 ? 'up' : 'down',
    changeRate: Math.round(changeRate * 10) / 10,
  };
};

const generateRoadStats = (
  currentRecords: SprinklerRecord[],
  previousRecords: SprinklerRecord[]
): RoadWeeklyStats[] => {
  const currentByRoad = groupRecordsByRoad(currentRecords);
  const previousByRoad = groupRecordsByRoad(previousRecords);
  const allRoads = new Set([...Object.keys(currentByRoad), ...Object.keys(previousByRoad)]);

  const stats: RoadWeeklyStats[] = [];
  allRoads.forEach((road) => {
    const curr = currentByRoad[road] || [];
    const prev = previousByRoad[road] || [];
    const currSplash = curr.filter((r) => r.isSplashed).length;
    const prevSplash = prev.filter((r) => r.isSplashed).length;
    const currRate = curr.length > 0 ? currSplash / curr.length : 0;
    const prevRate = prev.length > 0 ? prevSplash / prev.length : 0;
    const { trend, changeRate } = calcTrend(currRate * 100, prevRate * 100);

    stats.push({
      road,
      recordCount: curr.length,
      splashCount: currSplash,
      splashRate: currRate,
      prevRecordCount: prev.length,
      prevSplashCount: prevSplash,
      prevSplashRate: prevRate,
      changeRate,
      trend,
    });
  });

  return stats.sort((a, b) => b.recordCount - a.recordCount);
};

const generateHighRiskPeriods = (records: SprinklerRecord[]): HighRiskPeriod[] => {
  if (records.length === 0) return [];

  const groups: Record<string, { total: number; splashed: number }> = {};

  records.forEach((record) => {
    const hourBlock = Math.floor(record.hour / 3) * 3;
    const key = `${record.dayOfWeek}-${hourBlock}`;
    if (!groups[key]) {
      groups[key] = { total: 0, splashed: 0 };
    }
    groups[key].total++;
    if (record.isSplashed) groups[key].splashed++;
  });

  const periods: HighRiskPeriod[] = Object.entries(groups)
    .map(([key, data]) => {
      const [dayStr, hourStr] = key.split('-');
      const dayOfWeek = parseInt(dayStr, 10);
      const hour = parseInt(hourStr, 10);
      const splashRate = data.total > 0 ? data.splashed / data.total : 0;

      let riskLevel: 'high' | 'medium' | 'low' = 'low';
      if (splashRate >= 0.6 && data.total >= 3) riskLevel = 'high';
      else if (splashRate >= 0.4 && data.total >= 2) riskLevel = 'medium';

      return {
        dayOfWeek,
        dayName: getDayName(dayOfWeek),
        hour,
        hourRange: `${String(hour).padStart(2, '0')}:00-${String(hour + 3).padStart(2, '0')}:00`,
        riskLevel,
        recordCount: data.total,
        splashRate,
      };
    })
    .filter((p) => p.riskLevel !== 'low' || p.recordCount >= 2)
    .sort((a, b) => {
      const levelOrder = { high: 0, medium: 1, low: 2 };
      if (levelOrder[a.riskLevel] !== levelOrder[b.riskLevel]) {
        return levelOrder[a.riskLevel] - levelOrder[b.riskLevel];
      }
      return b.splashRate - a.splashRate;
    })
    .slice(0, 8);

  return periods;
};

const generateDailySummary = (
  records: SprinklerRecord[],
  weekDates: string[]
): WeeklyReport['dailySummary'] => {
  const byDate = groupRecordsByDate(records);
  return weekDates.map((date) => {
    const dayRecords = byDate[date] || [];
    const splashCount = dayRecords.filter((r) => r.isSplashed).length;
    const d = new Date(date + 'T00:00:00');
    return {
      date,
      dayName: getDayName(d.getDay()),
      recordCount: dayRecords.length,
      splashCount,
      splashRate: dayRecords.length > 0 ? splashCount / dayRecords.length : 0,
    };
  });
};

export const generateWeeklyReport = (
  records: SprinklerRecord[],
  weekStartDate?: string
): WeeklyReport | null => {
  const now = new Date();
  let weekStart: Date;

  if (weekStartDate) {
    weekStart = new Date(weekStartDate + 'T00:00:00');
  } else {
    weekStart = getWeekStartDate(now);
  }

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  weekEnd.setDate(weekEnd.getDate() - 1);

  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(weekStart.getDate() - 7);

  const currentWeekRecords = filterRecordsByWeek(records, weekStart);
  const previousWeekRecords = filterRecordsByWeek(records, prevWeekStart);

  if (currentWeekRecords.length === 0 && previousWeekRecords.length === 0) {
    return null;
  }

  const totalRecords = currentWeekRecords.length;
  const totalSplashed = currentWeekRecords.filter((r) => r.isSplashed).length;
  const overallSplashRate = totalRecords > 0 ? totalSplashed / totalRecords : 0;

  const prevTotalRecords = previousWeekRecords.length;
  const prevTotalSplashed = previousWeekRecords.filter((r) => r.isSplashed).length;
  const prevOverallSplashRate = prevTotalRecords > 0 ? prevTotalSplashed / prevTotalRecords : 0;

  const { trend: overallTrend, changeRate: overallChange } = calcTrend(
    overallSplashRate * 100,
    prevOverallSplashRate * 100
  );

  const roadStats = generateRoadStats(currentWeekRecords, previousWeekRecords);
  const topSplashRoads = [...roadStats]
    .filter((r) => r.recordCount > 0)
    .sort((a, b) => b.splashRate - a.splashRate)
    .slice(0, 5);
  const mostImprovedRoads = [...roadStats]
    .filter((r) => r.recordCount > 0 && r.prevRecordCount > 0)
    .sort((a, b) => a.changeRate - b.changeRate)
    .slice(0, 5);

  const weekDates = getWeekDates(weekStart);
  const dailySummary = generateDailySummary(currentWeekRecords, weekDates);
  const highRiskPeriods = generateHighRiskPeriods(currentWeekRecords);

  return {
    id: generateId(),
    weekStart: formatDate(weekStart.getTime()),
    weekEnd: formatDate(weekEnd.getTime()),
    weekNumber: getWeekNumber(weekStart),
    generatedAt: Date.now(),
    totalRecords,
    totalSplashed,
    overallSplashRate,
    prevTotalRecords,
    prevTotalSplashed,
    prevOverallSplashRate,
    overallChange,
    overallTrend,
    roadStats,
    highRiskPeriods,
    topSplashRoads,
    mostImprovedRoads,
    dailySummary,
  };
};

export const shouldGenerateWeeklyReport = (
  autoGenerate: boolean,
  lastGeneratedAt: number | null,
  pushDay: number,
  pushHour: number,
  pushMinute: number
): boolean => {
  if (!autoGenerate) return false;

  const now = new Date();
  const currentDay = now.getDay() === 0 ? 7 : now.getDay();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const nowMinutes = currentDay * 24 * 60 + currentHour * 60 + currentMinute;
  const pushMinutes = pushDay * 24 * 60 + pushHour * 60 + pushMinute;

  if (nowMinutes < pushMinutes) return false;

  if (lastGeneratedAt) {
    const lastDate = new Date(lastGeneratedAt);
    const lastWeekStart = getWeekStartDate(lastDate);
    const currentWeekStart = getWeekStartDate(now);
    if (lastWeekStart.getTime() === currentWeekStart.getTime()) return false;
  }

  return true;
};
