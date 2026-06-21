import { useMemo } from 'react';
import { useRecords, usePredictions } from '../store/useAppStore';
import { getTodayPredictions, searchPredictions } from '../utils/analysis';
import { isToday } from '../utils/format';

export const useTodayRecords = () => {
  const records = useRecords();
  return useMemo(
    () => records.filter((r) => isToday(r.timestamp)),
    [records]
  );
};

export const useTodayPredictions = () => {
  const predictions = usePredictions();
  const currentHour = new Date().getHours();
  return useMemo(
    () => getTodayPredictions(predictions, currentHour),
    [predictions, currentHour]
  );
};

export const useFavoritePredictions = (favoriteRoads: string[]) => {
  const predictions = usePredictions();
  return useMemo(
    () => predictions.filter((p) => favoriteRoads.includes(p.roadName)),
    [predictions, favoriteRoads]
  );
};

export const useSearchPredictions = (query: string) => {
  const predictions = usePredictions();
  return useMemo(
    () => searchPredictions(predictions, query),
    [predictions, query]
  );
};

export const useSplashStatistics = () => {
  const records = useRecords();
  return useMemo(() => {
    const total = records.length;
    const splashed = records.filter((r) => r.isSplashed).length;
    const rate = total > 0 ? splashed / total : 0;
    const thisMonth = records.filter(
      (r) => new Date(r.timestamp).getMonth() === new Date().getMonth()
    );
    const thisMonthSplashed = thisMonth.filter((r) => r.isSplashed).length;
    const thisMonthRate = thisMonth.length > 0 ? thisMonthSplashed / thisMonth.length : 0;
    return {
      total,
      splashed,
      rate,
      thisMonthTotal: thisMonth.length,
      thisMonthSplashed,
      thisMonthRate,
    };
  }, [records]);
};

export const useRoadList = () => {
  const records = useRecords();
  return useMemo(() => {
    const roads = new Set(records.map((r) => r.road));
    return Array.from(roads).sort();
  }, [records]);
};

export const useRecordsByRoad = (road: string) => {
  const records = useRecords();
  return useMemo(
    () => records.filter((r) => r.road === road).sort((a, b) => b.timestamp - a.timestamp),
    [records, road]
  );
};

export const useRecentRecords = (days: number = 7) => {
  const records = useRecords();
  const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
  return useMemo(
    () =>
      records
        .filter((r) => r.timestamp >= cutoffTime)
        .sort((a, b) => b.timestamp - a.timestamp),
    [records, cutoffTime]
  );
};

export const useUpcomingReminders = (reminderMinutes: number = 15) => {
  const predictions = useTodayPredictions();
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return useMemo(() => {
    const reminders: Array<{
      road: string;
      time: string;
      minutesLeft: number;
      probability: number;
      confidence: number;
    }> = [];

    predictions.forEach((p) => {
      p.predictedTimes.forEach((pt) => {
        const predictionMinutes = pt.hour * 60 + pt.minute;
        const diff = predictionMinutes - currentMinutes;
        if (diff > 0 && diff <= reminderMinutes * 2) {
          reminders.push({
            road: p.roadName,
            time: pt.averageTime,
            minutesLeft: diff,
            probability: pt.probability,
            confidence: pt.confidence,
          });
        }
      });
    });

    return reminders.sort((a, b) => a.minutesLeft - b.minutesLeft);
  }, [predictions, currentMinutes, reminderMinutes]);
};
